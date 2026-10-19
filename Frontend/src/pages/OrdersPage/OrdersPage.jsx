import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Truck, CheckCircle, ChevronRight, ArrowLeft, Clock, CalendarClock, Star } from 'lucide-react';
import Header from '../HomePage/components/Header';
import Footer from '../HomePage/components/Footer';
import { imgUrl } from '../../utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const getToken = () => localStorage.getItem('kuroyu_token') || sessionStorage.getItem('kuroyu_token');

const STEPS = [
  { key: 'packed',    label: 'Packed',    Icon: Package },
  { key: 'shipped',   label: 'Shipped',   Icon: Truck },
  { key: 'delivered', label: 'Delivered', Icon: CheckCircle },
];

function liveStatus(order) {
  if (order.cancelled) return 'cancelled';
  if (order.status === 'shipped' && order.deliveredAt && Date.now() >= new Date(order.deliveredAt).getTime()) return 'delivered';
  return order.status || 'packed';
}

function stepIndex(status) { return STEPS.findIndex(s => s.key === status); }

function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtDay(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => {
        const filled = n <= (hovered || value);
        return (
          <button key={n} type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(n)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 1 }}>
            <Star size={28} fill={filled ? '#FBBF24' : 'none'} color={filled ? '#FBBF24' : 'rgba(252,255,252,0.25)'} strokeWidth={1.5} />
          </button>
        );
      })}
    </div>
  );
}

