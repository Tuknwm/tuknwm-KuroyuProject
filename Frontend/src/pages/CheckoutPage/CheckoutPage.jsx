import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import OrderPlacedAnimation from '../../components/OrderPlacedAnimation';
import { ArrowLeft, Check, MapPin, CreditCard, Ticket, ChevronDown, X, Shield, Truck, Plus, Package } from 'lucide-react';
import Header from '../HomePage/components/Header';
import { useCart } from '../../context/CartContext';
import { imgUrl } from '../../utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const getToken = () => localStorage.getItem('kuroyu_token') || sessionStorage.getItem('kuroyu_token');
const authHeader = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });

const PAYMENT_METHODS = [
  { id: 'gopay',    label: 'GoPay',            color: '#00AED6',            img: '/GoPay.svg' },
  { id: 'ovo',      label: 'OVO',              color: '#9B59B6',            img: '/OVO.svg' },
  { id: 'dana',     label: 'DANA',             color: '#118EEA',            img: '/Dana.svg' },
  { id: 'shopeepay',label: 'ShopeePay',        color: '#EE4D2D',            img: '/Spay.png' },
  { id: 'cod',      label: 'Cash on Delivery', color: 'rgba(252,255,252,0.6)', img: '/COD.png' },
];

const COURIERS = [
  { id: 'jne', label: 'JNE REG', estimate: '3-5 days', price: 25000, logo: '/JNE.svg' },
  { id: 'jt', label: 'J&T Express', estimate: '2-3 days', price: 28000, logo: '/J&T.svg' },
  { id: 'sicepat', label: 'SiCepat HALU', estimate: '1 day', price: 35000, logo: '/SiCepat.svg' },
  { id: 'grab', label: 'Grab Instant', estimate: 'Today', price: 45000, logo: '/Grab.svg' },
];

const PROTECTION_PRICE = 15000;
const INSURANCE_PRICE = 8000;

