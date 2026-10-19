import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthModal from './AuthModal';
import { Search, ShoppingCart, Bell, Settings, LogOut, ChevronDown, Package, Tag, Info, MessageCircle } from 'lucide-react';
import { useCart } from '../../../context/CartContext';
import { imgUrl } from '../../../utils';

let navAnimPlayed = false; 
const ICON_MAP = { package: Package, tag: Tag, info: Info, truck: MessageCircle };
const notifIcon = (icon) => ICON_MAP[icon] || Info;

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Tooltip({ children }) {
  return (
    <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[6px] px-2 py-1 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
      style={{ background: '#1E1E1E', color: 'rgba(252,255,252,0.7)', border: '1px solid rgba(252,255,252,0.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
      {children}
    </span>
  );
}

export default function Header() {
  const headerRef = useRef(null);
  const location  = useLocation();
  const isHome    = location.pathname === '/';

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(headerRef.current, { opacity: 1 });
      return;
    }
    const el = headerRef.current;
    if (navAnimPlayed) {
      el.classList.remove('gsap-nav-init');
      return;
    }
    navAnimPlayed = true;
    el.classList.remove('gsap-nav-init');
    gsap.fromTo(el,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 0.2 }
    );
  }, []);
  const [authMode, setAuthMode] = useState(null);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem('kuroyu_user') || localStorage.getItem('kuroyu_user'));
    } catch { return null; }
  });
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const { totalCount, clearCart } = useCart();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSuggestOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSuggestions([]); setSuggestOpen(false); return; }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`${API_URL}/api/products?search=${encodeURIComponent(searchQuery.trim())}&limit=6`);
        const data = await r.json();
        setSuggestions(data.data || []);
        setSuggestOpen(true);
      } catch {  }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 12); }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('kuroyu_token') || sessionStorage.getItem('kuroyu_token');
    if (!user || !token) return;
    const authH = { Authorization: `Bearer ${token}` };

    fetch(`${API_URL}/api/notifications`, { headers: authH })
      .then(r => r.json())
      .then(d => { if (d.success) setNotifications(d.notifications); })
      .catch(() => {});

    const es = new EventSource(`${API_URL}/api/notifications/stream?token=${token}`);
    es.onmessage = (e) => {
      try {
        const notif = JSON.parse(e.data);
        setNotifications(prev => [notif, ...prev]);
      } catch {  }
    };
    return () => es.close();
  }, [user]);

  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [logoutClosing, setLogoutClosing] = useState(false);
  function closeLogout() {
    setLogoutClosing(true);
    setTimeout(() => { setLogoutConfirm(false); setLogoutClosing(false); }, 200);
  }
  function logout() {
    localStorage.removeItem('kuroyu_token'); localStorage.removeItem('kuroyu_user');
    localStorage.removeItem('kuroyu_cart');
    sessionStorage.removeItem('kuroyu_token'); sessionStorage.removeItem('kuroyu_user');
    clearCart();
    window.location.href = '/';
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    const token = localStorage.getItem('kuroyu_token') || sessionStorage.getItem('kuroyu_token');
    if (token) fetch(`${API_URL}/api/notifications/read`, { method: 'PATCH', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
  }

  function clearNotifications() {
    setNotifications([]);
    const token = localStorage.getItem('kuroyu_token') || sessionStorage.getItem('kuroyu_token');
    if (token) fetch(`${API_URL}/api/notifications`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).catch(() => {});
  }

  return (
    <>
    
    <div aria-hidden="true" style={{
      position: 'fixed', top: 0, left: 0, right: 0, height: 64, zIndex: 49,
      background: scrolled && !isHome ? 'rgba(8,8,8,0.85)' : 'transparent',
      backdropFilter: scrolled && !isHome ? 'blur(16px) saturate(180%)' : 'none',
      WebkitBackdropFilter: scrolled && !isHome ? 'blur(16px) saturate(180%)' : 'none',
      borderBottom: scrolled && !isHome ? '1px solid rgba(252,255,252,0.07)' : 'none',
      boxShadow: scrolled && !isHome ? '0 4px 24px rgba(0,0,0,0.35)' : 'none',
      transition: 'background 0.5s ease, box-shadow 0.3s ease',
      pointerEvents: 'none',
    }} />

    <header ref={headerRef} className="w-full fixed top-0 left-0 right-0 z-50 gsap-nav-init"
      style={{ background: 'transparent' }}>

      <div className="max-w-[1280px] mx-auto px-6 py-3.5 flex items-center justify-between gap-4 lg:gap-8">


        <div className="flex-1 flex items-center gap-2.5 cursor-pointer select-none group" onClick={() => navigate('/')}>
          <img src="/CatLogoWhite.png" alt="Kuroyu Logo" className="h-10 w-auto object-contain group-hover:scale-105 transition-transform" />
          <span className="font-heading text-2xl font-bold tracking-tight leading-none" style={{ color: '#FCFFFC' }}>
            kuroyu<span style={{ color: 'rgba(252,255,252,0.35)' }}>.</span>
          </span>
        </div>

        
        <div className="flex-[2] min-w-0 max-w-[672px] relative" ref={searchRef}>
          <form onSubmit={e => {
            e.preventDefault();
            setSuggestOpen(false);
            if (searchQuery.trim()) navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
          }}>
            <div className="flex items-center rounded-[8px] px-4 py-2.5 transition-all focus-within:ring-1 focus-within:ring-white/20"
              style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.08)' }}>
              <Search className="w-4 h-4 mr-3 shrink-0" style={{ color: 'rgba(252,255,252,0.3)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setSuggestOpen(true)}
                placeholder="Search products, brands, or categories..."
                className="w-full bg-transparent text-sm focus:outline-none"
                style={{ color: '#FCFFFC' }} />
            </div>
          </form>

          
          {suggestOpen && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 rounded-[10px] overflow-hidden z-50"
              style={{ background: '#2E2E2E', border: '1px solid rgba(252,255,252,0.08)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
              {suggestions.map(p => (
                <button key={p._id}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { setSuggestOpen(false); setSearchQuery(''); navigate(`/product/${p._id}`); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/5">
                  <div className="w-9 h-9 rounded-[6px] overflow-hidden shrink-0" style={{ background: '#1E1E1E' }}>
                    {p.image && <img src={imgUrl(p.image)} alt={p.title} className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: '#FCFFFC' }}>{p.title}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'rgba(252,255,252,0.4)' }}>
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p.price)}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-[6px] shrink-0 capitalize"
                    style={{ background: 'rgba(252,255,252,0.06)', color: 'rgba(252,255,252,0.4)' }}>
                    {p.category}
                  </span>
                </button>
              ))}
              <button
                onMouseDown={e => e.preventDefault()}
                onClick={() => { setSuggestOpen(false); navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`); }}
                className="w-full flex items-center gap-2 px-4 py-3 text-xs font-semibold transition-colors hover:bg-white/5"
                style={{ borderTop: '1px solid rgba(252,255,252,0.06)', color: '#D94840' }}>
                <Search className="w-3.5 h-3.5" />
                See all results for "{searchQuery}"
              </button>
            </div>
          )}
        </div>

        
        <div className="flex-1 flex items-center justify-end gap-2">

          
          {user && (
            <div className="relative group">
              <button onClick={() => window.dispatchEvent(new CustomEvent('kuroyu:open-chat'))}
                className="p-2 rounded-[8px] transition-colors hover:bg-white/5"
                style={{ color: 'rgba(252,255,252,0.6)' }}>
                <MessageCircle className="w-5 h-5" />
              </button>
              <Tooltip>Chat</Tooltip>
            </div>
          )}

          
          {user && <div className="relative" ref={notifRef}>
            <div className="relative group">
              <button onClick={() => { const opening = !notifOpen; setNotifOpen(opening); setDropdownOpen(false); if (opening) markAllRead(); }}
                className="relative p-2 rounded-[8px] transition-colors hover:bg-white/5"
                style={{ color: 'rgba(252,255,252,0.6)' }}>
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D94840]"
                    style={{ boxShadow: '0 0 0 2px #080808' }} />
                )}
              </button>
              <Tooltip>Notifications</Tooltip>
            </div>

            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-[12px] overflow-hidden"
                style={{ background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(252,255,252,0.08)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', zIndex: 100 }}>
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(252,255,252,0.06)' }}>
                  <span className="text-xs font-bold" style={{ color: '#FCFFFC' }}>Notifications</span>
                  {notifications.length > 0 && (
                    <button onClick={clearNotifications} className="text-[11px] transition-opacity hover:opacity-70" style={{ color: '#D94840' }}>
                      Clear
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 && (
                    <p className="text-center text-xs py-8" style={{ color: 'rgba(252,255,252,0.3)' }}>No notifications yet.</p>
                  )}
                  {notifications.map(n => {
                    const NIcon = notifIcon(n.icon);
                    return (
                      <div key={n._id || n.id} className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
                        style={{ borderBottom: '1px solid rgba(252,255,252,0.04)', background: n.unread ? 'rgba(217,72,64,0.04)' : 'transparent' }}
                        onClick={() => setNotifications(prev => prev.map(x => (x._id || x.id) === (n._id || n.id) ? { ...x, unread: false } : x))}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: n.unread ? 'rgba(217,72,64,0.15)' : 'rgba(252,255,252,0.06)' }}>
                          <NIcon className="w-4 h-4" style={{ color: n.unread ? '#D94840' : 'rgba(252,255,252,0.4)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold" style={{ color: '#FCFFFC' }}>{n.title}</p>
                          <p className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'rgba(252,255,252,0.5)' }}>{n.body}</p>
                          <p className="text-[10px] mt-1" style={{ color: 'rgba(252,255,252,0.3)' }}>{timeAgo(n.createdAt)}</p>
                        </div>
                        {n.unread && <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: '#D94840' }} />}
                      </div>
                    );
                  })}
                </div>

              </div>
            )}
          </div>}

          
          {user && (
            <div className="relative group">
              <button onClick={() => navigate('/orders')}
                className="p-2 rounded-[8px] transition-colors hover:bg-white/5"
                style={{ color: 'rgba(252,255,252,0.6)' }}>
                <Package className="w-5 h-5" />
              </button>
              <Tooltip>My Orders</Tooltip>
            </div>
          )}

          
          <div className="relative group">
            <button data-cart-btn onClick={() => navigate('/cart')}
              className="relative p-2 rounded-[8px] transition-colors hover:bg-white/5"
              style={{ color: 'rgba(252,255,252,0.6)' }}>
              <ShoppingCart className="w-5 h-5" />
              {totalCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D94840]"
                  style={{ boxShadow: '0 0 0 2px #080808' }} />
              )}
            </button>
            <Tooltip>My Cart</Tooltip>
          </div>

          <div className="h-6 w-[1px] hidden sm:block" style={{ background: 'rgba(252,255,252,0.08)' }} />

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button onClick={() => { setDropdownOpen(o => !o); setNotifOpen(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-xs font-semibold transition-all hover:bg-white/5"
                style={{ color: '#FCFFFC' }}>
                  <span className="hidden sm:inline">Hi,&nbsp;&nbsp;{user.name}</span>
                <ChevronDown className="w-3.5 h-3.5" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', color: 'rgba(252,255,252,0.4)', transition: 'transform 0.2s' }} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-[10px] overflow-hidden py-1"
                  style={{ background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(252,255,252,0.08)', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', zIndex: 100 }}>
                  <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(252,255,252,0.06)' }}>
                    <div className="text-xs font-semibold" style={{ color: '#FCFFFC' }}>{user.name}</div>
                    <div className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(252,255,252,0.4)' }}>{user.email}</div>
                  </div>
                  <button onClick={() => { setDropdownOpen(false); navigate('/settings/account'); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs transition-colors hover:bg-white/5"
                    style={{ color: 'rgba(252,255,252,0.75)' }}>
                    <Settings className="w-4 h-4 shrink-0" style={{ color: 'rgba(252,255,252,0.4)' }} />
                    Settings
                  </button>
                  <div className="my-1" style={{ borderTop: '1px solid rgba(252,255,252,0.06)' }} />
                  <button onClick={() => { setDropdownOpen(false); setLogoutConfirm(true); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-xs transition-colors hover:bg-[rgba(217,72,64,0.08)]"
                    style={{ color: '#D94840' }}>
                    <LogOut className="w-4 h-4 shrink-0" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => setAuthMode('login')}
                className="px-4 py-2 rounded-[8px] text-xs font-semibold transition-all hover:bg-white/5"
                style={{ border: '1px solid rgba(252,255,252,0.2)', color: '#FCFFFC' }}>
                Sign In
              </button>
              <button onClick={() => setAuthMode('register')}
                className="px-4 py-2 rounded-[8px] text-xs font-semibold transition-all hover:opacity-85"
                style={{ background: '#FCFFFC', color: '#262626' }}>
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>

      {authMode && <AuthModal mode={authMode} onClose={() => setAuthMode(null)} onAuthenticated={setUser} />}
    </header>

    {!isHome && <div style={{ height: 64 }} aria-hidden="true" />}

    {logoutConfirm && (
      <div className="fixed inset-0 flex items-center justify-center"
        style={{ zIndex: 9999, background: logoutClosing ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.6)', transition: 'background 0.2s ease' }}
        onClick={closeLogout}>
        <style>{`
          @keyframes hdr-logout-in  { from { opacity:0; transform:scale(0.92) translateY(10px) } to { opacity:1; transform:scale(1) translateY(0) } }
          @keyframes hdr-logout-out { from { opacity:1; transform:scale(1) translateY(0) } to { opacity:0; transform:scale(0.92) translateY(10px) } }
        `}</style>
        <div className="rounded-[8px] p-6 w-72"
          style={{ background: '#1E1E1E', animation: `${logoutClosing ? 'hdr-logout-out' : 'hdr-logout-in'} 0.2s ease forwards` }}
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-center mb-4">
            <LogOut className="w-5 h-5" style={{ color: '#D94840' }} />
          </div>
          <p className="text-sm font-bold text-center mb-1" style={{ color: '#FCFFFC' }}>Sign out?</p>
          <p className="text-xs text-center mb-5" style={{ color: 'rgba(252,255,252,0.4)' }}>You will be returned to the homepage.</p>
          <div className="flex gap-2">
            <button onClick={closeLogout}
              className="flex-1 py-2.5 rounded-[8px] text-xs font-semibold transition-all hover:opacity-70"
              style={{ background: 'rgba(252,255,252,0.07)', color: 'rgba(252,255,252,0.6)' }}>
              Cancel
            </button>
            <button onClick={logout}
              className="flex-1 py-2.5 rounded-[8px] text-xs font-bold transition-all hover:opacity-85"
              style={{ background: '#D94840', color: '#FCFFFC' }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
