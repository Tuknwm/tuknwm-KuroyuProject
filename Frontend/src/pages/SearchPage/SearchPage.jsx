import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Star, SlidersHorizontal, X, ChevronDown, ArrowLeft, Search } from 'lucide-react';
import Header from '../HomePage/components/Header';
import Footer from '../HomePage/components/Footer';
import { imgUrl } from '../../utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'sold', label: 'Best Selling' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];
const PRICE_PRESETS = [
  { label: 'Under Rp 200k', min: 0, max: 200000 },
  { label: 'Rp 200k - 500k', min: 200000, max: 500000 },
  { label: 'Rp 500k - 1jt', min: 500000, max: 1000000 },
  { label: 'Over Rp 1jt', min: 1000000, max: 99999999 },
];

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
      </div>
      <h3 className="text-xs font-semibold line-clamp-2 flex-1" style={{ color: '#FCFFFC' }}>{product.title}</h3>
      <div className="mt-2">
        <p className="text-sm font-bold" style={{ color: product.discount > 0 ? '#E85F5C' : '#FCFFFC' }}>{currency.format(product.price)}</p>
        {product.originalPrice > product.price && (
          <p className="text-[10px] line-through mt-0.5" style={{ color: 'rgba(252,255,252,0.3)' }}>{currency.format(product.originalPrice)}</p>
        )}
        <div className="mt-1.5 flex items-center gap-1 text-[11px]" style={{ color: 'rgba(252,255,252,0.4)' }}>
          <Star className="w-3 h-3 fill-[#C8A96E]" style={{ color: '#C8A96E' }} />
          {product.rating?.toFixed(1)} · {product.soldCount} sold
        </div>
      </div>
    </article>
  );
}

