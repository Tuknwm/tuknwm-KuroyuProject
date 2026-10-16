const Groq = require('groq-sdk');
const Chat = require('../models/Chat');
const Product = require('../models/Product');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function getAIReply(userText, history, productRef) {
  let productContext;

  if (productRef?.id) {
    const p = await Product.findById(productRef.id, { title: 1, price: 1, stock: 1, category: 1, discount: 1 });
    if (p) {
      productContext = `Product the user is asking about:\n- ${p.title} | Category: ${p.category} | Price: Rp ${p.price.toLocaleString('id-ID')} | Stock: ${p.stock > 0 ? p.stock + ' available' : 'out of stock'}${p.discount ? ` | Discount: ${p.discount}%` : ''}`;
    }
  }

  if (!productContext) {
    const keywords = userText.split(/\s+/).filter(w => w.length > 2);
    const regex = keywords.length ? new RegExp(keywords.join('|'), 'i') : /.*/;
    let productList = await Product.find(
      { $or: [{ title: regex }, { category: regex }] },
      { title: 1, price: 1, stock: 1, category: 1, discount: 1 }
    ).limit(8);
    if (!productList.length) {
      productList = await Product.find({}, { title: 1, price: 1, stock: 1, category: 1, discount: 1 }).limit(20);
    }
    productContext = `Relevant product data:\n` + productList.map(p =>
      `- ${p.title} | Category: ${p.category} | Price: Rp ${p.price.toLocaleString('id-ID')} | Stock: ${p.stock > 0 ? p.stock + ' available' : 'out of stock'}${p.discount ? ` | Discount: ${p.discount}%` : ''}`
    ).join('\n');
  }

  const systemPrompt = `You are a customer service agent for Kuroyu, an online store. Reply in the same language as the user (Indonesian or English). Be concise, friendly, and helpful.

${productContext || 'No products found.'}

If asked about stock/price/availability, answer based on the data above. If a product is not in the data, say it is not available. Do not fabricate product data.`;

  const chatHistory = history.slice(-10).map(m => ({
    role: m.sender === 'user' ? 'user' : 'assistant',
    content: m.text,
  }));

  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      { role: 'system', content: systemPrompt },
      ...chatHistory,
      { role: 'user', content: userText },
    ],
    max_tokens: 300,
    temperature: 0.6,
  });

  return completion.choices[0]?.message?.content?.trim() || 'Maaf, saya tidak bisa menjawab saat ini.';
}

const getChat = async (req, res) => {
  try {
    const chat = await Chat.findOne({ user: req.user.id });
    res.json({ success: true, messages: chat ? chat.messages : [] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { text, productRef } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Message is required.' });

    const newMsg = { sender: 'user', text: text.trim() };
    if (productRef?.id) newMsg.productRef = { id: productRef.id, title: productRef.title, price: productRef.price, image: productRef.image };

    let chat = await Chat.findOneAndUpdate(
      { user: req.user.id },
      { $push: { messages: newMsg } },
      { upsert: true, returnDocument: 'after' },
    );
    const userMsg = chat.messages[chat.messages.length - 1];

    const replyText = await getAIReply(text.trim(), chat.messages, productRef);

    chat = await Chat.findOneAndUpdate(
      { user: req.user.id },
      { $push: { messages: { sender: 'store', text: replyText } } },
      { returnDocument: 'after' },
    );
    const aiMsg = chat.messages[chat.messages.length - 1];

    res.json({ success: true, messages: [userMsg, aiMsg] });
  } catch (err) {
    console.error('[chat] error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getAllChats = async (req, res) => {
  try {
    const chats = await Chat.find({})
      .populate('user', 'name email')
      .sort({ updatedAt: -1 });
    res.json({ success: true, chats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const adminReply = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Message is required.' });
    const chat = await Chat.findOneAndUpdate(
      { user: req.params.userId },
      { $push: { messages: { sender: 'store', text: text.trim() } } },
      { upsert: true, returnDocument: 'after' },
    );
    const msg = chat.messages[chat.messages.length - 1];
    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getChat, sendMessage, getAllChats, adminReply };
