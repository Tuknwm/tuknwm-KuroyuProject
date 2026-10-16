import React, { useEffect, useState } from 'react';
import { Flame, ChevronRight, Star, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { imgUrl } from '../../../utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

export default function FlashSale() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/products?discount=true&limit=6&sort=sold`)
      .then(r => r.json())
      .then(data => setProducts(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="w-full max-w-[1280px] mx-auto px-2 lg:px-1 py-4">
      <div className="rounded-[8px] p-1 md:p-6 relative overflow-hidden">

        <div className="flex items-center justify-between mb-5 pb-4"
          style={{ borderBottom: '1px solid rgba(252,255,252,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-[8px] text-xs font-bold"
              style={{ background: '#D94840', color: '#FCFFFC' }}>
              <Flame className="w-3.5 h-3.5 fill-white animate-pulse" />
              FLASH SALE
            </div>
            <span className="text-xs font-medium" style={{ color: 'rgba(252,255,252,0.4)' }}>
              Limited time deals
            </span>
          </div>
          <button onClick={() => navigate('/search?discount=true')}
            className="text-xs sm:text-sm font-semibold flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{ color: '#D94840' }}>
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-[8px] animate-pulse overflow-hidden" style={{ background: '#1E1E1E' }}>
                  <div className="aspect-square w-full" style={{ background: '#2E2E2E' }} />
                  <div className="p-3 space-y-2">
                    <div className="h-3 rounded" style={{ background: '#2E2E2E', width: '85%' }} />
                    <div className="h-3 rounded" style={{ background: '#2E2E2E', width: '55%' }} />
                  </div>
                </div>
              ))
            : products.map(product => (
                <article key={product._id}
                  onClick={() => navigate(`/product/${product._id}`)}
                  className="rounded-[8px] p-3 flex flex-col cursor-pointer transition-all hover:scale-[1.01]"
                  style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.07)' }}>

                  <div className="relative aspect-square w-full rounded-[8px] overflow-hidden mb-3" style={{ background: '#2E2E2E' }}>
                    {product.image
                      ? <img src={imgUrl(product.image)} alt={product.title} className="h-full w-full object-cover" loading="lazy" />
                      : <div className="h-full w-full flex items-center justify-center text-xs" style={{ color: 'rgba(252,255,252,0.2)' }}>No image</div>
                    }
                  </div>

                  <h3 className="text-xs font-semibold line-clamp-2 flex-1" style={{ color: '#FCFFFC' }}>{product.title}</h3>

                  <div className="mt-2">
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-bold" style={{ color: '#E85F5C' }}>{currency.format(product.price)}</p>
                      {product.originalPrice > product.price && (
                        <p className="text-[10px] line-through" style={{ color: 'rgba(252,255,252,0.3)' }}>{currency.format(product.originalPrice)}</p>
                      )}
                    </div>
                    <div className="mt-1.5 text-[11px] flex items-center gap-1" style={{ color: 'rgba(252,255,252,0.4)' }}>
                      <Star className="w-3 h-3 fill-[#C8A96E]" style={{ color: '#C8A96E' }} />
                      {product.rating?.toFixed(1)} · {product.soldCount || 0} sold
                    </div>
                  </div>

                  <button
                    onClick={e => e.stopPropagation()}
                    className="mt-3 w-full py-2 rounded-[8px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all hover:opacity-85"
                    style={{ border: '1px solid rgba(252,255,252,0.2)', color: '#FCFFFC' }}>
                    <ShoppingBag className="w-3.5 h-3.5" />Add to Cart
                  </button>
                </article>
              ))
          }
        </div>

      </div>
    </section>
  );
}