function FilterContent({ filters, onChange, onReset, onClose, isMobile, categories }) {
  return (
    <>
      <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(252,255,252,0.07)' }}>
        <span className="font-heading text-sm font-bold" style={{ color: '#FCFFFC' }}>Filters</span>
        <div className="flex items-center gap-3">
          <button onClick={onReset} className="text-xs transition-opacity hover:opacity-70" style={{ color: '#D94840' }}>Reset</button>
          {isMobile && <button onClick={onClose} className="p-1" style={{ color: 'rgba(252,255,252,0.5)' }}><X className="w-4 h-4" /></button>}
        </div>
      </div>
      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        <div>
          <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'rgba(252,255,252,0.5)' }}>Category</p>
          <div className="space-y-1">
            {categories.map(cat => (
              <label key={cat.name || cat} className="flex items-center gap-2.5 py-1 cursor-pointer group">
                <input type="checkbox"
                  checked={filters.categories.includes(cat.name || cat)}
                  onChange={() => {
                    const name = cat.name || cat;
                    const next = filters.categories.includes(name)
                      ? filters.categories.filter(c => c !== name)
                      : [...filters.categories, name];
                    onChange({ ...filters, categories: next });
                  }}
                  className="rounded" />
                <span className="text-xs capitalize transition-colors group-hover:text-white"
                  style={{ color: filters.categories.includes(cat.name || cat) ? '#FCFFFC' : 'rgba(252,255,252,0.55)' }}>
                  {cat.name || cat}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'rgba(252,255,252,0.5)' }}>Price Range</p>
          <div className="space-y-1">
            {PRICE_PRESETS.map(p => (
              <button key={p.label}
                onClick={() => onChange({ ...filters, minPrice: p.min, maxPrice: p.max, priceLabel: p.label })}
                className="w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs transition-all"
                style={filters.priceLabel === p.label
                  ? { background: 'rgba(252,255,252,0.1)', color: '#FCFFFC', fontWeight: 600 }
                  : { color: 'rgba(252,255,252,0.55)' }}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input type="number" placeholder="Min"
              value={filters.customMin}
              onChange={e => onChange({ ...filters, customMin: e.target.value, minPrice: Number(e.target.value) || 0, priceLabel: null })}
              className="w-full rounded-[6px] px-2 py-1.5 text-xs bg-transparent focus:outline-none"
              style={{ border: '1px solid rgba(252,255,252,0.1)', color: '#FCFFFC' }} />
            <span className="text-xs shrink-0" style={{ color: 'rgba(252,255,252,0.3)' }}>-</span>
            <input type="number" placeholder="Max"
              value={filters.customMax}
              onChange={e => onChange({ ...filters, customMax: e.target.value, maxPrice: Number(e.target.value) || 99999999, priceLabel: null })}
              className="w-full rounded-[6px] px-2 py-1.5 text-xs bg-transparent focus:outline-none"
              style={{ border: '1px solid rgba(252,255,252,0.1)', color: '#FCFFFC' }} />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'rgba(252,255,252,0.5)' }}>Min. Rating</p>
          <div className="flex gap-2">
            {[4, 4.5, 4.8].map(r => (
              <button key={r}
                onClick={() => onChange({ ...filters, minRating: filters.minRating === r ? null : r })}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-[6px] text-xs transition-all"
                style={filters.minRating === r
                  ? { background: 'rgba(200,169,110,0.15)', color: '#C8A96E', border: '1px solid rgba(200,169,110,0.3)' }
                  : { background: '#2E2E2E', color: 'rgba(252,255,252,0.5)', border: '1px solid rgba(252,255,252,0.08)' }}>
                <Star className="w-3 h-3 fill-[#C8A96E]" style={{ color: '#C8A96E' }} />{r}+
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function FilterPanel({ filters, onChange, onReset, isMobile, onClose, categories }) {
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div className="relative ml-auto w-72 h-full overflow-y-auto flex flex-col"
          style={{ background: '#1E1E1E' }}>
          <FilterContent filters={filters} onChange={onChange} onReset={onReset} onClose={onClose} isMobile categories={categories} />
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-24 w-64 shrink-0 flex flex-col"
      style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.07)', borderRadius: 12 }}>
      <FilterContent filters={filters} onChange={onChange} onReset={onReset} isMobile={false} categories={categories} />
    </div>
  );
}

const DEFAULT_FILTERS = {
  categories: [], minPrice: 0, maxPrice: 99999999, priceLabel: null,
  customMin: '', customMax: '', minRating: null,
};

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') || '';

  const [query, setQuery] = useState(q);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('newest');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/categories`)
      .then(r => r.ok ? r.json() : [])
      .then(data => setCategories(Array.isArray(data) ? data : data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => { setQuery(q); }, [q]);

  const fetchProducts = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ limit: 48, sort });
      if (q) params.set('search', q);
      if (filters.categories.length === 1) params.set('category', filters.categories[0]);
      if (filters.minPrice > 0) params.set('minPrice', filters.minPrice);
      if (filters.maxPrice < 99999999) params.set('maxPrice', filters.maxPrice);
      const r = await fetch(`${API_URL}/api/products?${params}`);
      if (!r.ok) throw new Error('Failed to load products.');
      const data = await r.json();
      let results = data.data || [];
      if (filters.categories.length > 1) results = results.filter(p => filters.categories.includes(p.category));
      if (filters.minRating) results = results.filter(p => p.rating >= filters.minRating);
      setProducts(results);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [q, sort, filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  function handleSearch(e) {
    e.preventDefault();
    setSearchParams(query ? { q: query } : {});
  }

  function handleReset() { setFilters(DEFAULT_FILTERS); }

  const activeFilterCount = [
    filters.categories.length > 0,
    filters.priceLabel || filters.customMin || filters.customMax,
    filters.minRating,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen font-body flex flex-col" style={{ background: '#080808', color: '#FCFFFC' }}>
      <div className="fixed inset-0 pointer-events-none select-none flex items-center justify-center z-0" aria-hidden="true">
        <img src="/CatLogoWhite.png" alt="" style={{ width: '15vw', maxWidth: 600, opacity: 0.01, userSelect: 'none', filter: 'grayscale(1)' }} />
      </div>
      <Header />

      <main className="flex-1 pt-16">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-8 py-6">

          {/* Mobile searchbar */}
          <form onSubmit={handleSearch} className="lg:hidden mb-4">
            <div className="flex items-center rounded-[8px] px-4 py-2.5 transition-all focus-within:ring-1 focus-within:ring-white/20"
              style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.08)' }}>
              <Search className="w-4 h-4 mr-3 shrink-0" style={{ color: 'rgba(252,255,252,0.3)' }} />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-transparent text-sm focus:outline-none"
                style={{ color: '#FCFFFC' }} />
              {query && (
                <button type="button" onClick={() => { setQuery(''); setSearchParams({}); }}
                  className="ml-2 p-0.5" style={{ color: 'rgba(252,255,252,0.4)' }}>
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/')}
                className="flex items-center gap-1.5 text-xs transition-opacity hover:opacity-60"
                style={{ color: 'rgba(252,255,252,0.45)' }}>
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <span style={{ color: 'rgba(252,255,252,0.2)' }}>/</span>
              <p className="text-xs" style={{ color: 'rgba(252,255,252,0.45)' }}>
                {loading ? 'Searching...' : `${products.length} results${q ? ` for "${q}"` : ''}`}
              </p>
              <button onClick={() => setMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all"
                style={{ background: activeFilterCount > 0 ? 'rgba(217,72,64,0.12)' : '#1E1E1E', border: '1px solid rgba(252,255,252,0.08)', color: activeFilterCount > 0 ? '#D94840' : 'rgba(252,255,252,0.6)' }}>
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </button>
            </div>

            <div className="relative">
              <button onClick={() => setSortOpen(o => !o)}
                className="flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-[8px] text-xs font-semibold"
                style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.08)', color: '#FCFFFC' }}>
                {SORT_OPTIONS.find(o => o.value === sort)?.label}
                <ChevronDown className="w-3.5 h-3.5 transition-transform" style={{ color: 'rgba(252,255,252,0.4)', transform: sortOpen ? 'rotate(180deg)' : 'none' }} />
              </button>
              {sortOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                  <div className="absolute right-0 top-full mt-1.5 z-20 rounded-[10px] py-1 min-w-[160px]"
                    style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                    {SORT_OPTIONS.map(o => (
                      <button key={o.value}
                        onClick={() => { setSort(o.value); setSortOpen(false); }}
                        className="w-full text-left px-3 py-2 text-xs transition-colors hover:bg-white/5"
                        style={{ color: sort === o.value ? '#FCFFFC' : 'rgba(252,255,252,0.55)', fontWeight: sort === o.value ? 600 : 400 }}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-6">
            <div className="hidden lg:block">
              <FilterPanel filters={filters} onChange={setFilters} onReset={handleReset} isMobile={false} categories={categories} />
            </div>

            <div className="flex-1 min-w-0">
              {loading && (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div key={i} className="rounded-[8px] overflow-hidden animate-pulse" style={{ background: '#1E1E1E' }}>
                      <div className="aspect-square w-full" style={{ background: '#2E2E2E' }} />
                      <div className="p-3 space-y-2">
                        <div className="h-3 rounded" style={{ background: '#2E2E2E', width: '80%' }} />
                        <div className="h-3 rounded" style={{ background: '#2E2E2E', width: '50%' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!loading && error && (
                <p className="text-sm text-center py-16" style={{ color: 'rgba(245,245,245,0.45)', letterSpacing: '0.05em' }}>Something's not right — please try again later.</p>
              )}

              {!loading && !error && products.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                  <p className="font-semibold text-sm" style={{ color: '#FCFFFC' }}>No products found</p>
                  <p className="text-xs" style={{ color: 'rgba(252,255,252,0.4)' }}>
                    Try a different search term or clear the filters.
                  </p>
                  <button onClick={handleReset}
                    className="px-4 py-2 rounded-[8px] text-xs font-semibold transition-all hover:opacity-85"
                    style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.1)', color: '#FCFFFC' }}>
                    Clear Filters
                  </button>
                </div>
              )}

              {!loading && !error && products.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {products.map(p => (
                    <ProductCard key={p._id} product={p} onClick={id => navigate(`/product/${id}`)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {mobileFilterOpen && (
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          onReset={handleReset}
          isMobile
          onClose={() => setMobileFilterOpen(false)}
          categories={categories}
        />
      )}

      <Footer />
    </div>
  );
}
