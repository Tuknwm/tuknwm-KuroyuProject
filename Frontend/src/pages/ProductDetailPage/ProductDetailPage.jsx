import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, Star, ShieldCheck, ChevronLeft, ChevronRight, Package, RefreshCw, Minus, Plus, MessageCircle } from 'lucide-react';
import Header from '../HomePage/components/Header';
import Footer from '../HomePage/components/Footer';
import AuthModal from '../HomePage/components/AuthModal';
import { useCart } from '../../context/CartContext';
import { lenis } from '../../hooks/useSmoothScroll';
import { imgUrl } from '../../utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function flyToCart(imgEl) {
  const cartBtn = document.querySelector('[data-cart-btn]');
  if (!cartBtn || !imgEl) return;
  const from = imgEl.getBoundingClientRect();
  const to = cartBtn.getBoundingClientRect();
  const fly = document.createElement('img');
  fly.src = imgEl.src;
  Object.assign(fly.style, {
    position: 'fixed', left: `${from.left}px`, top: `${from.top}px`,
    width: `${from.width}px`, height: `${from.height}px`,
    borderRadius: '8px', objectFit: 'cover',
    pointerEvents: 'none', zIndex: 9999,
    transition: 'all 0.65s cubic-bezier(0.25, 1, 0.5, 1)', opacity: '1',
  });
  document.body.appendChild(fly);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    Object.assign(fly.style, {
      left: `${to.left + to.width / 2 - 16}px`, top: `${to.top + to.height / 2 - 16}px`,
      width: '32px', height: '32px', opacity: '0', borderRadius: '50%',
    });
  }));
  fly.addEventListener('transitionend', () => fly.remove(), { once: true });
}
const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const SIZE_MAP = {
  tops: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  bottoms: ['28', '30', '32', '34', '36'],
  footwear: ['38', '39', '40', '41', '42', '43', '44'],
  outerwear: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  dresses: ['XS', 'S', 'M', 'L', 'XL'],
  sportswear: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  bags: null,
  accessories: null,
};

const COLOR_OPTIONS = ['Obsidian', 'Slate', 'Charcoal', 'Ivory', 'Forest'];

