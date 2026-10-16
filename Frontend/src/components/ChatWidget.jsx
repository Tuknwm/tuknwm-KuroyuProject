import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { X, ArrowUp } from 'lucide-react';
import { imgUrl } from '../utils';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

function timeLabel(iso) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function getAuth() {
  const token = sessionStorage.getItem('kuroyu_token') || localStorage.getItem('kuroyu_token');
  try {
    const user = JSON.parse(sessionStorage.getItem('kuroyu_user') || localStorage.getItem('kuroyu_user'));
    return { token, user };
  } catch { return { token, user: null }; }
}

function AdminChatPanel({ token, onClose, closing }) {
  const [chats, setChats] = useState([]);
  const [selected, setSelected] = useState(null);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/chat/admin`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) { setChats(d.chats); if (d.chats.length) setSelected(d.chats[0]); } });
  }, []);

  useEffect(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }), 30);
  }, [selected?._id, selected?.messages?.length]);

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || sending || !selected) return;
    setSending(true);
    setText('');
    try {
      const res = await fetch(`${API}/chat/admin/${selected.user._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json();
      if (data.success) {
        const updated = { ...selected, messages: [...selected.messages, data.message] };
        setSelected(updated);
        setChats(prev => prev.map(c => c._id === updated._id ? updated : c));
      }
    } finally { setSending(false); }
  }

  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div style={{
      width: 580, height: 520,
      background: 'rgba(38,38,38,0.92)',
      backdropFilter: 'blur(16px) saturate(180%)',
      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      borderRadius: 8,
      boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', color: '#FCFFFC',
      animation: `${closing ? 'chatSlideOut' : 'chatSlideIn'} ${closing ? '0.32s' : '0.4s'} cubic-bezier(0.16,1,0.3,1)`,
    }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid rgba(252,255,252,0.08)', background: 'rgba(252,255,252,0.03)', flexShrink: 0 }}>
        <img src="/CatLogoWhite.png" alt="Kuroyu" style={{ width: 28, height: 28, objectFit: 'contain' }} />
        <div style={{ flex: 1, fontWeight: 700, fontSize: 13 }}>User Chats</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(252,255,252,0.4)', display: 'flex', padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        <div onWheel={e => e.stopPropagation()} style={{ width: 180, borderRight: '1px solid rgba(252,255,252,0.08)', overflowY: 'auto', flexShrink: 0 }}>
          {chats.length === 0 && (
            <div style={{ padding: 16, fontSize: 12, color: 'rgba(252,255,252,0.3)', textAlign: 'center' }}>No chats yet</div>
          )}
          {chats.map(c => {
            const last = c.messages[c.messages.length - 1];
            const isActive = selected?._id === c._id;
            return (
              <button key={c._id} onClick={() => setSelected(c)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 12px',
                  background: isActive ? 'rgba(252,255,252,0.07)' : 'none',
                  border: 'none', borderBottom: '1px solid rgba(252,255,252,0.05)',
                  cursor: 'pointer', color: '#FCFFFC',
                }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2, truncate: true, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {c.user?.name || 'Unknown'}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(252,255,252,0.35)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                  {last ? last.text : 'No messages'}
                </div>
              </button>
            );
          })}
        </div>

        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'rgba(252,255,252,0.3)' }}>
              Select a user
            </div>
          ) : (
            <>
              <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(252,255,252,0.06)', fontSize: 12, fontWeight: 600 }}>
                {selected.user?.name} <span style={{ color: 'rgba(252,255,252,0.35)', fontWeight: 400 }}>{selected.user?.email}</span>
              </div>
              <div ref={messagesRef} className="chat-messages"
                onWheel={e => e.stopPropagation()}
                style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 6, scrollbarWidth: 'thin', scrollbarColor: 'rgba(252,255,252,0.15) transparent' }}>
                {selected.messages.map(msg => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div key={msg._id} style={{ display: 'flex', justifyContent: isUser ? 'flex-start' : 'flex-end' }}>
                      <div style={{
                        maxWidth: '80%',
                        background: isUser ? 'rgba(252,255,252,0.07)' : 'rgba(217,72,64,0.18)',
                        borderRadius: isUser ? '12px 12px 12px 4px' : '12px 12px 4px 12px',
                        padding: '7px 11px',
                      }}>
                        {msg.productRef?.id && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6, background: 'rgba(0,0,0,0.2)', borderRadius: 7, padding: '5px 7px' }}>
                            {msg.productRef.image && <img src={imgUrl(msg.productRef.image)} alt={msg.productRef.title} style={{ width: 30, height: 30, borderRadius: 5, objectFit: 'cover', flexShrink: 0 }} />}
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140 }}>{msg.productRef.title}</div>
                              <div style={{ fontSize: 10, color: 'rgba(252,255,252,0.5)' }}>{prodCurrency.format(msg.productRef.price)}</div>
                            </div>
                          </div>
                        )}
                        <div style={{ fontSize: 12, lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-line' }}>{msg.text}</div>
                        <div style={{ fontSize: 10, color: 'rgba(252,255,252,0.3)', marginTop: 2, textAlign: 'right' }}>
                          {msg.createdAt ? timeLabel(msg.createdAt) : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', padding: '8px 10px', borderTop: '1px solid rgba(252,255,252,0.08)', flexShrink: 0 }}>
                <textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={onKey}
                  placeholder="Reply as Kuroyu Store..."
                  rows={1} style={{ flex: 1, background: 'rgba(252,255,252,0.07)', border: 'none', borderRadius: 8, padding: '7px 11px', color: '#FCFFFC', fontSize: 12, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 72, overflowY: 'auto' }}
                  onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 72) + 'px'; }}
                />
                <button onClick={send} disabled={!text.trim() || sending} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', flexShrink: 0, background: text.trim() && !sending ? '#D94840' : 'rgba(252,255,252,0.1)', color: text.trim() && !sending ? '#FCFFFC' : 'rgba(252,255,252,0.3)', cursor: text.trim() && !sending ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowUp size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const prodCurrency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

