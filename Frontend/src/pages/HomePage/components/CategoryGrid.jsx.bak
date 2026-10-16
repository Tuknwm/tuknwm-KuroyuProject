import React, { useEffect, useState } from 'react';
import { ArrowRight, Grid2X2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function CategoryGrid() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${API_URL}/api/categories`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(p => setCategories(p.data || []))
      .catch(() => setCategories([]))
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  if (!loading && categories.length === 0) return null;

  return (
    <section className="w-full max-w-[1280px] mx-auto px-4 lg:px-8 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-lg font-bold" style={{ color: '#FCFFFC' }}>Featured Categories</h2>
        <button className="text-xs font-semibold flex items-center gap-1 hover:opacity-70 transition-opacity" style={{ color: 'rgba(252,255,252,0.5)' }}>
          View All <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {loading && <p className="text-xs" style={{ color: 'rgba(252,255,252,0.4)' }}>Loading categories...</p>}

      {categories.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {categories.slice(0, 8).map(category => (
            <div key={category._id}
              className="rounded-[8px] p-4 flex flex-col items-center text-center cursor-pointer transition-all hover:scale-[1.02] group"
              style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.07)' }}>
              <div className="w-12 h-12 rounded-[8px] flex items-center justify-center mb-2.5 transition-colors group-hover:bg-white/10"
                style={{ background: 'rgba(252,255,252,0.06)' }}>
                {category.icon
                  ? <span className="text-xl">{category.icon}</span>
                  : <Grid2X2 className="w-6 h-6" style={{ color: 'rgba(252,255,252,0.6)' }} />
                }
              </div>
              <span className="text-xs font-semibold line-clamp-2" style={{ color: '#FCFFFC' }}>{category.name}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
