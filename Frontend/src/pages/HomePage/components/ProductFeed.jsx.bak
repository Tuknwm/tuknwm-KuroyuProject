import React, { useEffect, useRef, useState, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Star, Sparkles, Loader2 } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCart } from '../../../context/CartContext';
import { AnimReadyContext } from '../../../App';
import { imgUrl } from '../../../utils';

gsap.registerPlugin(ScrollTrigger);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const PAGE_SIZE = 24;
const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

function flyToCart(imgEl) {
  const cartBtn = document.querySelector('[data-cart-btn]');
  if (!cartBtn || !imgEl) return;
  const from = imgEl.getBoundingClientRect();
  const to = cartBtn.getBoundingClientRect();

  const fly = document.createElement('img');
  fly.src = imgEl.src;
  Object.assign(fly.style, {
    position: 'fixed',
    left: `${from.left}px`, top: `${from.top}px`,
    width: `${from.width}px`, height: `${from.height}px`,
    borderRadius: '8px', objectFit: 'cover',
    pointerEvents: 'none', zIndex: 9999,
    transition: 'all 0.65s cubic-bezier(0.25, 1, 0.5, 1)',
    opacity: '1',
  });
  document.body.appendChild(fly);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    Object.assign(fly.style, {
      left: `${to.left + to.width / 2 - 16}px`,
      top: `${to.top + to.height / 2 - 16}px`,
      width: '32px', height: '32px',
      opacity: '0', borderRadius: '50%',
    });
  }));

  fly.addEventListener('transitionend', () => fly.remove(), { once: true });
}

export default function ProductFeed() {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const gridRef = useRef(null);
  const [products, setProducts] = useState([]);
  const animReady = useContext(AnimReadyContext);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const fetchProducts = useCallback(async (currentOffset, replace) => {
    try {
      replace ? setLoading(true) : setLoadingMore(true);
      setError('');
      const r = await fetch(`${API_URL}/api/products?limit=${PAGE_SIZE}&skip=${currentOffset}`);
      if (!r.ok) throw new Error('Could not load products.');
      const data = await r.json();
      const incoming = data.data || [];
      setProducts(prev => replace ? incoming : [...prev, ...incoming]);
      setHasMore(incoming.length === PAGE_SIZE);
      setOffset(currentOffset + incoming.length);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setProducts([]); setOffset(0); setHasMore(true);
    fetchProducts(0, true);
  }, []);

  useEffect(() => {
    if (!gridRef.current || products.length === 0 || !animReady) return;
    const cards = gridRef.current.querySelectorAll('article');
    gsap.fromTo(cards,
      { y: 40, autoAlpha: 0 },
      {
        y: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out', stagger: 0.06,
        scrollTrigger: { trigger: gridRef.current, start: 'top 85%', toggleActions: 'play none none none' },
      }
    );
    return () => ScrollTrigger.getAll().forEach(t => t.kill());
  }, [products, animReady]);

  const visible = products;

  return (
    <section className="w-full max-w-[1280px] mx-auto px-4 lg:px-8 py-6">

      <div className="mb-6">
        <h2 className="font-heading text-lg sm:text-xl font-bold flex items-center gap-2" style={{ color: '#FCFFFC' }}>
          <Sparkles className="w-5 h-5" style={{ color: 'rgba(252,255,252,0.5)' }} />
          Kuroyu Products
        </h2>

      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'rgba(252,255,252,0.3)' }} />
        </div>
      )}

      {error && <p className="text-sm text-center py-10" style={{ color: 'rgba(245,245,245,0.45)', letterSpacing: '0.05em' }}>Something's not right — please try again later.</p>}

      {!loading && !error && visible.length === 0 && (
        <p className="text-sm text-center py-10" style={{ color: 'rgba(252,255,252,0.4)' }}>No products to display.</p>
      )}

      {!loading && !error && visible.length > 0 && (
        <>
          <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
            {visible.map(product => (
              <ProductCard key={product._id} product={product} navigate={navigate} addItem={addItem} currency={currency} />
            ))}
          </div>

          
          <div className="mt-10 flex flex-col items-center gap-2">
            {hasMore ? (
              <button
                onClick={() => fetchProducts(offset, false)}
                disabled={loadingMore}
                className="px-8 py-3 rounded-[8px] text-xs font-semibold flex items-center gap-2 transition-all hover:bg-white/5 disabled:opacity-50"
                style={{ border: '1px solid rgba(252,255,252,0.08)', color: '#FCFFFC' }}>
                {loadingMore
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Loading...</>
                  : 'Load More'}
              </button>
            ) : (
              <p className="text-xs" style={{ color: 'rgba(252,255,252,0.25)' }}>All products loaded</p>
            )}
            <span className="text-[11px]" style={{ color: 'rgba(252,255,252,0.3)' }}>{visible.length} products shown</span>
          </div>
        </>
      )}
    </section>
  );
}