function UserChatPanel({ token, onClose, closing, initialProduct }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const initialLoad = useRef(true);
  const messagesRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (loaded || !token) return;
    fetch(`${API}/chat`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) setMessages(d.messages); })
      .finally(() => {
        setLoaded(true);
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: 'instant' });
          initialLoad.current = false;
        }, 50);
      });
  }, []);

  useEffect(() => {
    if (initialLoad.current) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const productSentRef = useRef(false);
  const [productPreviewDismissed, setProductPreviewDismissed] = useState(false);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || !token) return;
    setSending(true);
    setText('');

    const pRef = (!productSentRef.current && initialProduct)
      ? { id: initialProduct.id, title: initialProduct.title, price: initialProduct.price, image: initialProduct.image }
      : null;
    if (pRef) { productSentRef.current = true; setProductPreviewDismissed(true); }

    const tempId = `temp-${Date.now()}`;
    setMessages(prev => [...prev, { _id: tempId, sender: 'user', text: trimmed, productRef: pRef, createdAt: new Date().toISOString() }]);
    try {
      const body = { text: trimmed };
      if (pRef) body.productRef = pRef;
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) setMessages(prev => [...prev.filter(m => m._id !== tempId), ...data.messages]);
    } finally { setSending(false); }
  };

  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };

  return (
    <div style={{
      width: 360, height: 500,
      background: 'rgba(38,38,38,0.85)',
      backdropFilter: 'blur(16px) saturate(180%)',
      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
      borderRadius: 8,
      boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', color: '#FCFFFC',
      animation: `${closing ? 'chatSlideOut' : 'chatSlideIn'} ${closing ? '0.32s' : '0.4s'} cubic-bezier(0.16,1,0.3,1)`,
    }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid rgba(252,255,252,0.08)', background: 'rgba(252,255,252,0.03)', flexShrink: 0 }}>
        <img src="/CatLogoWhite.png" alt="Kuroyu" style={{ width: 32, height: 32, objectFit: 'contain', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: '-0.2px' }}>Kuroyu Store</div>
          <div style={{ fontSize: 11, color: 'rgba(252,255,252,0.4)' }}>Store support</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(252,255,252,0.4)', display: 'flex', padding: 4 }}>
          <X size={16} />
        </button>
      </div>

      
      <div ref={messagesRef} className="chat-messages"
        onWheel={e => { e.stopPropagation(); }}
        style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 8, scrollbarWidth: 'thin', scrollbarColor: 'rgba(252,255,252,0.15) transparent' }}>
        
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div style={{ maxWidth: '80%', background: 'rgba(252,255,252,0.07)', borderRadius: '14px 14px 14px 4px', padding: '8px 12px' }}>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>Hey! How can Kuroyu help you? Ask about products, stock, sizing, or anything else 😊</div>
            <div style={{ fontSize: 10, color: 'rgba(252,255,252,0.35)', marginTop: 3, textAlign: 'right' }}>Kuroyu Store</div>
          </div>
        </div>
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          const ref = msg.productRef;
          return (
            <div key={msg._id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
              <div style={{ maxWidth: '80%', background: isUser ? 'rgba(252,255,252,0.14)' : 'rgba(252,255,252,0.07)', borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px', padding: '8px 12px' }}>
                {ref?.id && (
                  <div onClick={() => window.location.href = `/product/${ref.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}>
                    {ref.image && <img src={imgUrl(ref.image)} alt={ref.title} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{ref.title}</div>
                      <div style={{ fontSize: 10, color: 'rgba(252,255,252,0.6)', marginTop: 1 }}>{prodCurrency.format(ref.price)}</div>
                    </div>
                  </div>
                )}
                <div style={{ fontSize: 13, lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-line' }}>{msg.text}</div>
                <div style={{ fontSize: 10, color: isUser ? 'rgba(252,255,252,0.6)' : 'rgba(252,255,252,0.35)', marginTop: 3, textAlign: 'right' }}>
                  {msg.createdAt ? timeLabel(msg.createdAt) : ''}
                </div>
              </div>
            </div>
          );
        })}
        {sending && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: 'rgba(252,255,252,0.08)', borderRadius: '14px 14px 14px 4px', padding: '10px 14px' }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(252,255,252,0.4)', animation: `chatBounce 1s ease-in-out ${i * 0.15}s infinite` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      
      {initialProduct && !productPreviewDismissed && (
        <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(252,255,252,0.08)', background: 'rgba(252,255,252,0.03)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {initialProduct.image && <img src={imgUrl(initialProduct.image)} alt={initialProduct.title} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#FCFFFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{initialProduct.title}</div>
            <div style={{ fontSize: 10, color: 'rgba(252,255,252,0.5)' }}>{prodCurrency.format(initialProduct.price)}</div>
          </div>
          <span style={{ fontSize: 10, color: 'rgba(252,255,252,0.3)', flexShrink: 0 }}>Akan disertakan</span>
        </div>
      )}

      
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', padding: '10px 12px', borderTop: '1px solid rgba(252,255,252,0.08)', flexShrink: 0 }}>
        <textarea value={text} onChange={e => setText(e.target.value)} onKeyDown={onKey}
          placeholder="Type a message..." rows={1}
          style={{ flex: 1, background: 'rgba(252,255,252,0.07)', border: 'none', borderRadius: 8, padding: '8px 12px', color: '#FCFFFC', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'inherit', lineHeight: 1.5, maxHeight: 80, overflowY: 'auto' }}
          onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px'; }}
        />
        <button onClick={send} disabled={!text.trim() || sending} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', flexShrink: 0, background: text.trim() && !sending ? '#D94840' : 'rgba(252,255,252,0.1)', color: text.trim() && !sending ? '#FCFFFC' : 'rgba(252,255,252,0.3)', cursor: text.trim() && !sending ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
          <ArrowUp size={15} />
        </button>
      </div>
    </div>
  );
}

export default function ChatWidget() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [pendingProduct, setPendingProduct] = useState(null);
  const pendingProductRef = useRef(null);

  const { token, user } = getAuth();
  const isAdmin = user?.role === 'admin';

  const close = () => {
    setClosing(true);
    setTimeout(() => { setOpen(false); setClosing(false); setPendingProduct(null); pendingProductRef.current = null; }, 320);
  };

  useEffect(() => {
    const handler = (e) => {
      const product = e.detail?.product || null;
      if (product) { pendingProductRef.current = product; setPendingProduct(product); }
      if (open) { if (!product) close(); }
      else setOpen(true);
    };
    window.addEventListener('kuroyu:open-chat', handler);
    return () => window.removeEventListener('kuroyu:open-chat', handler);
  }, [open]);

  if (pathname.startsWith('/settings')) return null;

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
      {open && (
        isAdmin
          ? <AdminChatPanel token={token} onClose={close} closing={closing} />
          : <UserChatPanel
              key={pendingProduct?.id || 'chat'}
              token={token} onClose={close} closing={closing}
              initialProduct={pendingProductRef.current}
            />
      )}
      <style>{`
        @keyframes chatBounce { 0%,100%{transform:translateY(0);opacity:.4} 50%{transform:translateY(-4px);opacity:1} }
        @keyframes chatSlideIn { 0%{opacity:0;transform:translateY(100%)} 100%{opacity:1;transform:translateY(0)} }
        @keyframes chatSlideOut { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(100%)} }
        .chat-messages::-webkit-scrollbar{width:4px}
        .chat-messages::-webkit-scrollbar-track{background:transparent}
        .chat-messages::-webkit-scrollbar-thumb{background:rgba(252,255,252,0.15);border-radius:4px}
      `}</style>
    </div>
  );
}
