import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import Header from '../HomePage/components/Header';
import Footer from '../HomePage/components/Footer';
import { imgUrl } from '../../utils';

const API = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

function timeLabel(iso) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export default function ChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromProduct = location.state?.product || null;

  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const initialLoad = useRef(true);
  const autoSentRef = useRef(false);

  const token = localStorage.getItem('kuroyu_token') || sessionStorage.getItem('kuroyu_token');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    fetch(`${API}/chat`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) setMessages(d.messages);
      })
      .finally(() => {
        setLoading(false);
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: 'instant' });
          initialLoad.current = false;
        }, 50);
      });
  }, []);

  useEffect(() => {
    if (!fromProduct || loading || autoSentRef.current) return;
    autoSentRef.current = true;
    const msg = `Hi, I'd like to ask about this product:\n\n📦 ${fromProduct.title}\n💰 ${currency.format(fromProduct.price)}\n\nIs this item still available?`;
    setTimeout(async () => {
      setSending(true);
      try {
        const res = await fetch(`${API}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ text: msg, productRef: { id: fromProduct.id, title: fromProduct.title, price: fromProduct.price, image: fromProduct.image } }),
        });
        const data = await res.json();
        if (data.success) setMessages(prev => [...prev, ...data.messages]);
      } finally {
        setSending(false);
      }
    }, 400);
  }, [fromProduct, loading]);

  useEffect(() => {
    if (initialLoad.current) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: trimmed }),
      });
      const data = await res.json();
      if (data.success) setMessages(prev => [...prev, ...data.messages]);
    } finally {
      setSending(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="min-h-screen flex flex-col font-body" style={{ background: '#262626', color: '#FCFFFC' }}>
      <Header />

      <main className="flex-1">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8 flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>

          
          <div className="flex items-center gap-3 mb-6 shrink-0">
            <button onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-60"
              style={{ color: 'rgba(252,255,252,0.45)' }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span style={{ color: 'rgba(252,255,252,0.2)' }}>/</span>
            <h1 className="text-xs font-medium" style={{ color: 'rgba(252,255,252,0.45)' }}>Store Chat</h1>
          </div>

          
          <div className="flex-1 flex flex-col rounded-2xl overflow-hidden min-h-0"
            style={{ border: '1px solid rgba(252,255,252,0.08)', background: 'rgba(252,255,252,0.02)' }}>

            
            <div className="flex items-center gap-3 px-5 py-4 shrink-0"
              style={{ borderBottom: '1px solid rgba(252,255,252,0.08)', background: 'rgba(252,255,252,0.03)' }}>
              <div style={{

                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <img src="/CatLogoWhite.png" alt="Kuroyu" style={{ width: 32, height: 32, objectFit: 'contain' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.2px' }}>Kuroyu Store</div>
                <div style={{ fontSize: 12, color: 'rgba(252,255,252,0.4)' }}>Official store support</div>
              </div>
            </div>

            
            <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-3">
              {loading && (
                <div className="text-center text-sm mt-10" style={{ color: 'rgba(252,255,252,0.3)' }}>
                  Loading messages...
                </div>
              )}

              {!loading && messages.length === 0 && (
                <div className="text-center mt-16">
                  <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>Chat with Kuroyu Store</div>
                  <div style={{ fontSize: 13, color: 'rgba(252,255,252,0.4)', maxWidth: 240, margin: '0 auto' }}>
                    Send a message and our team will reply as soon as possible.
                  </div>
                </div>
              )}

              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                const ref = msg.productRef;
                return (
                  <div key={msg._id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '68%',
                      background: isUser ? '#D94840' : 'rgba(252,255,252,0.08)',
                      color: '#FCFFFC',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      padding: '10px 14px',
                    }}>
                      
                      {ref && (
                        <div onClick={() => navigate(`/product/${ref.id}`)} style={{
                          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
                          background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '8px 10px',
                          cursor: 'pointer',
                        }}>
                          {ref.image && (
                            <img src={imgUrl(ref.image)} alt={ref.title} style={{ width: 44, height: 44, borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} />
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{ref.title}</div>
                            <div style={{ fontSize: 11, color: 'rgba(252,255,252,0.7)', marginTop: 2 }}>{currency.format(ref.price)}</div>
                          </div>
                        </div>
                      )}
                      <div style={{ fontSize: 14, lineHeight: 1.55, wordBreak: 'break-word', whiteSpace: 'pre-line' }}>{msg.text}</div>
                      <div style={{ fontSize: 11, color: isUser ? 'rgba(252,255,252,0.6)' : 'rgba(252,255,252,0.35)', marginTop: 4, textAlign: 'right' }}>
                        {msg.createdAt ? timeLabel(msg.createdAt) : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            
            <div className="flex gap-3 items-end px-5 py-4 shrink-0"
              style={{ borderTop: '1px solid rgba(252,255,252,0.08)' }}>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={onKey}
                placeholder="Type a message..."
                rows={1}
                style={{
                  flex: 1, background: 'rgba(252,255,252,0.07)',
                  border: '1px solid rgba(252,255,252,0.1)',
                  borderRadius: 12, padding: '10px 14px',
                  color: '#FCFFFC', fontSize: 14, resize: 'none',
                  outline: 'none', fontFamily: 'inherit', lineHeight: 1.5,
                  maxHeight: 120, overflowY: 'auto',
                }}
                onInput={e => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
              />
              <button
                onClick={send}
                disabled={!text.trim() || sending}
                style={{
                  width: 42, height: 42, borderRadius: 12, border: 'none',
                  background: text.trim() && !sending ? '#D94840' : 'rgba(252,255,252,0.1)',
                  color: text.trim() && !sending ? '#FCFFFC' : 'rgba(252,255,252,0.3)',
                  cursor: text.trim() && !sending ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, transition: 'background 0.2s',
                }}
              >
                <Send size={17} />
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
