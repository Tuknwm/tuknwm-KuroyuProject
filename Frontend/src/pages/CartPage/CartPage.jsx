import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, Tag } from 'lucide-react';
import Header from '../HomePage/components/Header';
import Footer from '../HomePage/components/Footer';
import AuthModal from '../HomePage/components/AuthModal';
import { useCart } from '../../context/CartContext';
import { imgUrl } from '../../utils';

const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

function getUser() {
  try { return JSON.parse(sessionStorage.getItem('kuroyu_user') || localStorage.getItem('kuroyu_user')); }
  catch { return null; }
}

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, updateQty, clearCart, totalCount } = useCart();

  const [confirmKey, setConfirmKey] = useState(null);
  const [showAuth, setShowAuth] = useState(false);

  const subtotal = items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const shipping = subtotal >= 500000 ? 0 : 25000;
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen font-body flex flex-col" style={{ background: '#262626', color: '#FCFFFC' }}>
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
            <h1 className="text-xs font-medium" style={{ color: 'rgba(252,255,252,0.45)' }}>
              My Cart
              {totalCount > 0 && <span className="ml-2 text-sm font-normal" style={{ color: 'rgba(252,255,252,0.4)' }}>({totalCount} items)</span>}
            </h1>
          </div>

          {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-5">
              <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: '#1E1E1E' }}>
                <ShoppingBag className="w-9 h-9" style={{ color: 'rgba(252,255,252,0.2)' }} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm mb-1" style={{ color: '#FCFFFC' }}>Your cart is empty</p>
                <p className="text-xs" style={{ color: 'rgba(252,255,252,0.4)' }}>Add items from the store to get started.</p>
              </div>
              <button onClick={() => navigate('/')}
                className="px-6 py-2.5 rounded-[8px] text-sm font-semibold transition-all hover:opacity-85"
                style={{ background: '#FCFFFC', color: '#262626' }}>
                Browse Products
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              
              <div className="lg:col-span-2 space-y-3">
                {items.map(item => (
                  <div key={item.key} className="flex gap-4 p-4 rounded-[10px]"
                    style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.07)' }}>

                    
                    <div className="w-20 h-20 rounded-[8px] overflow-hidden shrink-0 cursor-pointer"
                      style={{ background: '#2E2E2E' }}
                      onClick={() => navigate(`/product/${item.product._id}`)}>
                      {item.product.image
                        ? <img src={imgUrl(item.product.image)} alt={item.product.title} className="w-full h-full object-cover" />
                        : null}
                    </div>

                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold line-clamp-2 cursor-pointer hover:underline"
                        style={{ color: '#FCFFFC' }}
                        onClick={() => navigate(`/product/${item.product._id}`)}>
                        {item.product.title}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {item.color && <span className="text-[11px] px-2 py-0.5 rounded-[6px]" style={{ background: 'rgba(252,255,252,0.06)', color: 'rgba(252,255,252,0.5)' }}>{item.color}</span>}
                        {item.size && <span className="text-[11px] px-2 py-0.5 rounded-[6px]" style={{ background: 'rgba(252,255,252,0.06)', color: 'rgba(252,255,252,0.5)' }}>Size {item.size}</span>}
                      </div>
                      <p className="text-sm font-bold mt-2" style={{ color: '#FCFFFC' }}>{currency.format(item.product.price)}</p>
                    </div>

                    
                    <div className="flex flex-col items-end justify-between shrink-0">
                      
                      <div className="h-7 flex items-center justify-end">
                        {confirmKey === item.key ? (
                          <div className="flex items-center gap-2 text-xs">
                            <span style={{ color: 'rgba(252,255,252,0.5)' }}>Are You Sure?</span>
                            <button onClick={() => { removeItem(item.key); setConfirmKey(null); }}
                              className="font-bold transition-opacity hover:opacity-70"
                              style={{ color: '#D94840' }}>Yes</button>
                            <span style={{ color: 'rgba(252,255,252,0.2)' }}>/</span>
                            <button onClick={() => setConfirmKey(null)}
                              className="font-bold transition-opacity hover:opacity-70"
                              style={{ color: 'rgba(252,255,252,0.5)' }}>No</button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmKey(item.key)}
                            className="p-1.5 rounded-[6px] transition-colors hover:bg-[rgba(217,72,64,0.1)]"
                            style={{ color: 'rgba(252,255,252,0.3)' }}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-0 rounded-[8px] overflow-hidden"
                        style={{ border: '1px solid rgba(252,255,252,0.1)' }}>
                        <button onClick={() => updateQty(item.key, item.qty - 1)}
                          disabled={item.qty <= 1}
                          className="w-8 h-8 flex items-center justify-center hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                          style={{ color: '#FCFFFC' }}>
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold"
                          style={{ color: '#FCFFFC', borderLeft: '1px solid rgba(252,255,252,0.08)', borderRight: '1px solid rgba(252,255,252,0.08)' }}>
                          {item.qty}
                        </span>
                        <button onClick={() => updateQty(item.key, item.qty + 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-white/5"
                          style={{ color: '#FCFFFC' }}>
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="h-6 flex items-center mt-2">
                  {confirmKey === 'all' ? (
                    <div className="flex items-center gap-2 text-xs">
                      <span style={{ color: 'rgba(252,255,252,0.5)' }}>Are You Sure?</span>
                      <button onClick={() => { clearCart(); setConfirmKey(null); }}
                        className="font-bold transition-opacity hover:opacity-70"
                        style={{ color: '#D94840' }}>Yes</button>
                      <span style={{ color: 'rgba(252,255,252,0.2)' }}>/</span>
                      <button onClick={() => setConfirmKey(null)}
                        className="font-bold transition-opacity hover:opacity-70"
                        style={{ color: 'rgba(252,255,252,0.5)' }}>No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmKey('all')}
                      className="text-xs transition-opacity hover:opacity-70"
                      style={{ color: 'rgba(252,255,252,0.35)' }}>
                      Remove all items
                    </button>
                  )}
                </div>
              </div>

              
              <div className="lg:col-span-1">
                <div className="rounded-[12px] p-5 sticky top-24 space-y-4"
                  style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.07)' }}>
                  <h2 className="font-heading font-bold text-sm" style={{ color: '#FCFFFC' }}>Order Summary</h2>

                  <div className="space-y-3 text-xs" style={{ color: 'rgba(252,255,252,0.6)' }}>
                    <div className="flex justify-between">
                      <span>Subtotal ({totalCount} items)</span>
                      <span style={{ color: '#FCFFFC' }}>{currency.format(subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span style={{ color: shipping === 0 ? '#10b981' : '#FCFFFC' }}>
                        {shipping === 0 ? 'Free' : currency.format(shipping)}
                      </span>
                    </div>
                    {shipping > 0 && (
                      <p className="text-[11px] flex items-center gap-1" style={{ color: 'rgba(252,255,252,0.35)' }}>
                        <Tag className="w-3 h-3" />
                        Add {currency.format(500000 - subtotal)} more for free shipping
                      </p>
                    )}
                  </div>

                  <div className="pt-3 flex justify-between text-sm font-bold"
                    style={{ borderTop: '1px solid rgba(252,255,252,0.07)', color: '#FCFFFC' }}>
                    <span>Total</span>
                    <span>{currency.format(total)}</span>
                  </div>

                  <button onClick={() => getUser() ? navigate('/checkout') : setShowAuth(true)}
                    className="w-full py-3 rounded-[10px] text-sm font-bold transition-all hover:opacity-85 active:scale-[0.98]"
                    style={{ background: '#FCFFFC', color: '#262626' }}>
                    Proceed to Checkout
                  </button>

                  <button onClick={() => navigate('/')}
                    className="w-full py-2.5 rounded-[10px] text-xs font-semibold transition-all hover:bg-white/5"
                    style={{ border: '1px solid rgba(252,255,252,0.1)', color: 'rgba(252,255,252,0.6)' }}>
                    Continue Shopping
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>

      <Footer />
      {showAuth && <AuthModal mode="login" onClose={() => setShowAuth(false)} onAuthenticated={() => { setShowAuth(false); navigate('/checkout'); }} />}
    </div>
  );
}