function ReviewModal({ order, onClose, onSuccess }) {
  const [selectedProduct, setSelectedProduct] = useState(order.items[0]);
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [closing, setClosing] = useState(false);

  function close() {
    setClosing(true);
    setTimeout(() => onClose(), 200);
  }

  async function handleSubmit() {
    if (!rating) { setError('Please select a star rating.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/products/${selectedProduct.productId}/review`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, text }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(selectedProduct.productId);
        close();
      } else {
        setError(data.message || 'Failed to submit review.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setSubmitting(false);
  }

  const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <>
      <style>{`
        @keyframes review-in  { from { opacity:0; transform:scale(0.92) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes review-out { from { opacity:1; transform:scale(1) translateY(0); } to { opacity:0; transform:scale(0.92) translateY(12px); } }
        @keyframes review-bd-in  { from { opacity:0; } to { opacity:1; } }
        @keyframes review-bd-out { from { opacity:1; } to { opacity:0; } }
      `}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center"
        style={{
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          animation: `${closing ? 'review-bd-out' : 'review-bd-in'} 0.2s ease forwards`,
        }}
        onClick={e => { if (e.target === e.currentTarget) close(); }}>
        <div className="w-full max-w-md mx-4 rounded-[8px] overflow-hidden"
          style={{
            background: '#1E1E1E',
            boxShadow: '0 32px 80px rgba(0,0,0,0.7)',
            animation: `${closing ? 'review-out' : 'review-in'} 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards`,
          }}>

          
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(252,255,252,0.07)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#FCFFFC', marginBottom: 2 }}>Write a Review</h3>
              <p style={{ fontSize: 12, color: 'rgba(252,255,252,0.4)' }}>Share your experience with this product</p>
            </div>
          </div>

          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>

            
            {order.items.length > 1 && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(252,255,252,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Product</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {order.items.map((item, i) => (
                    <button key={i} type="button"
                      onClick={() => { setSelectedProduct(item); setRating(0); setText(''); setError(''); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 10, textAlign: 'left',
                        background: selectedProduct?.productId === item.productId ? 'rgba(217,72,64,0.08)' : 'rgba(252,255,252,0.03)',
                        border: `1px solid ${selectedProduct?.productId === item.productId ? 'rgba(217,72,64,0.35)' : 'rgba(252,255,252,0.07)'}`,
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#2E2E2E' }}>
                        {item.image && <img src={imgUrl(item.image)} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                      </div>
                      <span style={{ fontSize: 12, color: '#FCFFFC', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            
            {order.items.length === 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(252,255,252,0.03)', border: '1px solid rgba(252,255,252,0.07)' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: '#2E2E2E' }}>
                  {selectedProduct?.image && <img src={imgUrl(selectedProduct.image)} alt={selectedProduct.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <span style={{ fontSize: 12, color: '#FCFFFC', fontWeight: 500 }}>{selectedProduct?.title}</span>
              </div>
            )}

            
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(252,255,252,0.5)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rating</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <StarPicker value={rating} onChange={setRating} />
                {rating > 0 && (
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#FBBF24' }}>{ratingLabels[rating]}</span>
                )}
              </div>
            </div>

            
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(252,255,252,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Review <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></p>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Tell others what you think about this product…"
                maxLength={500}
                rows={3}
                style={{
                  width: '100%', background: '#262626', border: '1px solid rgba(252,255,252,0.1)',
                  borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#FCFFFC',
                  resize: 'none', outline: 'none', fontFamily: 'inherit',
                  boxSizing: 'border-box', lineHeight: 1.5,
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(252,255,252,0.3)'}
                onBlur={e => e.target.style.borderColor = 'rgba(252,255,252,0.1)'}
              />
              <div style={{ textAlign: 'right', fontSize: 10, color: 'rgba(252,255,252,0.25)', marginTop: 4 }}>{text.length}/500</div>
            </div>

            {error && (
              <p style={{ fontSize: 12, color: 'rgba(245,245,245,0.45)', padding: '8px 12px', borderRadius: 8, letterSpacing: '0.05em' }}>Something's not right — please try again later.</p>
            )}

            
            <div style={{ display: 'flex', gap: 10, paddingTop: 2 }}>
              <button onClick={handleSubmit} disabled={submitting || !rating}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 10, border: 'none',
                  background: rating ? '#D94840' : 'rgba(252,255,252,0.06)',
                  color: rating ? '#FCFFFC' : 'rgba(252,255,252,0.25)',
                  fontSize: 13, fontWeight: 700, cursor: rating ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s', opacity: submitting ? 0.6 : 1,
                }}>
                {submitting ? 'Submitting…' : 'Submit Review'}
              </button>
              <button onClick={close}
                style={{
                  padding: '11px 16px', borderRadius: 10, border: '1px solid rgba(252,255,252,0.08)',
                  background: 'transparent', color: 'rgba(252,255,252,0.45)',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function TrackingPanel({ order, onClose }) {
  const status = liveStatus(order);
  const activeStep = stepIndex(status);

  const visibleLogs = (order.logs || []).filter(l => new Date(l.time) <= new Date());

  return (
    <div style={{ width: 360, flexShrink: 0 }}>
      <div style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.07)', borderRadius: 12, overflow: 'hidden' }}>

        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid rgba(252,255,252,0.07)' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FCFFFC' }}>Shipment Detail</div>
            <div style={{ fontSize: 11, color: 'rgba(252,255,252,0.4)', marginTop: 2 }}>{order.trackingNumber}</div>
          </div>
        </div>

        
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(252,255,252,0.07)', display: 'flex', flexDirection: 'column', gap: 10 }}>

          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {order.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: '#2E2E2E', overflow: 'hidden', flexShrink: 0 }}>
                  {item.image && <img src={imgUrl(item.image)} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, color: '#FCFFFC', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</p>
                  <p style={{ fontSize: 10, color: 'rgba(252,255,252,0.4)' }}>
                    {item.qty}x · {currency.format(item.price)}{item.size ? ` · ${item.size}` : ''}
                  </p>
                </div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#FCFFFC', flexShrink: 0 }}>{currency.format(item.price * item.qty)}</p>
              </div>
            ))}
          </div>

          
          {(() => {
            const subtotal = order.subtotal ?? order.items.reduce((sum, i) => sum + i.price * i.qty, 0);
            const shipping = order.shippingCost ?? order.courier?.price ?? 0;
            const protection = order.addons?.protection ?? 0;
            const insurance  = order.addons?.insurance  ?? 0;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingTop: 8, borderTop: '1px solid rgba(252,255,252,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: 'rgba(252,255,252,0.4)' }}>Subtotal</span>
                  <span style={{ fontSize: 10, color: 'rgba(252,255,252,0.7)' }}>{currency.format(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 10, color: 'rgba(252,255,252,0.4)' }}>Shipping ({order.courier?.label || '-'})</span>
                  <span style={{ fontSize: 10, color: 'rgba(252,255,252,0.7)' }}>{shipping > 0 ? currency.format(shipping) : 'Free'}</span>
                </div>
                {protection > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: 'rgba(252,255,252,0.4)' }}>Package Protection</span>
                    <span style={{ fontSize: 10, color: 'rgba(252,255,252,0.7)' }}>{currency.format(protection)}</span>
                  </div>
                )}
                {insurance > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 10, color: 'rgba(252,255,252,0.4)' }}>Shipping Insurance</span>
                    <span style={{ fontSize: 10, color: 'rgba(252,255,252,0.7)' }}>{currency.format(insurance)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid rgba(252,255,252,0.06)', marginTop: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#FCFFFC' }}>Total</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#D94840' }}>{currency.format(order.total)}</span>
                </div>
              </div>
            );
          })()}

          
          {order.paymentMethod && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, color: 'rgba(252,255,252,0.4)' }}>Payment</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(252,255,252,0.7)', textTransform: 'uppercase' }}>{order.paymentMethod}</span>
            </div>
          )}

          
          {order.shippingAddress && (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 10, color: 'rgba(252,255,252,0.4)', flexShrink: 0 }}>Ship to</span>
              <span style={{ fontSize: 10, color: 'rgba(252,255,252,0.7)', textAlign: 'right' }}>
                {[order.shippingAddress.name, order.shippingAddress.street, order.shippingAddress.city].filter(Boolean).join(', ')}
              </span>
            </div>
          )}

          
          {order.note && (
            <div style={{ background: 'rgba(252,255,252,0.04)', borderRadius: 6, padding: '6px 8px', border: '1px solid rgba(252,255,252,0.06)' }}>
              <p style={{ fontSize: 10, color: 'rgba(252,255,252,0.35)', marginBottom: 2 }}>Note</p>
              <p style={{ fontSize: 11, color: 'rgba(252,255,252,0.65)', fontStyle: 'italic' }}>"{order.note}"</p>
            </div>
          )}
        </div>

        
        {order.deliveredAt && status !== 'delivered' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'rgba(217,72,64,0.06)', borderBottom: '1px solid rgba(252,255,252,0.06)' }}>
            <CalendarClock size={13} color='#D94840' />
            <span style={{ fontSize: 11, color: 'rgba(252,255,252,0.6)' }}>
              Estimated arrival: <strong style={{ color: '#FCFFFC' }}>{fmtDay(order.deliveredAt)}</strong>
            </span>
          </div>
        )}

        
        <div style={{ padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {STEPS.map((s, i) => {
              const done = i <= activeStep;
              const { Icon } = s;
              return (
                <React.Fragment key={s.key}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: done ? '#D94840' : 'rgba(252,255,252,0.06)',
                      border: `2px solid ${done ? '#D94840' : 'rgba(252,255,252,0.12)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.3s',
                    }}>
                      <Icon size={16} color={done ? '#FCFFFC' : 'rgba(252,255,252,0.3)'} />
                    </div>
                    <div style={{ fontSize: 10, marginTop: 6, color: done ? '#FCFFFC' : 'rgba(252,255,252,0.35)', fontWeight: done ? 600 : 400, textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {s.label}
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{ flex: 1, height: 2, background: i < activeStep ? '#D94840' : 'rgba(252,255,252,0.1)', margin: '0 4px', marginBottom: 20, transition: 'background 0.3s' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        
        <div style={{ display: 'flex', gap: 10, padding: '0 16px 14px' }}>
          <InfoChip label="Tracking No."  value={order.trackingNumber} />
          <InfoChip label="Courier"       value={order.courier?.label || '-'} />
        </div>

        
        <style>{`
          .order-history-log::-webkit-scrollbar { width: 4px; }
          .order-history-log::-webkit-scrollbar-track { background: transparent; }
          .order-history-log::-webkit-scrollbar-thumb { background: rgba(252,255,252,0.12); border-radius: 99px; }
          .order-history-log::-webkit-scrollbar-thumb:hover { background: rgba(252,255,252,0.25); }
        `}</style>
        <div className="order-history-log" style={{ borderTop: '1px solid rgba(252,255,252,0.07)', padding: '14px 16px', maxHeight: 280, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(252,255,252,0.12) transparent' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(252,255,252,0.4)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            History
          </div>
          {visibleLogs.length === 0 && (
            <p style={{ fontSize: 11, color: 'rgba(252,255,252,0.3)' }}>No activity yet.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[...visibleLogs].reverse().map((log, i, arr) => (
              <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: i < arr.length - 1 ? 14 : 0, position: 'relative' }}>
                {i < arr.length - 1 && (
                  <div style={{ position: 'absolute', left: 5, top: 14, bottom: 0, width: 1, background: 'rgba(252,255,252,0.08)' }} />
                )}
                <div style={{ width: 11, height: 11, borderRadius: '50%', background: i === 0 ? '#D94840' : 'rgba(252,255,252,0.15)', flexShrink: 0, marginTop: 3 }} />
                <div>
                  <div style={{ fontSize: 12, color: '#FCFFFC', lineHeight: 1.4 }}>{log.text}</div>
                  <div style={{ fontSize: 10, color: 'rgba(252,255,252,0.3)', marginTop: 2 }}>
                    <Clock size={9} style={{ display: 'inline', marginRight: 3 }} />
                    {fmtDate(log.time)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoChip({ label, value }) {
  return (
    <div style={{ flex: 1, background: 'rgba(252,255,252,0.04)', borderRadius: 8, padding: '8px 10px', border: '1px solid rgba(252,255,252,0.06)' }}>
      <div style={{ fontSize: 10, color: 'rgba(252,255,252,0.35)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#FCFFFC' }}>{value}</div>
    </div>
  );
}

function StatusBadge({ order }) {
  const status = liveStatus(order);
  const map = {
    packed:    { label: 'Packed',    color: '#FBBF24' },
    shipped:   { label: 'Shipped',   color: '#60A5FA' },
    delivered: { label: 'Delivered', color: '#34D399' },
    cancelled: { label: 'Cancelled', color: '#D94840' },
  };
  const s = map[status] || map.packed;
  return (
    <span style={{ fontSize: 10, fontWeight: 600, background: 'transparent', color: s.color, padding: '2px 0' }}>
      {s.label}
    </span>
  );
}

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [cancelModal, setCancelModal] = useState(null); 
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [modalClosing, setModalClosing] = useState(false);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [reviewModal, setReviewModal] = useState(null); 
  const [reviewedProducts, setReviewedProducts] = useState(new Set());

  function closeModal() {
    setModalClosing(true);
    setReasonOpen(false);
    setTimeout(() => { setCancelModal(null); setCancelReason(''); setModalClosing(false); }, 200);
  }

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/'); return; }
    fetch(`${API_URL}/api/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) { setOrders(d.orders); setSelected(d.orders[0] ?? null); } })
      .finally(() => setLoading(false));
  }, []);

  async function handleCancel() {
    if (!cancelModal) return;
    setCancelling(true);
    try {
      const res = await fetch(`${API_URL}/api/orders/${cancelModal}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders(prev => prev.map(o => o._id === cancelModal ? data.order : o));
        setSelected(prev => prev?._id === cancelModal ? data.order : prev);
      }
    } catch {  }
    setCancelling(false);
    closeModal();
  }

  return (
    <div className="min-h-screen font-body flex flex-col" style={{ background: '#080808', color: '#FCFFFC' }}>
      <div className="fixed inset-0 pointer-events-none select-none flex items-center justify-center z-0" aria-hidden="true">
        <img src="/CatLogoWhite.png" alt="" style={{ width: '15vw', maxWidth: 600, opacity: 0.01, userSelect: 'none', filter: 'grayscale(1)' }} />
      </div>
      <Header />

      <main className="flex-1">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8">

          
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => navigate('/')}
              className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-60"
              style={{ color: 'rgba(252,255,252,0.45)' }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span style={{ color: 'rgba(252,255,252,0.2)' }}>/</span>
            <h1 className="text-xs font-medium" style={{ color: 'rgba(252,255,252,0.45)' }}>My Orders</h1>
          </div>

          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

            
            <div style={{ flex: 1, minWidth: 0 }}>
              {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ height: 90, borderRadius: 12, background: 'rgba(252,255,252,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />
                  ))}
                </div>
              )}

              {!loading && orders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-5">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: '#1E1E1E' }}>
                    <Package className="w-9 h-9" style={{ color: 'rgba(252,255,252,0.2)' }} />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm mb-1" style={{ color: '#FCFFFC' }}>No orders yet</p>
                    <p className="text-xs" style={{ color: 'rgba(252,255,252,0.4)' }}>Place an order and track it here.</p>
                  </div>
                  <button onClick={() => navigate('/')}
                    className="px-6 py-2.5 rounded-[8px] text-sm font-semibold transition-all hover:opacity-85"
                    style={{ background: '#FCFFFC', color: '#262626' }}>
                    Browse Products
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orders.filter(order => {
                  const st = liveStatus(order);
                  if (st !== 'delivered' && st !== 'cancelled') return true;
                  const cutoff = st === 'delivered'
                    ? new Date(order.deliveredAt)
                    : new Date(order.logs?.slice().reverse().find(l => l.text?.startsWith('Order cancelled'))?.time || order.updatedAt);
                  return Date.now() - cutoff.getTime() < 24 * 3600 * 1000;
                }).map(order => {
                  const isActive = selected?._id === order._id;
                  const status = liveStatus(order);
                  const canCancel = status === 'packed';
                  return (
                    <div key={order._id}
                      onClick={() => setSelected(isActive ? null : order)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 16px', borderRadius: 12, textAlign: 'left', width: '100%',
                        background: isActive ? 'rgba(217,72,64,0.06)' : '#1E1E1E',
                        border: `1px solid ${isActive ? 'rgba(217,72,64,0.3)' : 'rgba(252,255,252,0.07)'}`,
                        cursor: 'pointer', transition: 'border 0.2s, background 0.2s',
                      }}>
                      
                      <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
                        {order.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} style={{
                            position: idx === 0 ? 'relative' : 'absolute',
                            top: idx === 1 ? 4 : 0, left: idx === 1 ? 4 : 0,
                            width: 40, height: 40, borderRadius: 8,
                            background: '#2E2E2E', overflow: 'hidden',
                            border: '1px solid rgba(252,255,252,0.06)',
                            zIndex: idx === 0 ? 1 : 0,
                          }}>
                            {item.image && <img src={imgUrl(item.image)} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                          </div>
                        ))}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#FCFFFC' }}>{order.trackingNumber}</span>
                          <StatusBadge order={order} />
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(252,255,252,0.45)', marginBottom: 2 }}>
                          {order.items.length} item{order.items.length > 1 ? 's' : ''} · {currency.format(order.total)}
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(252,255,252,0.3)' }}>
                          {order.deliveredAt && status !== 'delivered' && status !== 'cancelled'
                            ? `Est. arrival ${fmtDay(order.deliveredAt)}`
                            : fmtDate(order.createdAt)}
                        </div>
                      </div>

                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        {status === 'delivered' && (
                          <button
                            onClick={() => setReviewModal(order)}
                            className="review-btn"
                            style={{
                              fontSize: 11, fontWeight: 600, padding: '4px 2px', border: 'none',
                              cursor: 'pointer', background: 'transparent',
                              color: '#FBBF24', position: 'relative',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}>
                            <style>{`
                              .review-btn::after {
                                content: '';
                                position: absolute;
                                bottom: 1px; left: 0; right: 0;
                                height: 1px;
                                background: #FBBF24;
                                transform: scaleX(0);
                                transform-origin: left center;
                                transition: transform 0.25s ease;
                              }
                              .review-btn:hover::after { transform: scaleX(1); }
                            `}</style>
                            <Star size={11} fill="#FBBF24" color="#FBBF24" />
                            Write a Review
                          </button>
                        )}
                        {status !== 'cancelled' && status !== 'delivered' && (
                          <button
                            onClick={() => canCancel && setCancelModal(order._id)}
                            disabled={!canCancel}
                            title={canCancel ? '' : 'Cannot cancel — already shipped'}
                            className="cancel-order-btn"
                            style={{
                              fontSize: 11, fontWeight: 600, padding: '3px 2px', border: 'none',
                              cursor: canCancel ? 'pointer' : 'not-allowed',
                              background: 'transparent', position: 'relative',
                              color: canCancel ? '#D94840' : 'rgba(252,255,252,0.2)',
                            }}>
                            <style>{`
                              .cancel-order-btn::after { content:''; position:absolute; bottom:1px; left:0; right:0; height:1px; background:#D94840; transform:scaleX(0); transform-origin:left center; transition:transform 0.25s ease; }
                              .cancel-order-btn:hover:not(:disabled)::after { transform:scaleX(1); }
                            `}</style>
                            Cancel
                          </button>
                        )}
                        <ChevronRight size={14} style={{ color: 'rgba(252,255,252,0.25)', transform: isActive ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            
            {selected && (
              <div style={{ position: 'sticky', top: 24, alignSelf: 'flex-start' }}>
                <TrackingPanel order={selected} onClose={() => setSelected(null)} />
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      
      {reviewModal && (
        <ReviewModal
          order={reviewModal}
          onClose={() => setReviewModal(null)}
          onSuccess={(productId) => {
            setReviewedProducts(prev => new Set([...prev, productId]));
          }}
        />
      )}

      
      {(cancelModal || modalClosing) && (
        <>
          <style>{`
            @keyframes modal-in  { from { opacity:0; transform:scale(0.92) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
            @keyframes modal-out { from { opacity:1; transform:scale(1) translateY(0); } to { opacity:0; transform:scale(0.92) translateY(8px); } }
            @keyframes backdrop-in  { from { opacity:0; } to { opacity:1; } }
            @keyframes backdrop-out { from { opacity:1; } to { opacity:0; } }
          `}</style>
          <div className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
              animation: `${modalClosing ? 'backdrop-out' : 'backdrop-in'} 0.2s ease forwards`,
            }}
            onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
            <div className="w-full max-w-sm mx-4 rounded-[8px] p-6"
              style={{
                background: '#1E1E1E', boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
                animation: `${modalClosing ? 'modal-out' : 'modal-in'} 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards`,
              }}>
              <h3 className="text-sm font-bold mb-1" style={{ color: '#FCFFFC' }}>Cancel Order</h3>
              <p className="text-xs mb-5" style={{ color: 'rgba(252,255,252,0.4)' }}>Please select a reason for cancellation.</p>

              <label className="block text-[11px] font-semibold mb-2" style={{ color: 'rgba(252,255,252,0.5)' }}>Reason</label>

              
              <div className="relative mb-4" onClick={() => setReasonOpen(o => !o)}>
                <div className="w-full px-3 py-2.5 rounded-[8px] text-xs cursor-pointer flex items-center justify-between"
                  style={{ background: '#262626', border: `1px solid ${reasonOpen ? 'rgba(252,255,252,0.25)' : 'rgba(252,255,252,0.1)'}`, color: cancelReason ? '#FCFFFC' : 'rgba(252,255,252,0.35)', transition: 'border-color 0.15s' }}>
                  <span>{cancelReason || 'Select a reason…'}</span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, transform: reasonOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', color: 'rgba(252,255,252,0.3)' }}>
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                {reasonOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 rounded-[10px] overflow-hidden z-10"
                    style={{ background: '#2A2A2A', border: '1px solid rgba(252,255,252,0.1)', boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}
                    onClick={e => e.stopPropagation()}>
                    {[
                      'I want to change my address',
                      'I want to change the payment method',
                      'I changed my mind',
                      'Found a better price elsewhere',
                      'Ordered the wrong item or size',
                      'Ordered by mistake',
                      'Taking too long to process',
                      'Other',
                    ].map(opt => (
                      <button key={opt} type="button"
                        onClick={() => { setCancelReason(opt); setReasonOpen(false); }}
                        className="w-full text-left px-3 py-2.5 text-xs transition-colors hover:bg-white/5"
                        style={{ color: cancelReason === opt ? '#FCFFFC' : 'rgba(252,255,252,0.6)', background: cancelReason === opt ? 'rgba(217,72,64,0.08)' : 'transparent', borderBottom: '1px solid rgba(252,255,252,0.04)' }}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button onClick={handleCancel} disabled={cancelling || !cancelReason}
                  className="flex-1 py-2.5 rounded-[8px] text-xs font-bold transition-all hover:opacity-85 disabled:opacity-30 disabled:cursor-not-allowed"
                  style={{ background: '#D94840', color: '#FCFFFC' }}>
                  {cancelling ? 'Cancelling…' : 'Confirm Cancellation'}
                </button>
                <button onClick={closeModal}
                  className="px-4 py-2.5 rounded-[8px] text-xs font-semibold transition-all hover:opacity-70"
                  style={{ color: 'rgba(252,255,252,0.45)' }}>
                  Back
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
