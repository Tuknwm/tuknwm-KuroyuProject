import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const CartContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getToken() {
  return localStorage.getItem('kuroyu_token') || sessionStorage.getItem('kuroyu_token');
}

function loadLocal() {
  try { return JSON.parse(localStorage.getItem('kuroyu_cart')) || []; }
  catch { return []; }
}

function saveLocal(items) {
  try { localStorage.setItem('kuroyu_cart', JSON.stringify(items)); } catch {}
}

function makeKey(productId, size, color) {
  return `${productId}-${size || 'one-size'}-${color || ''}`;
}

function fromDB(dbItems) {
  return dbItems.map(i => ({
    key: makeKey(i.product._id, i.size, i.color),
    product: i.product,
    size: i.size,
    color: i.color,
    qty: i.qty,
  }));
}

function toDBPayload(items) {
  return items.map(i => ({
    product: i.product._id,
    qty: i.qty,
    size: i.size || null,
    color: i.color || null,
  }));
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadLocal);
  const syncTimer = useRef(null);
  const dbLoaded = useRef(false); 

  function loadFromDB() {
    const token = getToken();
    if (!token) { dbLoaded.current = true; return; }
    fetch(`${API_URL}/api/cart`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (!data.success) return;
        const dbItems = fromDB(data.data);
        setItems(prev => {
          const merged = [...dbItems];
          prev.forEach(local => {
            if (!merged.find(d => d.key === local.key)) merged.push(local);
          });
          return merged;
        });
      })
      .catch(() => {})
      .finally(() => { dbLoaded.current = true; });
  }

  useEffect(() => { loadFromDB(); }, []);

  useEffect(() => {
    const handler = () => {
      if (!getToken()) return;
      dbLoaded.current = false;
      loadFromDB();
    };
    window.addEventListener('storage', handler);
    window.addEventListener('kuroyu:login', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('kuroyu:login', handler);
    };
  }, []);

  useEffect(() => {
    saveLocal(items);
    if (!dbLoaded.current) return;
    const token = getToken();
    if (!token) return;
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      fetch(`${API_URL}/api/cart`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: toDBPayload(items) }),
      }).then(r => {
        if (r.status === 401) {
          localStorage.removeItem('kuroyu_token'); localStorage.removeItem('kuroyu_user');
          sessionStorage.removeItem('kuroyu_token'); sessionStorage.removeItem('kuroyu_user');
        }
      }).catch(() => {});
    }, 600);
  }, [items]);

  function addItem(product, { size, color, qty = 1 }) {
    const key = makeKey(product._id, size, color);
    setItems(prev => {
      const existing = prev.find(i => i.key === key);
      if (existing) return prev.map(i => i.key === key ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { key, product, size, color, qty }];
    });
  }

  function removeItem(key) { setItems(prev => prev.filter(i => i.key !== key)); }

  function updateQty(key, qty) {
    if (qty < 1) return removeItem(key);
    setItems(prev => prev.map(i => i.key === key ? { ...i, qty } : i));
  }

  function clearCart() { setItems([]); }

  const totalCount = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totalCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() { return useContext(CartContext); }