const lineSegment = (origin, hovered) => ({
  position: 'absolute',
  width: 1,
  height: '18%',
  background: '#fff',
  transformOrigin: origin,
  transform: hovered ? 'scaleY(1)' : 'scaleY(0)',
  transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
});

function ProductCard({ product, navigate, addItem, currency }) {
  const [hovered, setHovered] = useState(false);

  return (
    <article
      onClick={() => navigate(`/product/${product._id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-[8px] flex flex-col cursor-pointer"
      style={{ position: 'relative', willChange: 'transform, opacity' }}
    >
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: -8, top: 0, bottom: 0, width: 1, pointerEvents: 'none' }}>
          <span style={{ ...lineSegment('bottom', hovered), bottom: '50%' }} />
          <span style={{ ...lineSegment('top', hovered), top: '50%' }} />
        </span>
        <span style={{ position: 'absolute', right: -8, top: 0, bottom: 0, width: 1, pointerEvents: 'none' }}>
          <span style={{ ...lineSegment('bottom', hovered), bottom: '50%' }} />
          <span style={{ ...lineSegment('top', hovered), top: '50%' }} />
        </span>

        <div className="aspect-square w-full rounded-[8px] overflow-hidden" style={{ background: '#2E2E2E' }}>
          {product.image
            ? <img src={imgUrl(product.image)} alt={product.title} className="h-full w-full object-cover" loading="lazy" />
            : <div className="h-full w-full flex items-center justify-center text-xs" style={{ color: 'rgba(252,255,252,0.2)' }}>No image</div>
          }
        </div>
      </div>

      <h3 className="text-lg font-semibold line-clamp-2 flex-1 mt-3" style={{ color: '#FCFFFC' }}>{product.title}</h3>

      <div className="mt-2">
        <div className="flex items-baseline gap-2">
          <p className="text-sm font-bold" style={{ color: product.discount > 0 ? '#E85F5C' : '#FCFFFC' }}>{currency.format(product.price)}</p>
          {product.originalPrice > product.price && (
            <p className="text-[10px] line-through" style={{ color: 'rgba(252,255,252,0.3)' }}>{currency.format(product.originalPrice)}</p>
          )}
        </div>
        <div className="mt-1.5 text-[11px] flex items-center gap-1" style={{ color: 'rgba(252,255,252,0.4)' }}>
          <Star className="w-3 h-3" style={{ color: product.rating ? '#C8A96E' : 'rgba(252,255,252,0.2)', fill: product.rating ? '#C8A96E' : 'none' }} />
          {product.rating != null ? product.rating.toFixed(1) : '—'} · {product.soldCount || 0} sold
        </div>
      </div>

      <button
        onClick={e => {
          e.stopPropagation();
          const imgEl = e.currentTarget.closest('article').querySelector('img');
          flyToCart(imgEl);
          addItem(product, {});
        }}
        className="mt-3 w-full py-2 rounded-[8px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:opacity-85"
        style={{ border: '1px solid rgba(252,255,252,0.2)', color: '#FCFFFC' }}>
        <ShoppingBag className="w-3.5 h-3.5" />Add to Cart
      </button>
    </article>
  );
}