function rollVoucher(items) {
  const seed = items.reduce((s, i) => s + (i.product?._id || '').charCodeAt(0), 0);
  return (seed % 5 === 0); 
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, clearCart } = useCart();

  const [placed, setPlaced] = useState(false);
  const [selectedAddr, setSelectedAddr] = useState(null);
  const [addrList, setAddrList] = useState([]);
  const [addrLoading, setAddrLoading] = useState(true);
  const [addrOpen, setAddrOpen] = useState(false);
  const [courier, setCourier] = useState(COURIERS[0].id);
  const [payment, setPayment] = useState(PAYMENT_METHODS[0].id);
  const [protection, setProtection] = useState(false);
  const [insurance, setInsurance] = useState(false);
  const [note, setNote] = useState('');
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [voucherClosing, setVoucherClosing] = useState(false);
  function closeVoucher() {
    setVoucherClosing(true);
    setTimeout(() => { setVoucherOpen(false); setVoucherClosing(false); }, 200);
  }
  const dropdownRef = useRef(null);

  
  const hasVoucher = useRef(items.length ? rollVoucher(items) : false);

  
  useEffect(() => {
    if (!getToken()) { setAddrLoading(false); return; }
    fetch(`${API_URL}/api/user/addresses`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => {
        const list = d.addresses || [];
        setAddrList(list);
        if (list.length > 0) setSelectedAddr(list[0]);
      })
      .catch(() => { })
      .finally(() => setAddrLoading(false));
  }, []);

  
  useEffect(() => {
    function handle(e) { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setAddrOpen(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const selectedCourier = COURIERS.find(c => c.id === courier);
  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const addons = (protection ? PROTECTION_PRICE : 0) + (insurance ? INSURANCE_PRICE : 0);
  const total = subtotal + (selectedCourier?.price ?? 0) + addons;

  const shipValid = !!selectedAddr;

  const [orderError, setOrderError] = useState('');
  const [ordering, setOrdering] = useState(false);

  async function handlePlaceOrder() {
    setOrdering(true);
    setOrderError('');
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify({
          items: items.map(i => ({
            productId: i.product._id,
            title: i.product.title,
            image: i.product.image,
            price: i.product.price,
            qty: i.qty,
            size: i.size || null,
          })),
          total,
          subtotal,
          shippingCost: selectedCourier?.price ?? 0,
          addons: {
            protection: protection ? PROTECTION_PRICE : 0,
            insurance: insurance ? INSURANCE_PRICE : 0,
          },
          courier: selectedCourier ? { id: selectedCourier.id, label: selectedCourier.label, price: selectedCourier.price } : null,
          shippingAddress: selectedAddr || null,
          note: note.trim() || null,
          paymentMethod: payment,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setOrderError(d.message || 'Failed to place order. Please try again.');
        setOrdering(false);
        return;
      }
    } catch {
      setOrderError('Could not connect to server. Please try again.');
      setOrdering(false);
      return;
    }
    setPlaced(true);
    clearCart();
  }

  
  if (placed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 font-body"
        style={{ background: '#080808', color: '#FCFFFC', overflow: 'hidden' }}>

        <style>{`@keyframes kFadeUp{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:translateY(0)}}`}</style>

        <OrderPlacedAnimation courierId={selectedCourier?.id} />

        <div style={{ animation: 'kFadeUp 0.6s 3.4s ease both', textAlign: 'center' }}>
          <p className="font-heading font-bold text-lg mb-1">Order Placed!</p>
          <p className="text-sm" style={{ color: 'rgba(252,255,252,0.45)' }}>
            We'll notify you when your order ships.
          </p>
        </div>

        <div className="flex gap-3" style={{ animation: 'kFadeUp 0.6s 3.6s ease both' }}>
          <Link to="/orders"
            className="px-6 py-2.5 rounded-[10px] text-sm font-semibold transition-all hover:opacity-85 flex items-center gap-2"
            style={{ background: '#D94840', color: '#FCFFFC' }}>
            <Package className="w-4 h-4" /> Track Order
          </Link>
          <button onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-[10px] text-sm font-semibold transition-all hover:opacity-85"
            style={{ background: 'rgba(252,255,252,0.1)', color: '#FCFFFC' }}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!placed && items.length === 0) { navigate('/cart'); return null; }

  return (
    <div className="min-h-screen font-body flex flex-col" style={{ background: '#080808', color: '#FCFFFC' }}>
      <div className="fixed inset-0 pointer-events-none select-none flex items-center justify-center z-0" aria-hidden="true">
        <img src="/CatLogoWhite.png" alt="" style={{ width: '15vw', maxWidth: 600, opacity: 0.04, userSelect: 'none', filter: 'grayscale(1)' }} />
      </div>
      <Header />

      <main className="flex-1">
        <div className="max-w-[1100px] mx-auto px-4 lg:px-8 py-8">

          
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => navigate('/cart')}
              className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-60"
              style={{ color: 'rgba(252,255,252,0.45)' }}>
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <span style={{ color: 'rgba(252,255,252,0.2)' }}>/</span>
            <h1 className="text-xs font-medium" style={{ color: 'rgba(252,255,252,0.45)' }}>Checkout</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            
            <div className="lg:col-span-2 space-y-4">

              
              <Section icon={<MapPin className="w-4 h-4" />} title="Shipping Address">
                {addrLoading ? (
                  <div className="h-12 rounded-[8px] animate-pulse" style={{ background: 'rgba(252,255,252,0.05)' }} />
                ) : (
                  <div className="space-y-3" ref={dropdownRef}>
                    
                    <div className="relative">
                      <button
                        onClick={() => setAddrOpen(v => !v)}
                        className="w-full flex items-center justify-between px-3 py-3 rounded-[8px] text-sm transition-colors hover:bg-white/5"
                        style={{ border: '1px solid rgba(252,255,252,0.1)', color: '#FCFFFC' }}>
                        <span className="flex-1 text-left truncate">
                          {selectedAddr
                            ? <><span className="font-semibold">{selectedAddr.label || selectedAddr.name}</span>
                              <span className="ml-2 text-xs" style={{ color: 'rgba(252,255,252,0.45)' }}>
                                {[selectedAddr.street, selectedAddr.city, selectedAddr.zip].filter(Boolean).join(', ')}
                              </span></>
                            : <span style={{ color: 'rgba(252,255,252,0.3)' }}>Select a shipping address</span>
                          }
                        </span>
                        <ChevronDown className={`w-4 h-4 shrink-0 ml-2 transition-transform`}
                          style={{ color: 'rgba(252,255,252,0.4)', transform: addrOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                      </button>

                      {addrOpen && (
                        <div className="absolute z-20 left-0 right-0 mt-1 rounded-[10px] overflow-hidden"
                          style={{ background: '#1A1A1A', border: '1px solid rgba(252,255,252,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                          {addrList.map((a, idx) => (
                            <button key={idx}
                              onClick={() => { setSelectedAddr(a); setAddrOpen(false); }}
                              className="w-full text-left px-4 py-3 transition-colors hover:bg-white/5"
                              style={{
                                borderBottom: '1px solid rgba(252,255,252,0.05)',
                                background: selectedAddr === a ? 'rgba(252,255,252,0.04)' : 'transparent',
                              }}>
                              <p className="text-sm font-semibold" style={{ color: '#FCFFFC' }}>{a.label || a.name}</p>
                              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(252,255,252,0.45)' }}>
                                {[a.name, a.phone].filter(Boolean).join(' · ')}
                              </p>
                              <p className="text-[11px]" style={{ color: 'rgba(252,255,252,0.35)' }}>
                                {[a.street, a.city, a.province, a.zip].filter(Boolean).join(', ')}
                              </p>
                            </button>
                          ))}
                          <button onClick={() => { setAddrOpen(false); navigate('/settings/address'); }}
                            className="w-full text-left px-4 py-3 flex items-center gap-2 text-xs font-semibold transition-colors hover:bg-white/5"
                            style={{ color: 'rgba(252,255,252,0.45)' }}>
                            <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                              style={{ border: '1px solid rgba(252,255,252,0.2)' }}>+</span>
                            Create a new address
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Section>

              
              <Section icon={<Truck className="w-4 h-4" />} title="Courier">
                <div className="space-y-2">
                  {COURIERS.map(c => (
                    <RadioRow key={c.id} checked={courier === c.id} onClick={() => setCourier(c.id)}>
                      
                      <div className="w-12 h-8 rounded-[5px] shrink-0 flex items-center justify-center overflow-hidden"
                        style={{ background: '#fff', padding: '2px 4px' }}>
                        <img src={c.logo} alt={c.label}
                          className="w-full h-full object-contain"
                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                        <span style={{ display: 'none', fontSize: 8, fontWeight: 800, color: '#333' }}>{c.label}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{c.label}</p>
                          {c.instant && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ color: '#10b981' }}>
                              INSTANT
                            </span>
                          )}
                        </div>
                        <p className="text-[11px]" style={{ color: 'rgba(252,255,252,0.4)' }}>{c.estimate}</p>
                      </div>
                      <span className="text-sm font-bold ml-auto">{currency.format(c.price)}</span>
                    </RadioRow>
                  ))}
                </div>
              </Section>

              
              <Section icon={<CreditCard className="w-4 h-4" />} title="Payment Method">
                <div className="grid grid-cols-2 gap-2">
                  {PAYMENT_METHODS.map(pm => (
                    <button key={pm.id} onClick={() => setPayment(pm.id)}
                      className="flex items-center gap-3 px-3 py-3 rounded-[10px] transition-colors"
                      style={{
                        border: `1px solid ${payment === pm.id ? 'rgba(252,255,252,0.25)' : 'rgba(252,255,252,0.07)'}`,
                        background: payment === pm.id ? 'rgba(252,255,252,0.06)' : 'transparent',
                      }}>
                      <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-[6px]"
                        style={{ background: '#FFFFFF', padding: 3 }}>
                        {pm.img ? (
                          <img src={pm.img} alt={pm.label}
                            className="w-full h-full object-contain"
                            style={{ opacity: payment === pm.id ? 1 : 0.6 }}
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <CreditCard className="w-5 h-5" style={{ color: payment === pm.id ? '#FCFFFC' : 'rgba(252,255,252,0.35)' }} />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-left leading-tight"
                        style={{ color: payment === pm.id ? '#FCFFFC' : 'rgba(252,255,252,0.45)' }}>
                        {pm.label}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] mt-2" style={{ color: 'rgba(252,255,252,0.28)' }}>
                  By continuing payment you agree to the Shipping Insurance Terms & Conditions.
                </p>
              </Section>

            </div>

            
            <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-24 lg:self-start">

              
              <div className="rounded-[12px] p-5 space-y-4"
                style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.07)' }}>
                <h2 className="font-heading font-bold text-sm">Order Summary</h2>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {items.map(item => (
                    <div key={item.key} className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-[4px] overflow-hidden shrink-0" style={{ background: '#2E2E2E' }}>
                        {item.product.image && <img src={imgUrl(item.product.image)} alt={item.product.title} className="w-full h-full object-cover" />}
                      </div>
                      <p className="flex-1 text-[11px] line-clamp-1" style={{ color: 'rgba(252,255,252,0.6)' }}>{item.product.title}</p>
                      <p className="text-[11px] font-semibold shrink-0">{currency.format(item.product.price * item.qty)}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-xs pt-2" style={{ borderTop: '1px solid rgba(252,255,252,0.07)', color: 'rgba(252,255,252,0.55)' }}>
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span style={{ color: '#FCFFFC' }}>{currency.format(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span style={{ color: '#FCFFFC' }}>{currency.format(selectedCourier?.price ?? 0)}</span>
                  </div>
                  {protection && (
                    <div className="flex justify-between">
                      <span>Product Protection</span>
                      <span style={{ color: '#FCFFFC' }}>{currency.format(PROTECTION_PRICE)}</span>
                    </div>
                  )}
                  {insurance && (
                    <div className="flex justify-between">
                      <span>Shipping Insurance</span>
                      <span style={{ color: '#FCFFFC' }}>{currency.format(INSURANCE_PRICE)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-sm font-bold pt-2"
                  style={{ borderTop: '1px solid rgba(252,255,252,0.07)', color: '#FCFFFC' }}>
                  <span>Total</span>
                  <span>{currency.format(total)}</span>
                </div>
              </div>

              
              <CheckboxAddon
                checked={protection} onChange={setProtection}
                icon={<Shield className="w-3.5 h-3.5" />}
                label="Product Protection"
                desc="1-month damage protection"
                price={PROTECTION_PRICE}
              />

              
              <CheckboxAddon
                checked={insurance} onChange={setInsurance}
                icon={<Truck className="w-3.5 h-3.5" />}
                label="Shipping Insurance"
                desc="Cover against lost or damaged delivery"
                price={INSURANCE_PRICE}
              />

              
              <div>
                <label className="text-[11px] font-semibold mb-1.5 block" style={{ color: 'rgba(252,255,252,0.45)' }}>
                  Order Note
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={e => { if (e.target.value.length <= 100) setNote(e.target.value); }}
                  placeholder="Any notes for the seller..."
                  className="w-full px-3 py-2 rounded-[8px] text-xs resize-none outline-none transition-colors placeholder:opacity-25"
                  style={{ background: 'transparent', border: '1px solid rgba(252,255,252,0.08)', color: '#FCFFFC' }}
                  onFocus={e => e.target.style.borderColor = 'rgba(252,255,252,0.25)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(252,255,252,0.08)'}
                />
                <p className="text-[10px] mt-0.5 text-right" style={{ color: 'rgba(252,255,252,0.25)' }}>{note.length}/100</p>
              </div>

              
              <button onClick={() => setVoucherOpen(true)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-[8px] text-xs font-semibold transition-colors hover:bg-white/5"
                style={{ border: '1px solid rgba(252,255,252,0.08)', color: 'rgba(252,255,252,0.6)' }}>
                <span className="flex items-center gap-2">
                  <Ticket className="w-3.5 h-3.5" style={{ color: '#D94840' }} />
                  Use Voucher
                </span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              
              {orderError && (
                <p className="text-xs text-center" style={{ color: 'rgba(245,245,245,0.45)', letterSpacing: '0.05em' }}>Something's not right — please try again later.</p>
              )}
              <button
                disabled={!shipValid || ordering}
                onClick={handlePlaceOrder}
                className="w-full py-3 rounded-[10px] text-sm font-bold transition-all hover:opacity-85 active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: '#D94840', color: '#FCFFFC' }}>
                {ordering ? 'Processing...' : `Place Order - ${currency.format(total)}`}
              </button>
            </div>
          </div>
        </div>
      </main>

      
      {voucherOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: voucherClosing ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.7)', transition: 'background 0.2s ease' }}
          onClick={closeVoucher}>
          <style>{`
            @keyframes voucher-in  { from { opacity:0; transform:scale(0.92) translateY(10px) } to { opacity:1; transform:scale(1) translateY(0) } }
            @keyframes voucher-out { from { opacity:1; transform:scale(1) translateY(0) } to { opacity:0; transform:scale(0.92) translateY(10px) } }
          `}</style>
          <div className="w-full max-w-sm rounded-[8px] p-5"
            style={{ background: '#1E1E1E', animation: `${voucherClosing ? 'voucher-out' : 'voucher-in'} 0.2s ease forwards` }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-sm">My Vouchers</p>
              <button onClick={closeVoucher}
                className="p-1 rounded-[6px] transition-colors hover:bg-white/5"
                style={{ color: 'rgba(252,255,252,0.4)' }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {hasVoucher.current ? (
              <div className="rounded-[10px] p-4 flex items-center gap-3"
                style={{ background: 'rgba(217,72,64,0.08)', border: '1px solid rgba(217,72,64,0.25)' }}>
                <Ticket className="w-6 h-6 shrink-0" style={{ color: '#D94840' }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: '#D94840' }}>KUROYU10</p>
                  <p className="text-[11px]" style={{ color: 'rgba(252,255,252,0.5)' }}>10% off your order - valid today</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(252,255,252,0.05)' }}>
                  <Ticket className="w-6 h-6" style={{ color: 'rgba(252,255,252,0.2)' }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: 'rgba(252,255,252,0.4)' }}>No vouchers available</p>
                <p className="text-[11px] text-center" style={{ color: 'rgba(252,255,252,0.25)' }}>
                  There are no active vouchers for your current order.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="rounded-[12px] p-5 space-y-4"
      style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.07)' }}>
      <div className="flex items-center gap-2">
        <span style={{ color: 'rgba(252,255,252,0.4)' }}>{icon}</span>
        <h2 className="font-bold text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function RadioRow({ checked, onClick, children }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-[8px] transition-colors text-left"
      style={{
        background: checked ? 'rgba(252,255,252,0.06)' : 'transparent',
        border: `1px solid ${checked ? 'rgba(252,255,252,0.15)' : 'rgba(252,255,252,0.06)'}`,
      }}>
      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
        style={{ border: `2px solid ${checked ? '#FCFFFC' : 'rgba(252,255,252,0.25)'}` }}>
        {checked && <div className="w-2 h-2 rounded-full" style={{ background: '#FCFFFC' }} />}
      </div>
      {children}
    </button>
  );
}

function CheckboxAddon({ checked, onChange, icon, label, desc, price }) {
  return (
    <button onClick={() => onChange(v => !v)}
      className="w-full flex items-center gap-3 p-3 rounded-[8px] transition-colors text-left"
      style={{
        background: 'transparent',
        border: `1px solid rgba(252,255,252,0.06)`,
      }}>
      
      <div className="w-4 h-4 rounded-[4px] flex items-center justify-center shrink-0 transition-colors"
        style={{ background: checked ? '#FCFFFC' : 'transparent', border: `2px solid ${checked ? '#FCFFFC' : 'rgba(252,255,252,0.25)'}` }}>
        {checked && <Check className="w-2.5 h-2.5" style={{ color: '#262626' }} />}
      </div>
      <span style={{ color: 'rgba(252,255,252,0.45)' }}>{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold" style={{ color: '#FCFFFC' }}>{label}</p>
        <p className="text-[10px]" style={{ color: 'rgba(252,255,252,0.35)' }}>{desc}</p>
      </div>
      <span className="text-xs font-bold shrink-0" style={{ color: '#FCFFFC' }}>+{currency.format(price)}</span>
    </button>
  );
}