function SkeletonDetail() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        <div className="aspect-square w-full rounded-[12px] animate-pulse" style={{ background: '#1E1E1E' }} />
        <div className="space-y-4 pt-2">
          {[80, 240, 120, 180, 100, 140].map((w, i) => (
            <div key={i} className="rounded-[6px] animate-pulse h-4" style={{ background: '#1E1E1E', width: w }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onClick }) {
  return (
    <article onClick={() => onClick(product._id)}
      className="rounded-[8px] p-3 flex flex-col cursor-pointer transition-all hover:scale-[1.01]"
      style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.07)' }}>
      <div className="relative aspect-square w-full rounded-[8px] overflow-hidden mb-3" style={{ background: '#2E2E2E' }}>
        {product.image
          ? <img src={imgUrl(product.image)} alt={product.title} className="h-full w-full object-cover" loading="lazy" />
          : <div className="h-full w-full flex items-center justify-center text-xs" style={{ color: 'rgba(252,255,252,0.2)' }}>No image</div>
        }
        {product.discount > 0 && (
          <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-[6px] text-[9px] font-bold"
            style={{ background: 'rgba(217,72,64,0.15)', color: '#D94840' }}>
            -{product.discount}%
          </span>
        )}
      </div>
      <h3 className="text-xs font-semibold line-clamp-2 min-h-9" style={{ color: '#FCFFFC' }}>{product.title}</h3>
      <p className="text-sm font-bold mt-2" style={{ color: '#FCFFFC' }}>{currency.format(product.price)}</p>
      <div className="mt-1 flex items-center gap-1 text-[11px]" style={{ color: 'rgba(252,255,252,0.4)' }}>
        <Star className="w-3 h-3" style={{ color: product.rating ? '#C8A96E' : 'rgba(252,255,252,0.2)', fill: product.rating ? '#C8A96E' : 'none' }} />
        {product.rating != null ? product.rating.toFixed(1) : '—'}
      </div>
    </article>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const imgRef = useRef(null);
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [explore, setExplore] = useState([]);

  function getUser() {
    try { return JSON.parse(sessionStorage.getItem('kuroyu_user') || localStorage.getItem('kuroyu_user')); }
    catch { return null; }
  }

  useEffect(() => {
    setLoading(true); setError(''); setProduct(null); setSelectedSize(null); setQty(1); setAddedToCart(false); setReviews([]);
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
    async function load() {
      try {
        const r = await fetch(`${API_URL}/api/products/${id}`);
        if (!r.ok) throw new Error('Product not found.');
        const data = await r.json();
        const p = data.data || data;
        setProduct(p);
        fetch(`${API_URL}/api/products/${id}/reviews`)
          .then(r => r.json())
          .then(d => { if (d.success) setReviews(d.reviews || []); })
          .catch(() => {});
        fetch(`${API_URL}/api/products?limit=12&sort=newest`)
          .then(r => r.json())
          .then(d => { if (d.success) setExplore((d.data || []).filter(x => x._id !== id).slice(0, 10)); })
          .catch(() => {});
        const rr = await fetch(`${API_URL}/api/products?category=${p.category}&limit=8`);
        if (rr.ok) {
          const rd = await rr.json();
          setRelated((rd.data || []).filter(x => x._id !== p._id).slice(0, 6));
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function handleAddToCart() {
    if (!product) return;
    addItem(product, { size: selectedSize, color: selectedColor, qty });
    flyToCart(imgRef.current?.tagName === 'IMG' ? imgRef.current : imgRef.current?.querySelector('img'));
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }

  function handleBuyNow() {
    if (!product) return;
    if (!getUser()) { setPendingAction('buy'); setShowAuth(true); return; }
    addItem(product, { size: selectedSize, color: selectedColor, qty });
    navigate('/checkout');
  }

  function onAuthenticated() {
    setShowAuth(false);
    if (pendingAction === 'buy') {
      addItem(product, { size: selectedSize, color: selectedColor, qty });
      navigate('/cart');
    }
    setPendingAction(null);
  }

  function handleNavigateRelated(relatedId) {
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
    navigate(`/product/${relatedId}`);
  }

  const sizes = product?.sizes?.length ? product.sizes : null;
  const productColors = product?.colors?.length ? product.colors : null;

  const allImages = product
    ? [product.image, ...(product.images || [])].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).map(imgUrl)
    : [];
  const [activeImg, setActiveImg] = useState(0);
  const [slideDir, setSlideDir] = useState(null); 
  const [sliding, setSliding] = useState(false);

  useEffect(() => { setActiveImg(0); setSliding(false); setSlideDir(null); }, [id]);

  function goTo(next, dir) {
    if (sliding || next === activeImg) return;
    setSlideDir(dir);
    setSliding(true);
    setTimeout(() => {
      setActiveImg(next);
      setSliding(false);
    }, 220);
  }
  function goPrev() { goTo((activeImg - 1 + allImages.length) % allImages.length, 'right'); }
  function goNext() { goTo((activeImg + 1) % allImages.length, 'left'); }
  function goIndex(i) { goTo(i, i > activeImg ? 'left' : 'right'); }

  return (
    <div className="min-h-screen font-body flex flex-col" style={{ background: '#080808', color: '#FCFFFC' }}>
      <div className="fixed inset-0 pointer-events-none select-none flex items-center justify-center z-0" aria-hidden="true">
        <img src="/CatLogoWhite.png" alt="" style={{ width: '15vw', maxWidth: 600, opacity: 0.01, userSelect: 'none', filter: 'grayscale(1)' }} />
      </div>
      <Header />

      <main className="flex-1">
        {loading && <SkeletonDetail />}
        {error && (
          <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-20 text-center">
            <p className="text-sm mb-4" style={{ color: 'rgba(245,245,245,0.45)', letterSpacing: '0.05em' }}>Something's not right — please try again later.</p>
            <button onClick={() => navigate('/')} className="text-xs underline" style={{ color: 'rgba(252,255,252,0.5)' }}>Back to Home</button>
          </div>
        )}

        {!loading && product && (
          <>
            
            <div className="max-w-[1280px] mx-auto px-4 lg:px-8 pt-6 pb-2">
              <button onClick={() => navigate(-1)}
                className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-70"
                style={{ color: 'rgba(252,255,252,0.45)' }}>
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            </div>

            
            <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-4 pb-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">

                
                <div className="flex flex-col gap-3">
                  
                  <div className="relative aspect-square w-full rounded-[12px] overflow-hidden" style={{ background: '#1E1E1E' }}>
                    {allImages.length > 0
                      ? <img
                          ref={imgRef}
                          src={allImages[activeImg]}
                          alt={product.title}
                          className="h-full w-full object-cover"
                          style={{
                            transform: sliding
                              ? `translateX(${slideDir === 'left' ? '-6%' : '6%'})`
                              : 'translateX(0)',
                            opacity: sliding ? 0 : 1,
                            transition: sliding
                              ? 'transform 0.22s ease-in, opacity 0.22s ease-in'
                              : 'transform 0.22s ease-out, opacity 0.22s ease-out',
                          }}
                        />
                      : <div className="h-full w-full flex items-center justify-center" style={{ color: 'rgba(252,255,252,0.2)' }}>No image</div>
                    }
                    {product.discount > 0 && (
                      <span className="absolute top-4 left-4 px-2.5 py-1 rounded-[8px] text-xs font-bold"
                        style={{ background: '#D94840', color: '#FCFFFC' }}>
                        -{product.discount}%
                      </span>
                    )}
                    
                    {allImages.length > 1 && (
                      <>
                        <button onClick={goPrev}
                          style={{
                            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                            width: 36, height: 36, borderRadius: '50%', border: 'none',
                            background: 'rgba(20,20,20,0.65)', backdropFilter: 'blur(6px)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#FCFFFC', transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(20,20,20,0.9)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(20,20,20,0.65)'}>
                          <ChevronLeft style={{ width: 18, height: 18 }} />
                        </button>
                        <button onClick={goNext}
                          style={{
                            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                            width: 36, height: 36, borderRadius: '50%', border: 'none',
                            background: 'rgba(20,20,20,0.65)', backdropFilter: 'blur(6px)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#FCFFFC', transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(20,20,20,0.9)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(20,20,20,0.65)'}>
                          <ChevronRight style={{ width: 18, height: 18 }} />
                        </button>
                        
                        <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
                          {allImages.map((_, i) => (
                            <button key={i} onClick={() => goIndex(i)} style={{
                              width: i === activeImg ? 18 : 6, height: 6, borderRadius: 99,
                              background: i === activeImg ? '#D94840' : 'rgba(252,255,252,0.4)',
                              border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s',
                            }} />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {allImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                      {allImages.map((img, i) => (
                        <button key={i} onClick={() => goIndex(i)}
                          style={{
                            flexShrink: 0, width: 72, height: 72, borderRadius: 8,
                            overflow: 'hidden', border: `2px solid ${i === activeImg ? '#D94840' : 'rgba(252,255,252,0.1)'}`,
                            background: '#1E1E1E', cursor: 'pointer', padding: 0, transition: 'border-color 0.15s',
                          }}>
                          <img src={img} alt={`view ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                
                <div className="flex flex-col gap-5">

                  <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(252,255,252,0.35)' }}>
                    {product.category}
                  </span>

                  <h1 className="font-heading text-2xl sm:text-3xl font-bold leading-snug" style={{ color: '#FCFFFC' }}>
                    {product.title}
                  </h1>

                  <div className="flex items-center gap-3">
                    {product.rating != null ? (
                      <>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(n => (
                            <Star key={n} className="w-4 h-4"
                              style={{
                                color: n <= Math.round(product.rating) ? '#C8A96E' : 'rgba(252,255,252,0.15)',
                                fill: n <= Math.round(product.rating) ? '#C8A96E' : 'none'
                              }} />
                          ))}
                        </div>
                        <span className="text-xs font-semibold" style={{ color: '#C8A96E' }}>{product.rating.toFixed(1)}</span>
                        <span className="text-xs" style={{ color: 'rgba(252,255,252,0.35)' }}>|</span>
                      </>
                    ) : (
                      <span className="text-xs" style={{ color: 'rgba(252,255,252,0.3)' }}>No reviews yet</span>
                    )}
                    <span className="text-xs" style={{ color: 'rgba(252,255,252,0.5)' }}>{(product.soldCount || 0).toLocaleString()} sold</span>
                  </div>

                  
                  <div className="py-4" style={{ borderTop: '1px solid rgba(252,255,252,0.07)', borderBottom: '1px solid rgba(252,255,252,0.07)' }}>
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-bold" style={{ color: '#FCFFFC' }}>{currency.format(product.price)}</span>
                      {product.originalPrice > product.price && (
                        <span className="text-sm line-through" style={{ color: 'rgba(252,255,252,0.3)' }}>{currency.format(product.originalPrice)}</span>
                      )}
                    </div>
                    {product.discount > 0 && (
                      <p className="text-xs mt-1" style={{ color: '#D94840' }}>Save {currency.format(product.originalPrice - product.price)}</p>
                    )}
                  </div>

                  
                  {productColors && (
                    <div>
                      <p className="text-xs font-semibold mb-2.5" style={{ color: 'rgba(252,255,252,0.6)' }}>
                        Color{selectedColor ? `: ${selectedColor}` : ' — select one'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {productColors.map(c => (
                          <button key={c} onClick={() => setSelectedColor(c)}
                            className="px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all"
                            style={selectedColor === c
                              ? { background: '#FCFFFC', color: '#262626' }
                              : { background: '#1E1E1E', color: 'rgba(252,255,252,0.6)', border: '1px solid rgba(252,255,252,0.12)' }
                            }>
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  
                  {sizes && (
                    <div>
                      <p className="text-xs font-semibold mb-2.5" style={{ color: 'rgba(252,255,252,0.6)' }}>
                        Size{selectedSize ? `: ${selectedSize}` : ' — select one'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {sizes.map(s => (
                          <button key={s} onClick={() => setSelectedSize(s)}
                            className="min-w-[44px] px-3 py-2 rounded-[8px] text-xs font-semibold transition-all"
                            style={selectedSize === s
                              ? { background: '#FCFFFC', color: '#262626' }
                              : { background: '#1E1E1E', color: 'rgba(252,255,252,0.6)', border: '1px solid rgba(252,255,252,0.12)' }
                            }>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  
                  <div>
                    <p className="text-xs font-semibold mb-2.5" style={{ color: 'rgba(252,255,252,0.6)' }}>Quantity</p>
                    <div className="flex items-center gap-0 rounded-[8px] overflow-hidden w-fit" style={{ border: '1px solid rgba(252,255,252,0.12)' }}>
                      <button onClick={() => setQty(q => Math.max(1, q - 1))}
                        className="w-10 h-10 flex items-center justify-center transition-colors hover:bg-white/5"
                        style={{ color: '#FCFFFC' }}>
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-12 text-center text-sm font-semibold"
                        style={{ color: '#FCFFFC', borderLeft: '1px solid rgba(252,255,252,0.08)', borderRight: '1px solid rgba(252,255,252,0.08)' }}>
                        {qty}
                      </span>
                      <button onClick={() => setQty(q => Math.min(product.stock || 99, q + 1))}
                        className="w-10 h-10 flex items-center justify-center transition-colors hover:bg-white/5"
                        style={{ color: '#FCFFFC' }}>
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] mt-1.5" style={{ color: 'rgba(252,255,252,0.35)' }}>
                      {product.stock} units available
                    </p>
                  </div>

                  
                  <div className="flex gap-3 pt-2">
                    <button onClick={handleAddToCart}
                      disabled={(sizes && !selectedSize) || (productColors && !selectedColor)}
                      className="flex-1 py-3.5 rounded-[10px] text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                      style={{ background: addedToCart ? '#10b981' : '#FCFFFC', color: '#262626', transition: 'background 0.25s ease' }}>
                      <ShoppingBag className="w-4 h-4" />
                      {addedToCart ? 'Added to Cart!' : 'Add to Cart'}
                    </button>
                    <button
                      onClick={handleBuyNow}
                      disabled={(sizes && !selectedSize) || (productColors && !selectedColor)}
                      className="flex-1 py-3.5 rounded-[10px] text-sm font-bold flex items-center justify-center gap-2 transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                      style={{ background: '#D94840', color: '#FCFFFC' }}>
                      Buy Now
                    </button>
                  </div>

                  
                  <button
                    onClick={() => {
                      if (!getUser()) { setShowAuth(true); return; }
                      window.dispatchEvent(new CustomEvent('kuroyu:open-chat', {
                        detail: {
                          product: {
                            id: product._id,
                            title: product.title,
                            price: product.price,
                            image: allImages[activeImg] || product.image,
                          }
                        }
                      }));
                    }}
                    className="w-full py-3 rounded-[10px] text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:bg-white/5 active:scale-[0.98]"
                    style={{ border: '1px solid rgba(252,255,252,0.12)', color: 'rgba(252,255,252,0.75)' }}>
                    <MessageCircle className="w-4 h-4" />
                    Chat Seller
                  </button>

                </div>
              </div>
            </div>

            
            <div className="max-w-[1280px] mx-auto px-4 lg:px-8 pb-12">
              <div style={{ borderTop: '1px solid rgba(252,255,252,0.07)' }} className="pt-10">
                <div className="flex gap-10 items-start">

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 className="font-heading text-base font-bold mb-3" style={{ color: '#FCFFFC' }}>Description</h2>
                    {product.description ? (
                      <div className="text-sm leading-relaxed" style={{ color: 'rgba(252,255,252,0.55)', textAlign: 'justify' }}
                        dangerouslySetInnerHTML={{ __html: product.description }} />
                    ) : (
                      <p className="text-sm" style={{ color: 'rgba(252,255,252,0.2)' }}>No description available.</p>
                    )}
                  </div>


                  <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="font-heading text-base font-bold" style={{ color: '#FCFFFC' }}>Reviews</h2>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(252,255,252,0.07)', color: 'rgba(252,255,252,0.4)' }}>
                      {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                    </span>
                    <button className="ml-auto text-xs font-medium view-comment-btn"
                      style={{ color: 'rgba(252,255,252,0.5)', background: 'none', border: 'none', padding: 0, position: 'relative' }}>
                      View Comment
                      <style>{`.view-comment-btn::after{content:'';position:absolute;left:0;bottom:-1px;width:0;height:1px;background:rgba(252,255,252,0.5);transition:width .3s ease}.view-comment-btn:hover::after{width:100%}`}</style>
                    </button>
                  </div>
                  {reviews.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 rounded-[12px] gap-3"
                      style={{ background: 'rgba(252,255,252,0.02)', border: '1px solid rgba(252,255,252,0.06)' }}>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(i => (
                          <svg key={i} width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <path d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.27l-4.94 2.43.94-5.49-4-3.9 5.53-.8L10 1.5z"
                              fill="rgba(252,255,252,0.1)" stroke="rgba(252,255,252,0.15)" strokeWidth="1" strokeLinejoin="round"/>
                          </svg>
                        ))}
                      </div>
                      <p className="text-sm font-medium" style={{ color: 'rgba(252,255,252,0.35)' }}>No reviews yet</p>
                      <p className="text-xs" style={{ color: 'rgba(252,255,252,0.2)' }}>Be the first to review this product.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {reviews.map((rv, i) => (
                        <div key={i} className="px-4 py-4 rounded-[12px]" style={{ background: 'rgba(252,255,252,0.03)', border: '1px solid rgba(252,255,252,0.07)' }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{ background: 'rgba(252,255,252,0.1)', color: '#FCFFFC' }}>
                                {(rv.userName || 'A')[0].toUpperCase()}
                              </div>
                              <span className="text-xs font-semibold" style={{ color: '#FCFFFC' }}>{rv.userName || 'Anonymous'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1,2,3,4,5].map(n => (
                                <Star key={n} size={12} fill={n <= rv.rating ? '#FBBF24' : 'none'} color={n <= rv.rating ? '#FBBF24' : 'rgba(252,255,252,0.2)'} strokeWidth={1.5} />
                              ))}
                            </div>
                          </div>
                          {rv.text && <p className="text-sm" style={{ color: 'rgba(252,255,252,0.6)', lineHeight: 1.6 }}>{rv.text}</p>}
                          <p className="text-[10px] mt-2" style={{ color: 'rgba(252,255,252,0.25)' }}>
                            {new Date(rv.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  </div>
                </div>
              </div>
            </div>


            {explore.length > 0 && (
              <div className="max-w-[1280px] mx-auto px-4 lg:px-8 pb-12">
                <div style={{ borderTop: '1px solid rgba(252,255,252,0.07)' }} className="pt-10">
                  <h2 className="font-heading text-base font-bold mb-6" style={{ color: '#FCFFFC' }}>More Products</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {explore.map(p => (
                      <ProductCard key={p._id} product={p} onClick={handleNavigateRelated} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {related.length > 0 && (
              <div className="max-w-[1280px] mx-auto px-4 lg:px-8 pb-16">
                <div style={{ borderTop: '1px solid rgba(252,255,252,0.07)' }} className="pt-10">
                  <h2 className="font-heading text-lg font-bold mb-6" style={{ color: '#FCFFFC' }}>
                    More from {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {related.map(p => (
                      <ProductCard key={p._id} product={p} onClick={handleNavigateRelated} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
      {showAuth && <AuthModal mode="login" onClose={() => { setShowAuth(false); setPendingAction(null); }} onAuthenticated={onAuthenticated} />}
    </div>
  );
}
