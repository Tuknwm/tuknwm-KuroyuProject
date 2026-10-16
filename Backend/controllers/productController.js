const Product = require('../models/Product');
const Order   = require('../models/Order');
const User    = require('../models/User');

const getProducts = async (req, res) => {
  try {
    const { category, search, limit = 12, skip = 0, minPrice, maxPrice, sort, discount } = req.query;
    let filter = {};

    if (category && category !== 'all') filter.category = { $regex: category, $options: 'i' };

    if (search) {
      const words = search.trim().split(/\s+/).filter(Boolean);
      const wordClauses = words.flatMap(w => [
        { title: { $regex: w, $options: 'i' } },
        { category: { $regex: w, $options: 'i' } },
      ]);
      if (filter.category) {
        const catFilter = filter.category;
        delete filter.category;
        filter.$and = [{ category: catFilter }, { $or: wordClauses }];
      } else {
        filter.$or = wordClauses;
      }
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (discount === 'true') filter.discount = { $gt: 0 };

    const sortMap = {
      newest: { createdAt: -1 },
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      rating: { rating: -1 },
      sold: { soldCount: -1 },
    };
    const sortOpt = sortMap[sort] || { createdAt: -1 };

    const products = await Product.find(filter).skip(Number(skip)).limit(Number(limit)).sort(sortOpt);
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { title, price, category, stock, colors, sizes, description } = req.body;

    const BASE = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const imageUrls = (req.files || []).map(f => `${BASE}/uploads/${f.filename}`);

    const parsePrice = v => Number(String(v).replace(/\./g, '').replace(/,/g, ''));
    const product = await Product.create({
      title,
      price: parsePrice(price),
      category: category || 'General',
      stock: Number(stock) || 0,
      description: description || '',
      colors: colors ? JSON.parse(colors) : [],
      sizes:  sizes  ? JSON.parse(sizes)  : [],
      images: imageUrls,
      image:  imageUrls[0] || '',
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { title, price, category, stock, colors, sizes, description } = req.body;
    const BASE = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    const update = {};
    const parsePrice = v => Number(String(v).replace(/\./g, '').replace(/,/g, ''));
    if (title !== undefined)       update.title = title;
    if (price !== undefined)       update.price = parsePrice(price);
    if (category !== undefined)    update.category = category;
    if (stock !== undefined)       update.stock = Number(stock);
    if (description !== undefined) update.description = description;
    if (colors !== undefined)      update.colors    = JSON.parse(colors);
    if (sizes !== undefined)       update.sizes     = JSON.parse(sizes);
    if (req.body.disabled !== undefined) update.disabled = req.body.disabled === 'true' || req.body.disabled === true;
    if (req.files && req.files.length > 0) {
      const imageUrls = req.files.map(f => `${BASE}/uploads/${f.filename}`);
      update.images = imageUrls;
      update.image  = imageUrls[0];
    }
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const addReview = async (req, res) => {
  try {
    const { rating, text } = req.body;
    const productId = req.params.id;
    const userId = req.user.id;

    if (!rating || rating < 1 || rating > 5)
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });

    const now = new Date();
    const deliveredOrder = await Order.findOne({
      user: userId,
      cancelled: false,
      deliveredAt: { $lte: now },
      'items.productId': productId,
    });
    if (!deliveredOrder)
      return res.status(403).json({ success: false, message: 'You can only review products from delivered orders.' });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const already = product.reviews.some(r => r.userId.toString() === userId.toString());
    if (already)
      return res.status(409).json({ success: false, message: 'You have already reviewed this product.' });

    const user = await User.findById(userId).select('name');
    product.reviews.push({
      userId,
      userName: user?.name || 'Anonymous',
      rating: Number(rating),
      text: (text || '').trim(),
    });

    const total = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.rating = Math.round((total / product.reviews.length) * 10) / 10;
    product.reviewCount = product.reviews.length;

    await product.save();
    res.json({ success: true, rating: product.rating, reviewCount: product.reviewCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getReviews = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select('reviews rating reviewCount');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });
    res.json({ success: true, reviews: product.reviews, rating: product.rating, reviewCount: product.reviewCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  deleteProduct,
  updateProduct,
  addReview,
  getReviews,
};
