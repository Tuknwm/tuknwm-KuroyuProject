import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  User, MapPin, Bell, ShieldCheck, CreditCard,
  Package, HelpCircle, LogOut, ChevronRight, ArrowLeft,
  Save, Eye, EyeOff, Navigation, Sparkles, Shield,
  UserCheck, UserX, Crown, Ban, SlidersHorizontal, X,
  Truck, CheckCircle, Clock, Plus, Trash2, Pencil,
} from 'lucide-react';
import { imgUrl } from '../../utils';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

if (typeof document !== 'undefined' && !document.getElementById('settings-scrollbar-style')) {
  const el = document.createElement('style');
  el.id = 'settings-scrollbar-style';
  el.textContent = `
    .kuroyu-scroll::-webkit-scrollbar { width: 4px; }
    .kuroyu-scroll::-webkit-scrollbar-track { background: transparent; }
    .kuroyu-scroll::-webkit-scrollbar-thumb { background: rgba(252,255,252,0.12); border-radius: 99px; }
    .kuroyu-scroll::-webkit-scrollbar-thumb:hover { background: rgba(252,255,252,0.25); }
    .kuroyu-scroll { scrollbar-width: thin; scrollbar-color: rgba(252,255,252,0.12) transparent; }
  `;
  document.head.appendChild(el);
}

const NAV = [
  { id: 'account',       icon: User,        label: 'Edit Account' },
  { id: 'address',       icon: MapPin,       label: 'Saved Addresses' },
  { id: 'orders',        icon: Package,      label: 'Order History' },
  { id: 'payment',       icon: CreditCard,   label: 'Payment Methods' },
  { id: 'help',          icon: HelpCircle,   label: 'Help Center' },
];

const s = {
  input: {
    width: '100%', borderRadius: 8, padding: '0.625rem 0.875rem',
    fontSize: '0.875rem', background: '#1E1E1E',
    border: '1px solid rgba(252,255,252,0.1)', color: '#FCFFFC', outline: 'none',
  },
  label: { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(252,255,252,0.5)', marginBottom: 6 },
  divider: { borderTop: '1px solid rgba(252,255,252,0.06)', margin: '1.25rem 0' },
};

function MapFlyTo({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo([pos.lat, pos.lng], 16, { duration: 1 });
  }, [pos, map]);
  return null;
}

function MapClickHandler({ onPick }) {
  useMapEvents({
    click(e) { onPick(e.latlng); },
  });
  return null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => sessionStorage.getItem('kuroyu_token') || localStorage.getItem('kuroyu_token');
const authHeader = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` });
const currency2 = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

function orderLiveStatus(order) {
  if (order.cancelled) return 'cancelled';
  const now = Date.now();
  if (order.deliveredAt && now >= new Date(order.deliveredAt).getTime()) return 'delivered';
  if (order.shippedAt   && now >= new Date(order.shippedAt).getTime())   return 'shipped';
  return 'packed';
}

function AddressPanel() {
  const empty = { label: '', name: '', phone: '', street: '', city: '', province: '', zip: '' };
  const [form, setForm] = useState(empty);
  const [addresses, setAddresses] = useState([]);
  const [saved, setSaved] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); 
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [markerPos, setMarkerPos] = useState(null);
  const [mapCenter] = useState([-6.2, 106.816]);
  const debounceRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL}/api/user/addresses`, { headers: authHeader() })
      .then(r => r.json()).then(d => { if (d.success) setAddresses(d.addresses); })
      .catch(() => {});
  }, []);

  const handleMapPick = useCallback(async (latlng) => {
    setMarkerPos(latlng);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const a = data.address || {};
      setForm(prev => ({
        ...prev,
        street: [a.road, a.house_number].filter(Boolean).join(' ') || a.neighbourhood || '',
        city: a.city || a.town || a.village || a.county || '',
        province: a.state || a.region || '',
        zip: a.postcode || '',
      }));
    } catch {  }
  }, []);

  function handleStreetChange(e) {
    const val = e.target.value;
    setForm(p => ({ ...p, street: val }));
    clearTimeout(debounceRef.current);
    if (val.length < 5) return;
    debounceRef.current = setTimeout(async () => {
      try {
        const query = [val, form.city, form.province, 'Indonesia'].filter(Boolean).join(', ');
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=1`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const [result] = await res.json();
        if (!result) return;
        const latlng = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
        const a = result.address || {};
        setMarkerPos(latlng);
        setForm(prev => ({
          ...prev,
          city: prev.city || a.city || a.town || a.village || '',
          province: prev.province || a.state || '',
          zip: prev.zip || a.postcode || '',
        }));
      } catch {  }
    }, 800);
  }

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  function openAdd() {
    setEditingId(null);
    setForm(empty);
    setMarkerPos(null);
    setShowForm(true);
  }

  function openEdit(a) {
    setEditingId(a._id);
    setForm({ label: a.label || '', name: a.name || '', phone: a.phone || '', street: a.street || '', city: a.city || '', province: a.province || '', zip: a.zip || '' });
    setMarkerPos(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(empty);
    setMarkerPos(null);
  }

  async function save(e) {
    e.preventDefault();
    try {
      let data;
      if (editingId) {
        await fetch(`${API_URL}/api/user/addresses/${editingId}`, { method: 'DELETE', headers: authHeader() });
        const res = await fetch(`${API_URL}/api/user/addresses`, {
          method: 'POST', headers: authHeader(), body: JSON.stringify(form),
        });
        data = await res.json();
      } else {
        const res = await fetch(`${API_URL}/api/user/addresses`, {
          method: 'POST', headers: authHeader(), body: JSON.stringify(form),
        });
        data = await res.json();
      }
      if (data.success) setAddresses(data.addresses);
    } catch {  }
    cancelForm();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function removeAddress(id) {
    try {
      const res = await fetch(`${API_URL}/api/user/addresses/${id}`, { method: 'DELETE', headers: authHeader() });
      const data = await res.json();
      if (data.success) setAddresses(data.addresses);
    } catch {  }
    setConfirmDeleteId(null);
  }

  const f = (key) => ({
    value: form[key],
    onChange: e => setForm(p => ({ ...p, [key]: e.target.value })),
    style: s.input,
  });

  return (
    <div>
      <h2 className="text-base font-bold mb-1" style={{ color: '#FCFFFC' }}>Saved Addresses</h2>
      <p className="text-xs mb-5" style={{ color: 'rgba(252,255,252,0.4)' }}>
        Manage your shipping addresses.
      </p>

      
      {addresses.length === 0 && !showForm && (
        <p className="text-sm py-6 text-center" style={{ color: 'rgba(252,255,252,0.25)' }}>No saved addresses yet.</p>
      )}

      {addresses.length > 0 && (
        <div className="mb-6">
          {addresses.map(a => (
            <div key={a._id} className="flex items-start justify-between py-3"
              style={{ borderBottom: '1px solid rgba(252,255,252,0.06)' }}>
              <div className="flex-1 min-w-0 pr-4">
                <div className="text-sm font-semibold" style={{ color: '#FCFFFC' }}>{a.label || 'Address'}</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(252,255,252,0.45)' }}>
                  {[a.name, a.phone].filter(Boolean).join(' · ')}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(252,255,252,0.35)' }}>
                  {[a.street, a.city, a.province, a.zip].filter(Boolean).join(', ')}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button type="button" onClick={() => openEdit(a)}
                  className="text-xs hover:opacity-70 transition-opacity"
                  style={{ color: 'rgba(252,255,252,0.5)' }}>
                  Edit
                </button>
                {confirmDeleteId === a._id ? (
                  <div className="flex items-center gap-1.5 text-xs">
                    <span style={{ color: 'rgba(252,255,252,0.4)' }}>Sure?</span>
                    <button type="button" onClick={() => removeAddress(a._id)}
                      className="font-bold hover:opacity-70 transition-opacity" style={{ color: '#D94840' }}>Yes</button>
                    <span style={{ color: 'rgba(252,255,252,0.2)' }}>/</span>
                    <button type="button" onClick={() => setConfirmDeleteId(null)}
                      className="font-bold hover:opacity-70 transition-opacity" style={{ color: 'rgba(252,255,252,0.4)' }}>No</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setConfirmDeleteId(a._id)}
                    className="text-xs hover:opacity-70 transition-opacity"
                    style={{ color: '#D94840' }}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {saved && <p className="text-xs mb-4" style={{ color: '#10b981' }}>Address saved!</p>}

      
      {showForm ? (
        <form onSubmit={save}>
          <p className="text-xs font-semibold mb-4" style={{ color: 'rgba(252,255,252,0.5)' }}>
            {editingId ? 'Edit address' : 'New address'}
          </p>

          <div className="mb-5 overflow-hidden" style={{ borderRadius: 10, height: 260, filter: 'invert(1) hue-rotate(180deg) brightness(0.85) contrast(1.1)' }}>
            <MapContainer center={mapCenter} zoom={12} style={{ height: '100%', width: '100%' }} attributionControl={false}>
              <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapClickHandler onPick={handleMapPick} />
              <MapFlyTo pos={markerPos} />
              {markerPos && <Marker position={markerPos} />}
            </MapContainer>
          </div>

          <p className="flex items-center gap-1.5 text-[11px] mb-4" style={{ color: 'rgba(252,255,252,0.3)' }}>
            <Navigation className="w-3 h-3" />
            Tap the map to auto-fill street, city, province, and ZIP.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'label',    label: 'Address Label',  placeholder: 'Home, Office...' },
              { key: 'name',     label: 'Recipient Name', placeholder: 'Full name' },
              { key: 'phone',    label: 'Phone Number',   placeholder: '+62...' },
              { key: 'street',   label: 'Street Address', placeholder: 'Jl. Example No. 1' },
              { key: 'city',     label: 'City',           placeholder: 'Jakarta' },
              { key: 'province', label: 'Province',       placeholder: 'DKI Jakarta' },
              { key: 'zip',      label: 'ZIP Code',       placeholder: '10110' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className={key === 'street' ? 'sm:col-span-2' : ''}>
                <label style={s.label}>{label}</label>
                <input
                  {...f(key)}
                  placeholder={placeholder}
                  {...(key === 'street' ? { onChange: handleStreetChange } : {})}
                />
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-sm font-semibold transition-all hover:opacity-85"
              style={{ background: '#FCFFFC', color: '#262626' }}>
              <MapPin className="w-4 h-4" />
              {editingId ? 'Update Address' : 'Save Address'}
            </button>
            <button type="button" onClick={cancelForm}
              className="px-4 py-2.5 rounded-[8px] text-sm font-semibold transition-all hover:opacity-70"
              style={{ color: 'rgba(252,255,252,0.45)' }}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={openAdd}
          className="flex items-center gap-2 text-xs font-semibold transition-opacity hover:opacity-70 mt-2"
          style={{ color: 'rgba(252,255,252,0.5)' }}>
          <span className="w-5 h-5 rounded-full flex items-center justify-center text-sm"
            style={{ border: '1px solid rgba(252,255,252,0.2)' }}>+</span>
          Add new address
        </button>
      )}
    </div>
  );
}

function AccountPanel({ user }) {
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [profileSaved, setProfileSaved] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');

  const profileChanged = name !== (user?.name ?? '') || email !== (user?.email ?? '');
  const pwdFilled = current.length > 0 && next.length > 0 && confirm.length > 0;

  async function saveProfile(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT', headers: authHeader(), body: JSON.stringify({ name, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const updated = JSON.stringify(data.user);
      if (localStorage.getItem('kuroyu_user')) localStorage.setItem('kuroyu_user', updated);
      if (sessionStorage.getItem('kuroyu_user')) sessionStorage.setItem('kuroyu_user', updated);
    } catch {
      const updated = JSON.stringify({ ...user, name, email });
      if (localStorage.getItem('kuroyu_user')) localStorage.setItem('kuroyu_user', updated);
      if (sessionStorage.getItem('kuroyu_user')) sessionStorage.setItem('kuroyu_user', updated);
    }
    window.location.reload();
  }

  async function savePassword(e) {
    e.preventDefault();
    if (next.length < 8) { setPwdMsg('New password must be at least 8 characters.'); return; }
    if (next !== confirm) { setPwdMsg('Passwords do not match.'); return; }
    try {
      const res = await fetch(`${API_URL}/api/user/password`, {
        method: 'PUT', headers: authHeader(), body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) { setPwdMsg(data.message); return; }
    } catch {  }
    setPwdMsg('Password changed successfully!');
    setCurrent(''); setNext(''); setConfirm('');
  }

  const pwdInput = (val, setter, placeholder) => (
    <div className="relative">
      <input type={show ? 'text' : 'password'} value={val}
        onChange={e => setter(e.target.value)} style={s.input} placeholder={placeholder} />
      <button type="button" onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2"
        style={{ color: 'rgba(252,255,252,0.3)' }}>
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <div>
      
      <form onSubmit={saveProfile}>
        <h2 className="text-base font-bold mb-1" style={{ color: '#FCFFFC' }}>Edit Account</h2>
        <p className="text-xs mb-5" style={{ color: 'rgba(252,255,252,0.4)' }}>Update your display name and email address.</p>
        <div style={s.divider} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label style={s.label}>Display Name</label>
            <input value={name} onChange={e => setName(e.target.value)} style={s.input} placeholder="Your name" />
          </div>
          <div>
            <label style={s.label}>Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={s.input} placeholder="you@example.com" />
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button type="submit" disabled={!profileChanged}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-sm font-semibold transition-all hover:opacity-85 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: '#FCFFFC', color: '#262626' }}>
            <Save className="w-4 h-4" />
            Save Changes
          </button>
          {profileChanged && (
            <button type="button" onClick={() => { setName(user?.name ?? ''); setEmail(user?.email ?? ''); }}
              className="px-4 py-2.5 rounded-[8px] text-sm font-semibold transition-all hover:opacity-70"
              style={{ color: 'rgba(252,255,252,0.45)' }}>
              Cancel
            </button>
          )}
          {profileSaved && <span className="text-xs" style={{ color: '#10b981' }}>Saved!</span>}
        </div>
      </form>

      
      <form onSubmit={savePassword} className="mt-8">
        <h3 className="text-sm font-bold mb-1" style={{ color: '#FCFFFC' }}>Password & Security</h3>
        <p className="text-xs mb-5" style={{ color: 'rgba(252,255,252,0.4)' }}>Change your account password.</p>
        <div style={s.divider} />
        <div className="space-y-4 max-w-sm">
          <div><label style={s.label}>Current Password</label>{pwdInput(current, setCurrent, '••••••••')}</div>
          <div><label style={s.label}>New Password</label>{pwdInput(next, setNext, 'Min. 8 characters')}</div>
          <div><label style={s.label}>Confirm New Password</label>{pwdInput(confirm, setConfirm, 'Repeat new password')}</div>
        </div>
        {pwdMsg && (
          <p className="text-xs mt-3 px-3 py-2 rounded-[6px]"
            style={pwdMsg.includes('success')
              ? { color: '#10b981', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }
              : { color: '#D94840', background: 'rgba(217,72,64,0.08)', border: '1px solid rgba(217,72,64,0.2)' }}>
            {pwdMsg}
          </p>
        )}
        <div className="mt-5 flex items-center gap-3">
          <button type="submit" disabled={!pwdFilled}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[8px] text-sm font-semibold transition-all hover:opacity-85 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: '#FCFFFC', color: '#262626' }}>
            <ShieldCheck className="w-4 h-4" />
            Update Password
          </button>
          {pwdFilled && (
            <button type="button" onClick={() => { setCurrent(''); setNext(''); setConfirm(''); setPwdMsg(''); }}
              className="px-4 py-2.5 rounded-[8px] text-sm font-semibold transition-all hover:opacity-70"
              style={{ color: 'rgba(252,255,252,0.45)' }}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

const API_URL_PROD  = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function AddProductPanel() {
  const [photos, setPhotos]     = useState([]);
  const [title, setTitle]       = useState('');
  const [price, setPrice]       = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [stock, setStock]       = useState('');
  const [colorsOn, setColorsOn] = useState(true);
  const [colors, setColors]     = useState([]);
  const [colorInput, setColorInput] = useState('');
  const [sizesOn, setSizesOn]   = useState(true);
  const [sizes, setSizes]       = useState([]);
  const [sizeInput, setSizeInput]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [added, setAdded]       = useState(false);
  const [addErr, setAddErr]     = useState(null);
  const addedTimer = useRef(null);
  const [categories, setCategories] = useState([]);
  const [catDropOpen, setCatDropOpen] = useState(false);
  const [newCatInput, setNewCatInput] = useState('');
  const [addingCat, setAddingCat]     = useState(false);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState(null);
  const fileRef = useRef(null);
  const catRef  = useRef(null);
  const descRef = useRef(null);

  useEffect(() => {
    fetch(`${API_URL_PROD}/api/categories`)
      .then(r => r.json())
      .then(d => { if (d.success) setCategories(d.data.map(c => ({ _id: c._id, name: c.name }))); });
  }, []);

  useEffect(() => {
    function handle(e) { if (catRef.current && !catRef.current.contains(e.target)) setCatDropOpen(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  async function addCategory() {
    const name = newCatInput.trim();
    if (!name) return;
    setAddingCat(true);
    try {
      const token = localStorage.getItem('kuroyu_token') || sessionStorage.getItem('kuroyu_token');
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      const res = await fetch(`${API_URL_PROD}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name, slug }),
      }).then(r => r.json());
      if (res.success) {
        setCategories(prev => [...prev, { _id: res.data._id, name: res.data.name }].sort((a, b) => a.name.localeCompare(b.name)));
        setCategory(res.data.name);
        setNewCatInput('');
      }
    } catch {  }
    setAddingCat(false);
  }

  function showErr(msg) {
    clearTimeout(addedTimer.current);
    setAddErr(msg);
    addedTimer.current = setTimeout(() => setAddErr(null), 2500);
  }

  function addPhoto(files) {
    const remaining = 5 - photos.length;
    const all = Array.from(files).filter(f => f.type.startsWith('image/'));
    const tooBig = all.filter(f => f.size > 5 * 1024 * 1024);
    if (tooBig.length) { showErr('too-large'); return; }
    const picked = all.slice(0, remaining);
    setPhotos(prev => [...prev, ...picked.map(file => ({ file, preview: URL.createObjectURL(file) }))]);
  }

  function removePhoto(i) {
    setPhotos(prev => { URL.revokeObjectURL(prev[i].preview); return prev.filter((_, idx) => idx !== i); });
  }

  function addTag(setList, input, setInput) {
    const v = input.trim();
    if (!v) return;
    setList(prev => prev.includes(v) ? prev : [...prev, v]);
    setInput('');
  }

  async function submit(e) {
    e.preventDefault();
    if (!title.trim() || !price) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('kuroyu_token') || sessionStorage.getItem('kuroyu_token');
      const fd = new FormData();
      photos.forEach(p => fd.append('images', p.file));
      fd.append('title', title.trim());
      fd.append('price', price);
      fd.append('category', category.trim() || 'General');
      fd.append('stock', stock || '0');
      fd.append('colors', JSON.stringify(colorsOn ? colors : []));
      fd.append('sizes',  JSON.stringify(sizesOn  ? sizes  : []));
      fd.append('description', descRef.current?.innerHTML || description);
      const res = await fetch(`${API_URL_PROD}/api/admin/products`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      }).then(r => r.json());
      if (res.success) {
        setPhotos([]); setTitle(''); setPrice(''); setCategory(''); setDescription(''); setStock('');
        if (descRef.current) descRef.current.innerHTML = '';
        setColors([]); setSizes([]);
        clearTimeout(addedTimer.current);
        setAdded(true);
        addedTimer.current = setTimeout(() => setAdded(false), 2500);
      } else {
        const isSize = /size|large|too big|limit/i.test(res.message || '');
        showErr(isSize ? 'too-large' : 'error');
      }
    } catch { showErr('error'); }
    setSaving(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-base font-bold" style={{ color: '#FCFFFC' }}>Add Product</h2>
          </div>
          <p className="text-xs" style={{ color: 'rgba(252,255,252,0.4)' }}>New product will appear on the homepage.</p>
        </div>
        <AddProductBtn saving={saving} disabled={!title.trim() || !price || !category} added={added} addErr={addErr} />
      </div>
      <div style={s.divider} />

      <form id="add-product-form" onSubmit={submit} className="space-y-5">

        
        <div>
          <label style={s.label}>Photos <span style={{ color: 'rgba(252,255,252,0.3)' }}>({photos.length}/5)</span></label>
          <div className="flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative w-20 h-20 rounded-[8px] overflow-hidden" style={{ border: '1px solid rgba(252,255,252,0.1)' }}>
                <img src={p.preview} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removePhoto(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(0,0,0,0.7)' }}>
                  <X size={10} style={{ color: '#FCFFFC' }} />
                </button>
              </div>
            ))}
            {photos.length < 5 && (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-20 h-20 rounded-[8px] flex flex-col items-center justify-center gap-1 transition-all hover:opacity-70"
                style={{ border: '1.5px dashed rgba(252,255,252,0.15)', background: 'rgba(252,255,252,0.03)' }}>
                <span style={{ fontSize: 22, color: 'rgba(252,255,252,0.25)', lineHeight: 1 }}>+</span>
                <span style={{ fontSize: 9, color: 'rgba(252,255,252,0.3)' }}>Add photo</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
            onChange={e => { addPhoto(e.target.files); e.target.value = ''; }} />
        </div>

        
        <div className="flex gap-3">
          <div className="flex-1">
            <label style={s.label}>Product Name</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Oversized Hoodie Black"
              style={s.input} />
          </div>
          <div className="flex-1">
            <label style={s.label}>Category</label>
            <div ref={catRef} className="relative">
              <button type="button" onClick={() => setCatDropOpen(o => !o)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[8px] text-sm transition-all"
                style={{ ...s.input, textAlign: 'left', cursor: 'pointer' }}>
                <span style={{ color: category ? '#FCFFFC' : 'rgba(252,255,252,0.3)' }}>{category || 'Select…'}</span>
                <ChevronRight size={14} style={{ color: 'rgba(252,255,252,0.3)', transform: catDropOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>
              {catDropOpen && (
                <div className="absolute left-0 right-0 mt-1 rounded-[10px] overflow-hidden z-20"
                  style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                  {categories.length === 0 && (
                    <div className="px-3 py-3 text-xs" style={{ color: 'rgba(252,255,252,0.3)' }}>No categories yet.</div>
                  )}
                  {categories.map(cat => (
                    <div key={cat._id} className="flex items-center group"
                      style={{ background: category === cat.name ? 'rgba(252,255,252,0.06)' : 'transparent' }}>
                      <button type="button" onClick={() => { setCategory(cat.name); setCatDropOpen(false); }}
                        className="flex-1 text-left px-3 py-2.5 text-sm transition-all hover:bg-white/5"
                        style={{ color: category === cat.name ? '#FCFFFC' : 'rgba(252,255,252,0.6)' }}>
                        {cat.name}
                      </button>
                      <button type="button"
                        onClick={async () => {
                          if (confirmDeleteCat !== cat._id) {
                            setConfirmDeleteCat(cat._id);
                            return;
                          }
                          const token = localStorage.getItem('kuroyu_token') || sessionStorage.getItem('kuroyu_token');
                          await fetch(`${API_URL_PROD}/api/categories/${cat._id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                          setCategories(p => p.filter(x => x._id !== cat._id));
                          if (category === cat.name) setCategory('');
                          setConfirmDeleteCat(null);
                        }}
                        onMouseLeave={() => { if (confirmDeleteCat === cat._id) setConfirmDeleteCat(null); }}
                        className="px-2 py-1.5 text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: confirmDeleteCat === cat._id ? '#FCFFFC' : '#D94840', background: confirmDeleteCat === cat._id ? '#D94840' : 'transparent', border: 'none', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'background 0.15s, color 0.15s' }}>
                        {confirmDeleteCat === cat._id ? 'Are you sure?' : 'Delete'}
                      </button>
                    </div>
                  ))}
                  <div className="px-3 py-2.5" style={{ borderTop: '1px solid rgba(252,255,252,0.07)' }}>
                    <div className="flex gap-2">
                      <input value={newCatInput} onChange={e => setNewCatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCategory())}
                        placeholder="New category…"
                        style={{ ...s.input, fontSize: '0.75rem', padding: '0.4rem 0.6rem', flex: 1 }} />
                      <button type="button" onClick={addCategory} disabled={addingCat || !newCatInput.trim()}
                        className="px-3 rounded-[6px] text-xs font-semibold transition-all hover:opacity-80 disabled:opacity-30"
                        style={{ background: 'rgba(252,255,252,0.1)', color: '#FCFFFC', whiteSpace: 'nowrap' }}>
                        {addingCat ? '…' : '+ Add'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        
        <div>
          <label style={s.label}>Description</label>
          <div className="rounded-[8px] overflow-hidden" style={{ border: '1px solid rgba(252,255,252,0.1)', background: '#1E1E1E' }}>
            
            <div className="flex items-center gap-1 px-2 py-1.5" style={{ borderBottom: '1px solid rgba(252,255,252,0.07)' }}>
              {[['bold','B','font-bold'],['italic','I','italic']].map(([cmd, lbl, cls]) => (
                <button key={cmd} type="button" onMouseDown={e => { e.preventDefault(); document.execCommand(cmd); }}
                  className={`w-6 h-6 rounded-[4px] text-xs flex items-center justify-center transition-all hover:bg-white/10 ${cls}`}
                  style={{ color: 'rgba(252,255,252,0.6)' }}>
                  {lbl}
                </button>
              ))}
            </div>
            <div ref={descRef} contentEditable suppressContentEditableWarning
              onInput={e => setDescription(e.currentTarget.innerHTML)}
              data-placeholder="Describe the product…"
              className="px-3 py-2.5 text-sm outline-none min-h-[72px]"
              style={{ color: '#FCFFFC', lineHeight: 1.6 }}
            />
          </div>
        </div>

        
        <div className="flex gap-3">
          <div className="flex-1">
            <label style={s.label}>Price (IDR)</label>
            <input type="text" inputMode="numeric" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 249000"
              style={{ ...s.input, MozAppearance: 'textfield' }} className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
          </div>
          <div className="flex-1">
            <label style={s.label}>Stock (qty)</label>
            <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} placeholder="e.g. 50"
              style={{ ...s.input, MozAppearance: 'textfield' }} className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
          </div>
        </div>

        
        <div className="flex gap-4">

          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span style={s.label}>Colors</span>
              <button type="button" onClick={() => setColorsOn(v => !v)}
                style={{ width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer', flexShrink: 0, position: 'relative', transition: 'background 0.2s', background: colorsOn ? '#FCFFFC' : 'rgba(252,255,252,0.12)', padding: 0 }}>
                <span style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', transition: 'left 0.2s', background: colorsOn ? '#262626' : 'rgba(252,255,252,0.5)', left: colorsOn ? 23 : 3 }} />
              </button>
            </div>
            {colorsOn && (
              <>
                {colors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {colors.map(c => (
                      <span key={c} className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{ background: 'rgba(252,255,252,0.1)', color: '#FCFFFC', border: '1px solid rgba(252,255,252,0.15)' }}>
                        {c}
                        <button type="button" onClick={() => setColors(p => p.filter(x => x !== c))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 1px', color: 'rgba(252,255,252,0.4)' }}>
                          <X size={8} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input value={colorInput} onChange={e => setColorInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(setColors, colorInput, setColorInput))}
                    placeholder="e.g. Black, Red…" style={{ ...s.input, flex: 1 }} />
                  <button type="button" onClick={() => addTag(setColors, colorInput, setColorInput)}
                    className="px-3 rounded-[8px] text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: 'rgba(252,255,252,0.08)', color: '#FCFFFC', border: '1px solid rgba(252,255,252,0.1)' }}>
                    Add
                  </button>
                </div>
              </>
            )}
          </div>

          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1.5">
              <span style={s.label}>Sizes</span>
              <button type="button" onClick={() => setSizesOn(v => !v)}
                style={{ width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer', flexShrink: 0, position: 'relative', transition: 'background 0.2s', background: sizesOn ? '#FCFFFC' : 'rgba(252,255,252,0.12)', padding: 0 }}>
                <span style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', transition: 'left 0.2s', background: sizesOn ? '#262626' : 'rgba(252,255,252,0.5)', left: sizesOn ? 23 : 3 }} />
              </button>
            </div>
            {sizesOn && (
              <>
                {sizes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {sizes.map(sz => (
                      <span key={sz} className="flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{ background: 'rgba(252,255,252,0.1)', color: '#FCFFFC', border: '1px solid rgba(252,255,252,0.15)' }}>
                        {sz}
                        <button type="button" onClick={() => setSizes(p => p.filter(x => x !== sz))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 1px', color: 'rgba(252,255,252,0.4)' }}>
                          <X size={8} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input value={sizeInput} onChange={e => setSizeInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(setSizes, sizeInput, setSizeInput))}
                    placeholder="e.g. M, XL, 42…" style={{ ...s.input, flex: 1 }} />
                  <button type="button" onClick={() => addTag(setSizes, sizeInput, setSizeInput)}
                    className="px-3 rounded-[8px] text-xs font-semibold transition-all hover:opacity-80"
                    style={{ background: 'rgba(252,255,252,0.08)', color: '#FCFFFC', border: '1px solid rgba(252,255,252,0.1)' }}>
                    Add
                  </button>
                </div>
              </>
            )}
          </div>

        </div>

      </form>

      
      <div style={s.divider} />
      <p className="text-[11px] font-semibold uppercase tracking-widest mb-4" style={{ color: 'rgba(252,255,252,0.25)' }}>Preview</p>

      <div className="flex gap-6 items-start">

        
        <div className="flex-1 min-w-0">
          <p className="text-[10px] mb-2 font-medium" style={{ color: 'rgba(252,255,252,0.3)' }}>Home card</p>
          <div className="rounded-[10px] overflow-hidden p-3 flex flex-col gap-2" style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.07)', width: 150 }}>
            <div className="aspect-square rounded-[6px] overflow-hidden" style={{ background: '#2E2E2E' }}>
              {photos[0]
                ? <img src={photos[0].preview} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-[10px]" style={{ color: 'rgba(252,255,252,0.15)' }}>No image</div>
              }
            </div>
            <p className="text-[11px] font-semibold line-clamp-2 leading-tight" style={{ color: '#FCFFFC' }}>{title || 'Product name'}</p>
            <p className="text-xs font-bold" style={{ color: '#FCFFFC' }}>{price ? currency2.format(Number(price)) : 'Rp 0'}</p>
            <div className="flex items-center gap-1 text-[10px]" style={{ color: 'rgba(252,255,252,0.4)' }}>
              <span style={{ color: '#C8A96E' }}>★</span> 5.0 · 0 sold
            </div>
          </div>
        </div>

        
        <div style={{ flex: 2, minWidth: 0 }}>
          <p className="text-[10px] mb-2 font-medium" style={{ color: 'rgba(252,255,252,0.3)' }}>Detail page</p>
          
          <div style={{ width: '100%', aspectRatio: '4/5', position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(252,255,252,0.07)' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: 800, transformOrigin: 'top left', transform: `scale(${1})`, background: '#262626' }}
              ref={el => { if (el) { const w = el.parentElement.offsetWidth; el.style.transform = `scale(${w/800})`; el.parentElement.style.height = `${el.scrollHeight * w/800}px`; } }}>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, padding: '24px 32px' }}>

                
                <div style={{ aspectRatio: '1', borderRadius: 12, overflow: 'hidden', background: '#1E1E1E' }}>
                  {photos[0]
                    ? <img src={photos[0].preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(252,255,252,0.15)', fontSize: 13 }}>No image</div>
                  }
                </div>

                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {category && <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(252,255,252,0.35)' }}>{category}</span>}
                  <h1 style={{ fontSize: 26, fontWeight: 700, color: '#FCFFFC', lineHeight: 1.3, margin: 0 }}>{title || 'Product name'}</h1>

                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {[1,2,3,4,5].map(n => <span key={n} style={{ color: '#C8A96E', fontSize: 14 }}>★</span>)}
                    <span style={{ fontSize: 12, color: '#C8A96E', fontWeight: 600 }}>5.0</span>
                    <span style={{ fontSize: 12, color: 'rgba(252,255,252,0.35)' }}>|</span>
                    <span style={{ fontSize: 12, color: 'rgba(252,255,252,0.5)' }}>0 sold</span>
                  </div>

                  
                  <div style={{ padding: '14px 0', borderTop: '1px solid rgba(252,255,252,0.07)', borderBottom: '1px solid rgba(252,255,252,0.07)' }}>
                    <span style={{ fontSize: 28, fontWeight: 700, color: '#FCFFFC' }}>{price ? currency2.format(Number(price)) : 'Rp 0'}</span>
                  </div>

                  
                  {colorsOn && colors.length > 0 && (
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(252,255,252,0.6)', marginBottom: 8 }}>Color</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {colors.map((c, i) => (
                          <span key={c} style={{ padding: '5px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                            background: i === 0 ? '#FCFFFC' : '#1E1E1E', color: i === 0 ? '#262626' : 'rgba(252,255,252,0.6)',
                            border: i === 0 ? 'none' : '1px solid rgba(252,255,252,0.12)' }}>{c}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  
                  {sizesOn && sizes.length > 0 && (
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(252,255,252,0.6)', marginBottom: 8 }}>Size</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {sizes.map((sz, i) => (
                          <span key={sz} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, minWidth: 40, textAlign: 'center',
                            background: i === 0 ? '#FCFFFC' : '#1E1E1E', color: i === 0 ? '#262626' : 'rgba(252,255,252,0.6)',
                            border: i === 0 ? 'none' : '1px solid rgba(252,255,252,0.12)' }}>{sz}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  
                  <div>
                    <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(252,255,252,0.6)', marginBottom: 8 }}>Quantity</p>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid rgba(252,255,252,0.12)', borderRadius: 8, overflow: 'hidden', width: 'fit-content' }}>
                      <span style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FCFFFC', fontSize: 18 }}>−</span>
                      <span style={{ width: 48, textAlign: 'center', fontSize: 14, fontWeight: 600, color: '#FCFFFC', borderLeft: '1px solid rgba(252,255,252,0.08)', borderRight: '1px solid rgba(252,255,252,0.08)' }}>1</span>
                      <span style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FCFFFC', fontSize: 18 }}>+</span>
                    </div>
                    <p style={{ fontSize: 11, marginTop: 6, color: 'rgba(252,255,252,0.35)' }}>{stock || 0} units available</p>
                  </div>

                  
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1, padding: '14px 0', borderRadius: 10, background: '#FCFFFC', color: '#262626', textAlign: 'center', fontSize: 14, fontWeight: 700 }}>Add to Cart</div>
                    <div style={{ flex: 1, padding: '14px 0', borderRadius: 10, background: '#D94840', color: '#FCFFFC', textAlign: 'center', fontSize: 14, fontWeight: 700 }}>Buy Now</div>
                  </div>

                  
                  <div style={{ padding: '12px 0', borderRadius: 10, border: '1px solid rgba(252,255,252,0.12)', color: 'rgba(252,255,252,0.75)', textAlign: 'center', fontSize: 14, fontWeight: 600 }}>
                    Chat Seller
                  </div>
                </div>
              </div>

              
              <div style={{ padding: '0 32px 32px', borderTop: '1px solid rgba(252,255,252,0.07)', marginTop: 8, paddingTop: 24 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#FCFFFC', marginBottom: 10 }}>Description</p>
                {description
                  ? <div style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(252,255,252,0.55)', maxWidth: 600 }} dangerouslySetInnerHTML={{ __html: description }} />
                  : <p style={{ fontSize: 13, color: 'rgba(252,255,252,0.2)' }}>No description available.</p>
                }
                <p style={{ fontSize: 15, fontWeight: 700, color: '#FCFFFC', marginTop: 32, marginBottom: 12 }}>Reviews <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: 'rgba(252,255,252,0.07)', color: 'rgba(252,255,252,0.4)' }}>0 reviews</span></p>
                <div style={{ padding: '40px 0', borderRadius: 12, background: 'rgba(252,255,252,0.02)', border: '1px solid rgba(252,255,252,0.06)', textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
                    {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: 18, color: 'rgba(252,255,252,0.15)' }}>★</span>)}
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(252,255,252,0.35)' }}>No reviews yet</p>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

const STATUS_STYLE = {
  delivered: { label: 'Delivered', color: '#34D399', bg: 'rgba(16,185,129,0.12)' },
  cancelled:  { label: 'Cancelled', color: '#D94840', bg: 'rgba(217,72,64,0.12)'  },
};

function OrderDetailPanel({ order }) {
  const st = orderLiveStatus(order);
  const { label, color, bg } = STATUS_STYLE[st] || STATUS_STYLE.delivered;

  const subtotal = order.items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = order.total - subtotal;

  const cancelLog = order.cancelled
    ? order.logs?.find(l => l.text?.startsWith('Order cancelled'))
    : null;

  return (
    <div className="rounded-[14px] overflow-hidden" style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.08)' }}>

      
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(252,255,252,0.07)' }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-bold" style={{ color: '#FCFFFC' }}>{order.trackingNumber}</span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: bg, color }}>{label}</span>
        </div>
        <p className="text-[11px]" style={{ color: 'rgba(252,255,252,0.35)' }}>
          {new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="px-5 py-4 space-y-4">

        
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[6px] overflow-hidden shrink-0" style={{ background: '#2E2E2E' }}>
                {item.image && <img src={imgUrl(item.image)} alt={item.title} className="w-full h-full object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: '#FCFFFC' }}>{item.title}</p>
                <p className="text-[10px]" style={{ color: 'rgba(252,255,252,0.4)' }}>
                  {item.qty}× · {currency2.format(item.price)}{item.size ? ` · ${item.size}` : ''}
                </p>
              </div>
              <p className="text-xs font-semibold shrink-0" style={{ color: '#FCFFFC' }}>{currency2.format(item.price * item.qty)}</p>
            </div>
          ))}
        </div>

        
        <div className="space-y-2 text-xs pt-1" style={{ borderTop: '1px solid rgba(252,255,252,0.07)' }}>
          <div className="flex justify-between">
            <span style={{ color: 'rgba(252,255,252,0.4)' }}>Subtotal</span>
            <span style={{ color: 'rgba(252,255,252,0.7)' }}>{currency2.format(subtotal)}</span>
          </div>
          {shipping > 0 && (
            <div className="flex justify-between">
              <span style={{ color: 'rgba(252,255,252,0.4)' }}>Shipping</span>
              <span style={{ color: 'rgba(252,255,252,0.7)' }}>{currency2.format(shipping)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold pt-1" style={{ borderTop: '1px solid rgba(252,255,252,0.07)' }}>
            <span style={{ color: '#FCFFFC' }}>Total</span>
            <span style={{ color: '#D94840' }}>{currency2.format(order.total)}</span>
          </div>
        </div>

        
        <div className="space-y-2.5 text-xs pt-1" style={{ borderTop: '1px solid rgba(252,255,252,0.07)' }}>
          {order.courier?.label && (
            <div className="flex justify-between gap-3">
              <span style={{ color: 'rgba(252,255,252,0.4)', flexShrink: 0 }}>Courier</span>
              <span className="text-right font-medium" style={{ color: 'rgba(252,255,252,0.75)' }}>{order.courier.label}</span>
            </div>
          )}
          {order.paymentMethod && (
            <div className="flex justify-between gap-3">
              <span style={{ color: 'rgba(252,255,252,0.4)', flexShrink: 0 }}>Payment</span>
              <span className="text-right font-medium uppercase" style={{ color: 'rgba(252,255,252,0.75)' }}>{order.paymentMethod}</span>
            </div>
          )}
          {order.shippingAddress?.name && (
            <div className="flex justify-between gap-3">
              <span style={{ color: 'rgba(252,255,252,0.4)', flexShrink: 0 }}>Ship to</span>
              <span className="text-right" style={{ color: 'rgba(252,255,252,0.7)' }}>
                {[order.shippingAddress.name, order.shippingAddress.street, order.shippingAddress.city, order.shippingAddress.province, order.shippingAddress.zip]
                  .filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          {order.shippingAddress?.phone && (
            <div className="flex justify-between gap-3">
              <span style={{ color: 'rgba(252,255,252,0.4)', flexShrink: 0 }}>Phone</span>
              <span style={{ color: 'rgba(252,255,252,0.7)' }}>{order.shippingAddress.phone}</span>
            </div>
          )}
          {order.note && (
            <div className="flex justify-between gap-3">
              <span style={{ color: 'rgba(252,255,252,0.4)', flexShrink: 0 }}>Note</span>
              <span className="text-right italic" style={{ color: 'rgba(252,255,252,0.5)' }}>"{order.note}"</span>
            </div>
          )}
          {cancelLog && (
            <div className="flex justify-between gap-3">
              <span style={{ color: 'rgba(252,255,252,0.4)', flexShrink: 0 }}>Cancel reason</span>
              <span className="text-right" style={{ color: 'rgba(217,72,64,0.8)' }}>
                {cancelLog.text.replace('Order cancelled by customer: ', '').replace('Order cancelled by customer.', 'No reason given')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function OrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/orders`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setOrders(d.orders);
          const hist = d.orders.filter(o => { const st = orderLiveStatus(o); return st === 'delivered' || st === 'cancelled'; });
          if (hist.length) setSelected(hist[0]);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const history = orders.filter(o => {
    const st = orderLiveStatus(o);
    if (st !== 'delivered' && st !== 'cancelled') return false;
    if (filter === 'all') return true;
    return st === filter;
  });

  const grouped = history.reduce((acc, o) => {
    const key = new Date(o.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    (acc[key] = acc[key] || []).push(o);
    return acc;
  }, {});

  return (
    <div>
      
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-bold" style={{ color: '#FCFFFC' }}>Order History</h2>
        <div className="flex items-center gap-1 p-0.5 rounded-[8px]" style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.07)' }}>
          {[['all','All'],['delivered','Delivered'],['cancelled','Cancelled']].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilter(val)}
              className="px-2.5 py-1 rounded-[6px] text-[10px] font-semibold transition-all"
              style={{ background: filter === val ? 'rgba(252,255,252,0.1)' : 'transparent', color: filter === val ? '#FCFFFC' : 'rgba(252,255,252,0.35)' }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs mb-5" style={{ color: 'rgba(252,255,252,0.4)' }}>Completed and cancelled orders.</p>
      <div style={s.divider} />

      <div className="flex gap-5 items-start">

      
      <div className="flex-1 min-w-0">

        {loading && (
          <div className="space-y-2">
            {[0,1,2].map(i => <div key={i} style={{ height: 60, borderRadius: 8, background: 'rgba(252,255,252,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
          </div>
        )}

        {!loading && history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-4 w-full">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#1E1E1E' }}>
              <Package className="w-7 h-7" style={{ color: 'rgba(252,255,252,0.2)' }} />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold mb-1" style={{ color: '#FCFFFC' }}>No history yet</p>
              <p className="text-xs" style={{ color: 'rgba(252,255,252,0.35)' }}>Delivered and cancelled orders will appear here.</p>
            </div>
          </div>
        )}

        <div className="space-y-5">
          {Object.entries(grouped).map(([month, monthOrders]) => (
            <div key={month}>
              <div className="flex items-center gap-3 mb-3">
                <div style={{ flex: 1, height: 1, background: 'rgba(252,255,252,0.07)' }} />
                <span className="text-[10px] font-semibold shrink-0" style={{ color: 'rgba(252,255,252,0.3)' }}>{month}</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(252,255,252,0.07)' }} />
              </div>
              <div className="space-y-2">
                {monthOrders.map(order => {
                  const st = orderLiveStatus(order);
                  const { label, color, bg } = STATUS_STYLE[st];
                  const isActive = selected?._id === order._id;
                  return (
                    <button key={order._id} onClick={() => setSelected(order)}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-[10px] text-left transition-all"
                      style={{ background: isActive ? 'rgba(252,255,252,0.07)' : '#1E1E1E', border: `1px solid ${isActive ? 'rgba(252,255,252,0.15)' : 'rgba(252,255,252,0.07)'}` }}>
                      <div className="w-9 h-9 rounded-[6px] overflow-hidden shrink-0" style={{ background: '#2E2E2E' }}>
                        {order.items[0]?.image && <img src={imgUrl(order.items[0].image)} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-bold truncate" style={{ color: '#FCFFFC' }}>{order.trackingNumber}</span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: bg, color }}>{label}</span>
                        </div>
                        <div className="text-[11px]" style={{ color: 'rgba(252,255,252,0.4)' }}>
                          {order.items.length} item{order.items.length > 1 ? 's' : ''} · {currency2.format(order.total)}
                        </div>
                      </div>
                      <ChevronRight size={13} style={{ color: isActive ? 'rgba(252,255,252,0.5)' : 'rgba(252,255,252,0.15)', flexShrink: 0 }} />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      
      {selected && (
        <div className="w-72 shrink-0" style={{ position: 'sticky', top: 0 }}>
          <OrderDetailPanel order={selected} />
        </div>
      )}
      </div>
    </div>
  );
}

const E_WALLETS = [
  { id: 'gopay',     label: 'GoPay',      color: '#00AED6', img: '/GoPay.svg' },
  { id: 'dana',      label: 'DANA',       color: '#118EEA', img: '/Dana.svg'  },
  { id: 'ovo',       label: 'OVO',        color: '#9B59B6', img: '/OVO.svg'   },
  { id: 'shopeepay', label: 'ShopeePay',  color: '#EE4D2D', img: '/Spay.png'  },
];

function PaymentPanel() {
  const [phones, setPhones] = useState({});
  const [modal, setModal] = useState(false);
  const [closing, setClosing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/user/wallets`, { headers: authHeader() })
      .then(r => r.json()).then(d => { if (d.success) setPhones(d.wallets); })
      .catch(() => {});
  }, []);

  function openModal() { setSelectedWallet(''); setPhone(''); setModal(true); setClosing(false); }
  function closeModal() {
    setClosing(true); setPickerOpen(false);
    setTimeout(() => { setModal(false); setClosing(false); }, 200);
  }

  async function saveWallet() {
    if (!selectedWallet || !phone.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/user/wallets`, {
        method: 'PUT', headers: authHeader(), body: JSON.stringify({ [selectedWallet]: phone.trim() }),
      });
      const data = await res.json();
      if (data.success) setPhones(data.wallets);
    } catch {  }
    setSaving(false);
    closeModal();
  }

  async function remove(id) {
    try {
      const res = await fetch(`${API_URL}/api/user/wallets`, {
        method: 'PUT', headers: authHeader(), body: JSON.stringify({ [id]: '' }),
      });
      const data = await res.json();
      if (data.success) setPhones(data.wallets);
    } catch { const n = { ...phones }; delete n[id]; setPhones(n); }
  }

  const linked = E_WALLETS.filter(w => phones[w.id]);
  const unlinked = E_WALLETS.filter(w => !phones[w.id]);
  const walletInfo = E_WALLETS.find(w => w.id === selectedWallet);

  return (
    <div>
      <style>{`
        @keyframes pay-in  { from{opacity:0;transform:scale(.92) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes pay-out { from{opacity:1;transform:scale(1) translateY(0)} to{opacity:0;transform:scale(.92) translateY(8px)} }
        @keyframes bd-in   { from{opacity:0} to{opacity:1} }
        @keyframes bd-out  { from{opacity:1} to{opacity:0} }
        [contenteditable][data-placeholder]:empty:before { content: attr(data-placeholder); color: rgba(252,255,252,0.25); pointer-events: none; }
      `}</style>

      <h2 className="text-base font-bold mb-1" style={{ color: '#FCFFFC' }}>Payment Methods</h2>
      <p className="text-xs mb-5" style={{ color: 'rgba(252,255,252,0.4)' }}>Manage your linked e-wallets.</p>
      <div style={s.divider} />

      
      {linked.length > 0 && (
        <div className="mb-4 space-y-1">
          {linked.map(({ id, label, img }) => (
            <div key={id} className="flex items-center gap-3 px-3 py-2.5 rounded-[8px]"
              style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.07)' }}>
              <div className="w-6 h-6 rounded-[4px] flex items-center justify-center shrink-0" style={{ background: '#fff' }}>
                <img src={img} alt={label} className="w-5 h-5 object-contain" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold" style={{ color: '#FCFFFC' }}>{label}</span>
                <span className="text-xs ml-2" style={{ color: 'rgba(252,255,252,0.35)' }}>{phones[id]}</span>
              </div>
              <button onClick={() => remove(id)}
                className="text-[11px] font-semibold transition-opacity hover:opacity-70 shrink-0"
                style={{ color: '#D94840' }}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {unlinked.length > 0 && (
        <div className={`flex flex-col items-center justify-center gap-4 ${linked.length === 0 ? 'py-12' : 'pt-4'}`}>
          {linked.length === 0 && (
            <>
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#1E1E1E' }}>
                <CreditCard className="w-7 h-7" style={{ color: 'rgba(252,255,252,0.2)' }} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold mb-1" style={{ color: '#FCFFFC' }}>No wallets linked</p>
                <p className="text-xs" style={{ color: 'rgba(252,255,252,0.35)' }}>Link an e-wallet to use at checkout.</p>
              </div>
            </>
          )}
          <button onClick={openModal}
            className="px-6 py-2.5 rounded-[8px] text-xs font-semibold transition-all hover:opacity-85"
            style={{ background: '#FCFFFC', color: '#262626' }}>
            + Add Wallet
          </button>
        </div>
      )}

      
      {(modal || closing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', animation: `${closing ? 'bd-out' : 'bd-in'} 0.2s ease forwards` }}
          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className="w-full max-w-sm mx-4 rounded-[14px] p-6"
            style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.08)', boxShadow: '0 24px 60px rgba(0,0,0,0.6)', animation: `${closing ? 'pay-out' : 'pay-in'} 0.2s cubic-bezier(.34,1.56,.64,1) forwards` }}>

            <h3 className="text-sm font-bold mb-1" style={{ color: '#FCFFFC' }}>Add Wallet</h3>
            <p className="text-xs mb-5" style={{ color: 'rgba(252,255,252,0.4)' }}>Select a wallet and enter your phone number.</p>

            
            <label style={s.label}>Wallet</label>
            <div className={`relative ${selectedWallet ? 'mb-4' : 'mb-5'}`} onClick={() => setPickerOpen(o => !o)}>
              <div className="w-full px-3 py-2.5 rounded-[8px] text-xs cursor-pointer flex items-center gap-2"
                style={{ background: '#262626', border: `1px solid ${pickerOpen ? 'rgba(252,255,252,0.25)' : 'rgba(252,255,252,0.1)'}`, transition: 'border-color .15s' }}>
                {walletInfo ? (
                  <>
                    <div className="w-5 h-5 rounded-[3px] flex items-center justify-center shrink-0" style={{ background: '#fff' }}>
                      <img src={walletInfo.img} alt={walletInfo.label} className="w-4 h-4 object-contain" />
                    </div>
                    <span style={{ color: '#FCFFFC' }}>{walletInfo.label}</span>
                  </>
                ) : (
                  <span style={{ color: 'rgba(252,255,252,0.3)' }}>Select wallet…</span>
                )}
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="ml-auto shrink-0"
                  style={{ transform: pickerOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s', color: 'rgba(252,255,252,0.3)' }}>
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              {pickerOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 rounded-[10px] overflow-hidden z-10"
                  style={{ background: '#2A2A2A', border: '1px solid rgba(252,255,252,0.1)', boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}
                  onClick={e => e.stopPropagation()}>
                  {unlinked.map(w => (
                    <button key={w.id} type="button"
                      onClick={() => { setSelectedWallet(w.id); setPickerOpen(false); }}
                      className="w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-colors hover:bg-white/5"
                      style={{ borderBottom: '1px solid rgba(252,255,252,0.04)', background: selectedWallet === w.id ? 'rgba(252,255,252,0.05)' : 'transparent' }}>
                      <div className="w-5 h-5 rounded-[3px] flex items-center justify-center shrink-0" style={{ background: '#fff' }}>
                        <img src={w.img} alt={w.label} className="w-4 h-4 object-contain" />
                      </div>
                      <span className="text-xs" style={{ color: '#FCFFFC' }}>{w.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedWallet && (
              <>
                <label style={s.label}>Phone Number</label>
                <input
                  type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="e.g. 081234567890"
                  autoFocus
                  onKeyDown={e => {
                    const nav = ['Backspace','Delete','Tab','ArrowLeft','ArrowRight','Home','End'];
                    if (nav.includes(e.key) || e.ctrlKey || e.metaKey) return;
                    if (!/[\d+\-() ]/.test(e.key)) e.preventDefault();
                  }}
                  style={{ ...s.input, marginBottom: '1.25rem' }}
                />
              </>
            )}

            <div className="flex items-center gap-3">
              <button onClick={saveWallet} disabled={saving || !selectedWallet || !phone.trim()}
                className="flex-1 py-2.5 rounded-[8px] text-xs font-bold transition-all hover:opacity-85 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ background: '#FCFFFC', color: '#262626' }}>
                {saving ? 'Saving…' : 'Done'}
              </button>
              <button onClick={closeModal}
                className="px-4 py-2.5 rounded-[8px] text-xs font-semibold transition-all hover:opacity-70"
                style={{ color: 'rgba(252,255,252,0.45)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationsPanel() {
  const items = [
    { key: 'orders',     label: 'Order updates',     desc: 'Shipping and delivery status' },
    { key: 'promos',     label: 'Promotions & deals', desc: 'Flash sales and discount alerts' },
    { key: 'account',    label: 'Account activity',   desc: 'Sign-ins and security alerts' },
    { key: 'newsletter', label: 'Newsletter',          desc: 'Weekly picks and new arrivals' },
  ];
  const [prefs, setPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kuroyu_notif') || '{}'); } catch { return {}; }
  });

  function toggle(key) {
    setPrefs(p => {
      const next = { ...p, [key]: !p[key] };
      localStorage.setItem('kuroyu_notif', JSON.stringify(next));
      return next;
    });
  }

  return (
    <div>
      <h2 className="text-base font-bold mb-1" style={{ color: '#FCFFFC' }}>Notifications</h2>
      <p className="text-xs mb-5" style={{ color: 'rgba(252,255,252,0.4)' }}>Choose what you want to be notified about.</p>
      <div className="space-y-1">
        {items.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-3"
            style={{ borderBottom: '1px solid rgba(252,255,252,0.06)' }}>
            <div>
              <div className="text-sm font-medium" style={{ color: '#FCFFFC' }}>{label}</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(252,255,252,0.4)' }}>{desc}</div>
            </div>
            <button type="button" onClick={() => toggle(key)}
              className="w-11 h-6 rounded-full transition-all shrink-0"
              style={{ background: prefs[key] ? '#FCFFFC' : 'rgba(252,255,252,0.12)', position: 'relative' }}>
              <span className="absolute top-1 w-4 h-4 rounded-full transition-all"
                style={{ background: prefs[key] ? '#262626' : 'rgba(252,255,252,0.4)', left: prefs[key] ? '1.5rem' : '0.25rem' }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function HelpPanel() {
  const links = [
    { label: '24/7 Help Center',    sub: 'Browse our FAQ and support articles' },
    { label: 'Contact Support',     sub: 'Chat or email with our team' },
    { label: 'How to Purchase',     sub: 'Step-by-step buying guide' },
    { label: 'Returns & Refunds',   sub: 'Refund policy and how to request' },
    { label: 'Buyer Protection',    sub: 'How Kuroyu keeps you safe' },
  ];
  return (
    <div>
      <h2 className="text-base font-bold mb-1" style={{ color: '#FCFFFC' }}>Help Center</h2>
      <p className="text-xs mb-5" style={{ color: 'rgba(252,255,252,0.4)' }}>Find answers and get in touch.</p>
      <div className="space-y-1">
        {links.map(({ label, sub }) => (
          <button key={label}
            className="w-full flex items-center justify-between py-3 text-left transition-all hover:opacity-70"
            style={{ borderBottom: '1px solid rgba(252,255,252,0.06)' }}>
            <div>
              <div className="text-sm font-medium" style={{ color: '#FCFFFC' }}>{label}</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(252,255,252,0.4)' }}>{sub}</div>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'rgba(252,255,252,0.3)' }} />
          </button>
        ))}
      </div>
    </div>
  );
}

function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [banTarget, setBanTarget] = useState(null); 
  const [banReason, setBanReason] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/admin/users`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => { if (d.success) setUsers(d.users); })
      .finally(() => setLoading(false));
  }, []);

  async function toggleRole(u) {
    const newRole = u.role === 'admin' ? 'user' : 'admin';
    setBusy(u._id + '_role');
    const res = await fetch(`${API_URL}/api/admin/users/${u._id}/role`, {
      method: 'PATCH', headers: authHeader(), body: JSON.stringify({ role: newRole }),
    }).then(r => r.json()).catch(() => null);
    if (res?.success) setUsers(prev => prev.map(x => x._id === u._id ? { ...x, role: newRole } : x));
    setBusy('');
  }

  async function confirmBan() {
    if (!banTarget) return;
    setBusy(banTarget.id + '_ban');
    const res = await fetch(`${API_URL}/api/admin/users/${banTarget.id}/disable`, {
      method: 'PATCH', headers: authHeader(), body: JSON.stringify({ disabled: true, reason: banReason.trim() || null }),
    }).then(r => r.json()).catch(() => null);
    if (res?.success) setUsers(prev => prev.map(x => x._id === banTarget.id ? { ...x, disabled: true, disabledReason: banReason.trim() || null } : x));
    setBanTarget(null); setBanReason(''); setBusy('');
  }

  async function unban(u) {
    setBusy(u._id + '_ban');
    const res = await fetch(`${API_URL}/api/admin/users/${u._id}/disable`, {
      method: 'PATCH', headers: authHeader(), body: JSON.stringify({ disabled: false }),
    }).then(r => r.json()).catch(() => null);
    if (res?.success) setUsers(prev => prev.map(x => x._id === u._id ? { ...x, disabled: false, disabledReason: null } : x));
    setBusy('');
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-base font-bold" style={{ color: '#FCFFFC' }}>Admin Panel</h2>
      </div>
      <p className="text-xs mb-5" style={{ color: 'rgba(252,255,252,0.4)' }}>Manage users — promote to admin or disable accounts.</p>
      <div style={{ borderTop: '1px solid rgba(252,255,252,0.06)', marginBottom: '1.25rem' }} />

      {loading ? (
        <p className="text-sm py-8 text-center" style={{ color: 'rgba(252,255,252,0.3)' }}>Loading users…</p>
      ) : (
        <div className="space-y-0">
          {users.map(u => (
            <div key={u._id} className="flex items-center justify-between py-3"
              style={{ borderBottom: '1px solid rgba(252,255,252,0.06)' }}>
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate" style={{ color: u.disabled ? 'rgba(252,255,252,0.3)' : '#FCFFFC' }}>
                    {u.name}
                  </span>
                  {u.role === 'admin' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                      style={{ background: 'rgba(252,255,252,0.1)', color: '#FCFFFC' }}>
                      ADMIN
                    </span>
                  )}
                  {u.disabled && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                      style={{ background: 'rgba(217,72,64,0.15)', color: '#D94840' }}>
                      BANNED
                    </span>
                  )}
                </div>
                <div className="text-xs mt-0.5 truncate" style={{ color: 'rgba(252,255,252,0.4)' }}>{u.email}</div>
                {u.disabled && u.disabledReason && (
                  <div className="text-[11px] mt-0.5 italic" style={{ color: 'rgba(217,72,64,0.7)' }}>
                    Reason: {u.disabledReason}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <style>{`
                  .admin-line-btn { position:relative; display:inline-flex; align-items:center; gap:5px; background:none; border:none; cursor:pointer; padding:0; }
                  .admin-line-btn::after { content:''; position:absolute; bottom:-1px; left:0; right:0; height:1px; transform:scaleX(0); transform-origin:left center; transition:transform 0.25s ease; }
                  .admin-line-btn:hover::after { transform:scaleX(1); }
                  .admin-line-btn:disabled { opacity:0.3; pointer-events:none; }
                  .admin-line-btn.role::after { background: rgba(252,255,252,0.5); }
                  .admin-line-btn.ban::after { background: #D94840; }
                  .admin-line-btn.unban::after { background: #10b981; }
                `}</style>
                
                <button
                  onClick={() => toggleRole(u)}
                  disabled={busy === u._id + '_role'}
                  title={u.role === 'admin' ? 'Demote to user' : 'Promote to admin'}
                  className="admin-line-btn role text-[11px] font-medium"
                  style={{ color: u.role === 'admin' ? 'rgba(252,255,252,0.5)' : '#FCFFFC' }}>
                  <Crown className="w-3 h-3" />
                  {u.role === 'admin' ? 'Demote' : 'Promote'}
                </button>
                
                {u.disabled ? (
                  <button
                    onClick={() => unban(u)}
                    disabled={busy === u._id + '_ban'}
                    className="admin-line-btn unban text-[11px] font-medium"
                    style={{ color: '#10b981' }}>
                    <UserCheck className="w-3 h-3" />
                    Unban
                  </button>
                ) : (
                  <button
                    onClick={() => { setBanTarget({ id: u._id, name: u.name }); setBanReason(''); }}
                    disabled={busy === u._id + '_ban'}
                    className="admin-line-btn ban text-[11px] font-medium"
                    style={{ color: '#D94840' }}>
                    <Ban className="w-3 h-3" />
                    Ban
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      
      {banTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
          onClick={e => { if (e.target === e.currentTarget) { setBanTarget(null); setBanReason(''); } }}>
          <div className="w-full max-w-sm mx-4 rounded-[14px] p-6"
            style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.08)' }}>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-bold" style={{ color: '#FCFFFC' }}>Ban User</h3>
            </div>
            <p className="text-xs mb-5" style={{ color: 'rgba(252,255,252,0.4)' }}>
              Disabling <span style={{ color: '#FCFFFC', fontWeight: 600 }}>{banTarget.name}</span> will prevent them from logging in.
            </p>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'rgba(252,255,252,0.5)' }}>
              Reason (optional)
            </label>
            <textarea
              rows={3}
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              placeholder="e.g. Violation of terms of service…"
              className="w-full px-3 py-2 rounded-[8px] text-xs resize-none outline-none"
              style={{ background: '#262626', border: '1px solid rgba(252,255,252,0.1)', color: '#FCFFFC' }}
            />
            <div className="flex items-center gap-3 mt-4">
              <button onClick={confirmBan}
                className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-xs font-semibold transition-all hover:opacity-85"
                style={{ background: '#D94840', color: '#FCFFFC' }}>
                <Ban className="w-3.5 h-3.5" />
                Confirm Ban
              </button>
              <button onClick={() => { setBanTarget(null); setBanReason(''); }}
                className="px-4 py-2 rounded-[8px] text-xs font-semibold transition-all hover:opacity-70"
                style={{ color: 'rgba(252,255,252,0.45)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomSelect({ value, onChange, options, placeholder = 'Select…' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const label = options.find(o => (o.value ?? o) === value)?.label ?? options.find(o => (o.value ?? o) === value) ?? value;
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-xs transition-all"
        style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.1)', color: value ? '#FCFFFC' : 'rgba(252,255,252,0.3)', cursor: 'pointer', outline: 'none' }}>
        <span>{value || placeholder}</span>
        <ChevronRight size={12} style={{ color: 'rgba(252,255,252,0.3)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-1 rounded-[10px] overflow-hidden z-30"
          style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)', maxHeight: 200, overflowY: 'auto' }}>
          {options.map(opt => {
            const val = opt.value ?? opt;
            const lbl = opt.label ?? opt;
            return (
              <button key={val} type="button" onClick={() => { onChange(val); setOpen(false); }}
                className="w-full text-left px-3 py-2 text-xs transition-all hover:bg-white/5"
                style={{ color: value === val ? '#FCFFFC' : 'rgba(252,255,252,0.6)', background: value === val ? 'rgba(252,255,252,0.06)' : 'transparent' }}>
                {lbl}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EditProductForm({ product, categories, onSave, onCancel }) {
  const [title, setTitle]       = useState(product.title || '');
  const [price, setPrice]       = useState(product.price || '');
  const [category, setCategory] = useState(product.category || '');
  const [stock, setStock]       = useState(product.stock ?? '');
  const [colorsOn, setColorsOn] = useState((product.colors || []).length > 0);
  const [colors, setColors]     = useState(product.colors || []);
  const [colorInput, setColorInput] = useState('');
  const [sizesOn, setSizesOn]   = useState((product.sizes || []).length > 0);
  const [sizes, setSizes]       = useState(product.sizes || []);
  const [sizeInput, setSizeInput]   = useState('');
  const [description, setDescription] = useState(product.description || '');
  const [photos, setPhotos]     = useState([]);
  const [saving, setSaving]     = useState(false);
  const [savedOk, setSavedOk]   = useState(false);
  const fileRef = useRef(null);
  const descRef = useRef(null);

  const isDirty = title.trim() !== (product.title || '') ||
    String(price) !== String(product.price || '') ||
    category !== (product.category || '') ||
    String(stock) !== String(product.stock ?? '') ||
    JSON.stringify(colorsOn ? colors : []) !== JSON.stringify(product.colors || []) ||
    JSON.stringify(sizesOn ? sizes : []) !== JSON.stringify(product.sizes || []) ||
    description !== (product.description || '') ||
    photos.length > 0;

  function addTag(setList, input, setInput) {
    const v = input.trim();
    if (!v) return;
    setList(prev => prev.includes(v) ? prev : [...prev, v]);
    setInput('');
  }

  async function handleSave() {
    if (!title.trim() || !price) return;
    setSaving(true);
    const token = getToken();
    const fd = new FormData();
    photos.forEach(p => fd.append('images', p.file));
    fd.append('title', title.trim());
    fd.append('price', price);
    fd.append('category', category || 'General');
    fd.append('stock', stock || '0');
    fd.append('colors', JSON.stringify(colorsOn ? colors : []));
    fd.append('sizes',  JSON.stringify(sizesOn  ? sizes  : []));
    fd.append('description', descRef.current?.innerHTML || description);
    try {
      const r = await fetch(`${API_URL_PROD}/api/admin/products/${product._id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const d = await r.json();
      if (d.success) { onSave(d.data); setSavedOk(true); setTimeout(() => setSavedOk(false), 2500); }
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    background: 'rgba(252,255,252,0.05)', border: '1px solid rgba(252,255,252,0.1)',
    borderRadius: 6, padding: '7px 10px', fontSize: 12, color: '#FCFFFC', width: '100%', outline: 'none',
  };
  const labelStyle = { fontSize: 11, color: 'rgba(252,255,252,0.4)', marginBottom: 4, display: 'block' };

  return (
    <div className="mt-2 rounded-[8px] p-4 flex flex-col gap-3"
      style={{ background: 'rgba(252,255,252,0.04)', border: '1px solid rgba(252,255,252,0.1)' }}>
      <div className="flex gap-3">
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Product Name</label>
          <input value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Category</label>
          <CustomSelect value={category} onChange={setCategory} options={categories} />
        </div>
      </div>
      <div className="flex gap-3">
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Price (IDR)</label>
          <input type="text" inputMode="numeric" value={price} onChange={e => setPrice(e.target.value)}
            placeholder="e.g. 249000"
            style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Stock</label>
          <input type="number" value={stock} onChange={e => setStock(e.target.value)}
            className="[&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            style={{ ...inputStyle, MozAppearance: 'textfield' }} />
        </div>
      </div>
      <div>
        <label style={labelStyle}>Description</label>
        <div className="rounded-[6px] overflow-hidden" style={{ border: '1px solid rgba(252,255,252,0.1)', background: 'rgba(252,255,252,0.05)' }}>
          <div className="flex items-center gap-1 px-2 py-1" style={{ borderBottom: '1px solid rgba(252,255,252,0.07)' }}>
            <button type="button" onClick={() => document.execCommand('bold')}
              className="w-5 h-5 rounded text-xs flex items-center justify-center font-bold hover:bg-white/10"
              style={{ color: 'rgba(252,255,252,0.6)' }}>B</button>
            <button type="button" onClick={() => document.execCommand('italic')}
              className="w-5 h-5 rounded text-xs flex items-center justify-center italic hover:bg-white/10"
              style={{ color: 'rgba(252,255,252,0.6)' }}>I</button>
          </div>
          <div ref={descRef} contentEditable suppressContentEditableWarning
            onInput={e => setDescription(e.currentTarget.innerHTML)}
            className="px-2.5 py-2 text-xs outline-none min-h-[60px]"
            style={{ color: '#FCFFFC', lineHeight: 1.6 }}
            dangerouslySetInnerHTML={{ __html: description }} />
        </div>
      </div>
      <div className="flex gap-4">
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span style={labelStyle}>Colors</span>
            <button type="button" onClick={() => setColorsOn(v => !v)}
              className="w-7 h-4 rounded-full transition-all shrink-0 relative"
              style={{ background: colorsOn ? '#FCFFFC' : 'rgba(252,255,252,0.12)' }}>
              <span className="absolute top-0.5 w-3 h-3 rounded-full transition-all"
                style={{ background: colorsOn ? '#262626' : 'rgba(252,255,252,0.4)', left: colorsOn ? '0.9rem' : '0.1rem' }} />
            </button>
          </div>
          {colorsOn && (
            <>
              {colors.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {colors.map((c, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                      style={{ background: 'rgba(252,255,252,0.08)', color: '#FCFFFC', border: '1px solid rgba(252,255,252,0.15)' }}>
                      {c}
                      <button onClick={() => setColors(prev => prev.filter((_, idx) => idx !== i))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(252,255,252,0.4)', padding: 0, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-1">
                <input value={colorInput} onChange={e => setColorInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(setColors, colorInput, setColorInput))}
                  placeholder="Add color…" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={() => addTag(setColors, colorInput, setColorInput)}
                  style={{ background: 'rgba(252,255,252,0.08)', border: 'none', borderRadius: 6, padding: '0 10px', color: '#FCFFFC', cursor: 'pointer', fontSize: 12 }}>+</button>
              </div>
            </>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span style={labelStyle}>Sizes</span>
            <button type="button" onClick={() => setSizesOn(v => !v)}
              className="w-7 h-4 rounded-full transition-all shrink-0 relative"
              style={{ background: sizesOn ? '#FCFFFC' : 'rgba(252,255,252,0.12)' }}>
              <span className="absolute top-0.5 w-3 h-3 rounded-full transition-all"
                style={{ background: sizesOn ? '#262626' : 'rgba(252,255,252,0.4)', left: sizesOn ? '0.9rem' : '0.1rem' }} />
            </button>
          </div>
          {sizesOn && (
            <>
              {sizes.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-1">
                  {sizes.map((s, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
                      style={{ background: 'rgba(252,255,252,0.08)', color: '#FCFFFC', border: '1px solid rgba(252,255,252,0.15)' }}>
                      {s}
                      <button onClick={() => setSizes(prev => prev.filter((_, idx) => idx !== i))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(252,255,252,0.4)', padding: 0, lineHeight: 1 }}>×</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-1">
                <input value={sizeInput} onChange={e => setSizeInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag(setSizes, sizeInput, setSizeInput))}
                  placeholder="Add size…" style={{ ...inputStyle, flex: 1 }} />
                <button onClick={() => addTag(setSizes, sizeInput, setSizeInput)}
                  style={{ background: 'rgba(252,255,252,0.08)', border: 'none', borderRadius: 6, padding: '0 10px', color: '#FCFFFC', cursor: 'pointer', fontSize: 12 }}>+</button>
              </div>
            </>
          )}
        </div>
      </div>
      <div>
        <label style={labelStyle}>Replace Photos (optional, max 5)</label>
        <div className="flex flex-wrap gap-2">
          {photos.map((ph, i) => (
            <div key={i} className="relative rounded-[6px] overflow-hidden" style={{ width: 52, height: 52 }}>
              <img src={ph.preview} className="w-full h-full object-cover" />
              <button onClick={() => setPhotos(prev => { URL.revokeObjectURL(prev[i].preview); return prev.filter((_, idx) => idx !== i); })}
                style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 16, height: 16, cursor: 'pointer', color: '#fff', fontSize: 10, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>
          ))}
          {photos.length < 5 && (
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center rounded-[6px]"
              style={{ width: 52, height: 52, background: 'rgba(252,255,252,0.06)', border: '1px dashed rgba(252,255,252,0.15)', color: 'rgba(252,255,252,0.3)', fontSize: 20, cursor: 'pointer' }}>+</button>
          )}
          <input ref={fileRef} type="file" multiple accept="image/*" className="hidden"
            onChange={e => { const rem = 5 - photos.length; const picked = Array.from(e.target.files).slice(0, rem).filter(f => f.type.startsWith('image/')); setPhotos(prev => [...prev, ...picked.map(f => ({ file: f, preview: URL.createObjectURL(f) }))]); e.target.value = ''; }} />
        </div>
      </div>
      <div className="flex justify-end pt-1">
        <style>{`
          .save-line-btn { position:relative; display:inline-flex; align-items:center; gap:5px; background:none; border:none; cursor:pointer; padding:0; font-size:12px; font-weight:600; transition:color 0.2s; }
          .save-line-btn::after { content:''; position:absolute; bottom:-2px; left:0; right:0; height:1px; transform:scaleX(0); transform-origin:left center; transition:transform 0.25s ease; }
          .save-line-btn:not([disabled]):hover::after { transform:scaleX(1); }
          .save-line-btn:disabled { opacity:0.4; cursor:not-allowed; }
        `}</style>
        <button onClick={handleSave} disabled={saving || savedOk || !isDirty}
          className="save-line-btn"
          style={{ color: savedOk ? '#10b981' : '#FCFFFC', '--line-color': savedOk ? '#10b981' : '#FCFFFC' }}>
          <style>{`.save-line-btn::after { background: var(--line-color, #FCFFFC); }`}</style>
          {saving ? 'Saving…' : savedOk ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
}

function ProductListPanel() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  const [err, setErr] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filterCat, setFilterCat] = useState('all');

  async function load() {
    setLoading(true);
    setErr(null);
    const token = getToken();
    try {
      const r = await fetch(`${API_URL_PROD}/api/admin/products?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await r.json();
      if (d.success) setProducts(d.data);
      else setErr(d.message || `Error ${r.status}`);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    fetch(`${API_URL_PROD}/api/categories`).then(r => r.json()).then(d => {
      if (d.success) setCategories(d.data.map(c => c.name));
    });
  }, []);

  async function handleDelete(id) {
    setDeleting(id);
    setConfirmId(null);
    const token = getToken();
    try {
      await fetch(`${API_URL_PROD}/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(p => p.filter(x => x._id !== id));
      if (editingId === id) setEditingId(null);
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggleDisable(id, current) {
    setToggling(id);
    const token = getToken();
    try {
      const fd = new FormData();
      fd.append('disabled', String(!current));
      const r = await fetch(`${API_URL_PROD}/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const d = await r.json();
      if (d.success) setProducts(prev => prev.map(x => x._id === id ? d.data : x));
    } finally {
      setToggling(null);
    }
  }

  const filtered = filterCat === 'all' ? products : products.filter(p => p.category === filterCat);
  const editingProduct = products.find(p => p._id === editingId) || null;

  return (
    <div>
      
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold mb-1" style={{ color: '#FCFFFC' }}>Product List</h2>
          <p className="text-xs" style={{ color: 'rgba(252,255,252,0.4)' }}>All uploaded products.</p>
        </div>
        <div style={{ minWidth: 140 }}>
          <CustomSelect
            value={filterCat}
            onChange={setFilterCat}
            options={[{ value: 'all', label: 'All Categories' }, ...categories.map(c => ({ value: c, label: c }))]}
          />
        </div>
      </div>
      <div style={s.divider} />

      <div className="flex gap-5 items-start">
        
        <div className="flex-1 min-w-0">
          {loading && (
            <div className="space-y-2">
              {[0,1,2].map(i => <div key={i} style={{ height: 60, borderRadius: 8, background: 'rgba(252,255,252,0.04)' }} />)}
            </div>
          )}
          {!loading && err && <p className="text-xs" style={{ color: 'rgba(245,245,245,0.45)', letterSpacing: '0.05em' }}>Something's not right — please try again later.</p>}
          {!loading && !err && filtered.length === 0 && (
            <div className="flex flex-col items-center py-12 gap-3">
              <Package className="w-10 h-10" style={{ color: 'rgba(252,255,252,0.15)' }} />
              <p className="text-sm font-medium" style={{ color: 'rgba(252,255,252,0.4)' }}>No products yet</p>
            </div>
          )}
          <div className="space-y-2">
            {filtered.map(p => {
              const isActive = editingId === p._id;
              const isConfirm = confirmId === p._id;
              return (
                <div key={p._id}>
                  <button onClick={() => { setEditingId(id => id === p._id ? null : p._id); setConfirmId(null); }}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-[10px] text-left transition-all"
                    style={{ background: isActive ? 'rgba(252,255,252,0.07)' : '#1E1E1E', border: `1px solid ${isActive ? 'rgba(252,255,252,0.15)' : 'rgba(252,255,252,0.07)'}`, opacity: p.disabled ? 0.5 : 1 }}>
                    {p.image ? (
                      <img src={imgUrl(p.image)} alt={p.title} className="rounded-[6px] object-cover shrink-0" style={{ width: 36, height: 36 }} />
                    ) : (
                      <div className="rounded-[6px] shrink-0 flex items-center justify-center" style={{ width: 36, height: 36, background: '#2E2E2E' }}>
                        <Package className="w-4 h-4" style={{ color: 'rgba(252,255,252,0.2)' }} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate" style={{ color: '#FCFFFC' }}>{p.title}</p>
                      <p className="text-[11px]" style={{ color: 'rgba(252,255,252,0.4)' }}>
                        {p.category} · {currency2.format(p.price)}
                        {p.disabled && <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: 'rgba(252,255,252,0.08)', color: 'rgba(252,255,252,0.4)' }}>Disabled</span>}
                      </p>
                    </div>
                    <style>{`
                      .prod-line-btn { position:relative; display:inline-flex; align-items:center; gap:4px; background:none; border:none; cursor:pointer; padding:0; font-size:10px; font-weight:600; }
                      .prod-line-btn::after { content:''; position:absolute; bottom:-1px; left:0; right:0; height:1px; transform:scaleX(0); transform-origin:left center; transition:transform 0.25s ease; }
                      .prod-line-btn:hover::after { transform:scaleX(1); }
                      .prod-line-btn:disabled { opacity:0.3; pointer-events:none; }
                      .prod-line-btn.toggle::after { background: rgba(252,255,252,0.5); }
                      .prod-line-btn.del::after { background: #D94840; }
                    `}</style>
                    
                    <button onClick={e => { e.stopPropagation(); handleToggleDisable(p._id, p.disabled); }} disabled={toggling === p._id}
                      className="shrink-0 prod-line-btn toggle"
                      style={{ color: '#FCFFFC' }}>
                      {toggling === p._id ? '…' : p.disabled ? 'Enable' : 'Disable'}
                    </button>
                    
                    {!isConfirm ? (
                      <button onClick={e => { e.stopPropagation(); setConfirmId(p._id); }} disabled={deleting === p._id}
                        className="shrink-0 prod-line-btn del"
                        style={{ color: '#D94840' }}>
                        Delete
                      </button>
                    ) : (
                      <span className="shrink-0 flex items-center gap-1.5 text-[10px]" style={{ color: 'rgba(252,255,252,0.5)' }}
                        onClick={e => e.stopPropagation()}>
                        Sure?
                        <button onClick={() => handleDelete(p._id)}
                          className="prod-line-btn del font-semibold" style={{ color: '#D94840' }}>
                          Yes
                        </button>
                        <button onClick={() => setConfirmId(null)}
                          className="prod-line-btn toggle" style={{ color: 'rgba(252,255,252,0.4)' }}>
                          No
                        </button>
                      </span>
                    )}
                    <ChevronRight size={13} style={{ color: isActive ? 'rgba(252,255,252,0.5)' : 'rgba(252,255,252,0.15)', flexShrink: 0 }} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        
        {editingProduct && (
          <div className="shrink-0" style={{ position: 'sticky', top: 0, width: 440 }}>
            <EditProductForm
              key={editingProduct._id}
              product={editingProduct}
              categories={categories}
              onSave={updated => { setProducts(prev => prev.map(x => x._id === updated._id ? updated : x)); }}
              onCancel={() => setEditingId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

const LOG_TEMPLATES = {
  packed: [
    'Order received and being verified.',
    'Payment successfully confirmed.',
    'Order has been received and is being reviewed by our team.',
    'Order notification received by the seller.',
    'Seller is preparing your order.',
    'Items are being carefully packed.',
    'Packing started — products are being secured.',
    'Order is being packed with protective bubble wrap.',
    'Seller has started processing and packing your items.',
    'Packing complete, awaiting courier pickup.',
    'Package is ready for courier pickup.',
    'Shipping label has been printed and attached.',
    'Package is neatly wrapped and waiting to be picked up.',
  ],
  shipped: [
    'Package is on its way to the destination city.',
    'Package is being sorted at the transit warehouse.',
    'Package arrived at the regional sorting facility.',
    'Package is in transit between cities via express route.',
    'Package has left the origin shipping warehouse.',
    'Package passing through the main logistics hub.',
    'Package is in long-distance delivery.',
    'Courier is heading to your delivery location.',
    'Package is in the final delivery process.',
    'Package left the branch office and is heading to your address.',
    'Delivery rider is on the way — please be ready to receive.',
    'Package is now in the hands of the local delivery driver.',
  ],
};

const STATUS_STEPS = [
  { key: 'packed',    label: 'Packed',    Icon: Package },
  { key: 'shipped',   label: 'Shipped',   Icon: Truck },
  { key: 'delivered', label: 'Delivered', Icon: CheckCircle },
];

function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }

function adminLiveStatus(order) {
  if (order.cancelled) return 'cancelled';
  if (order.status === 'shipped' && order.deliveredAt && Date.now() >= new Date(order.deliveredAt).getTime()) return 'delivered';
  return order.status || 'packed';
}

function fmtDT(iso) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function OrderManagementPanel() {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [fetchErr, setFetchErr]   = useState('');
  const [selected, setSelected]   = useState(null);
  const [busy, setBusy]           = useState('');
  const [search, setSearch]       = useState('');
  const [filterSt, setFilterSt]   = useState('all');
  const [logText, setLogText]     = useState('');
  const [logTime, setLogTime]     = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showShippedForm, setShowShippedForm] = useState(false);
  const [deliveredEst, setDeliveredEst] = useState('');
  const [cancelClosing, setCancelClosing] = useState(false);
  const closeCancel = () => {
    setCancelClosing(true);
    setTimeout(() => { setShowCancelForm(false); setCancelClosing(false); setCancelReason(''); }, 200);
  };

  const panelWrapRef = useRef(null);
  const panelContentRef = useRef(null);
  useEffect(() => {
    if (!panelWrapRef.current || !panelContentRef.current) return;
    let lenis;
    let rafId;
    import('lenis').then(({ default: Lenis }) => {
      lenis = new Lenis({
        wrapper: panelWrapRef.current,
        content: panelContentRef.current,
        duration: 1.1,
        smoothWheel: true,
        easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
      function raf(t) { lenis.raf(t); rafId = requestAnimationFrame(raf); }
      rafId = requestAnimationFrame(raf);
    });
    return () => { cancelAnimationFrame(rafId); lenis?.destroy(); };
  }, [selected]);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/orders`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setOrders(d.orders);
          setSelected(d.orders[0] ?? null);
        } else {
          setFetchErr(d.message || 'Failed to load orders.');
        }
      })
      .catch(e => setFetchErr(e.message || 'Network error.'))
      .finally(() => setLoading(false));
  }, []);

  function syncSelected(updated) {
    const merged = { ...updated, user: updated.user?.name ? updated.user : (selected?.user ?? updated.user) };
    setOrders(prev => prev.map(o => o._id === merged._id ? merged : o));
    setSelected(merged);
  }

  async function handleStatus(status, extraBody = {}) {
    if (!selected) return;
    setBusy('status');
    try {
      const r = await fetch(`${API_URL}/api/admin/orders/${selected._id}/status`, {
        method: 'PATCH', headers: authHeader(), body: JSON.stringify({ status, ...extraBody }),
      });
      const res = await r.json();
      if (res?.success && res.order) {
        syncSelected(res.order);
        setShowShippedForm(false);
        setDeliveredEst('');
      } else {
        setFetchErr(res?.message || 'Failed to update status.');
      }
    } catch (e) {
      setFetchErr(e.message);
    }
    setBusy('');
  }

  async function handleAdminCancel() {
    setBusy('cancel');
    const res = await fetch(`${API_URL}/api/admin/orders/${selected._id}/cancel`, {
      method: 'PATCH', headers: authHeader(), body: JSON.stringify({ reason: cancelReason.trim() }),
    }).then(r => r.json()).catch(() => null);
    if (res?.success) { syncSelected(res.order); setShowCancelForm(false); setCancelReason(''); }
    setBusy('');
  }

  async function handleAddLog() {
    if (!logText.trim()) return;
    setBusy('addlog');
    const body = { text: logText.trim() };
    if (logTime) body.time = new Date(logTime).toISOString();
    const res = await fetch(`${API_URL}/api/admin/orders/${selected._id}/log`, {
      method: 'POST', headers: authHeader(), body: JSON.stringify(body),
    }).then(r => r.json()).catch(() => null);
    if (res?.success) { syncSelected(res.order); setLogText(''); setLogTime(''); }
    setBusy('');
  }

  async function handleEditLog(idx) {
    setBusy('editlog' + idx);
    const body = {};
    if (editLogText.trim()) body.text = editLogText.trim();
    if (editLogTime) body.time = new Date(editLogTime).toISOString();
    const res = await fetch(`${API_URL}/api/admin/orders/${selected._id}/log/${idx}`, {
      method: 'PATCH', headers: authHeader(), body: JSON.stringify(body),
    }).then(r => r.json()).catch(() => null);
    if (res?.success) { syncSelected(res.order); setEditLogIdx(null); }
    setBusy('');
  }

  async function handleDeleteLog(idx) {
    setBusy('dellog' + idx);
    const res = await fetch(`${API_URL}/api/admin/orders/${selected._id}/log/${idx}`, {
      method: 'DELETE', headers: authHeader(),
    }).then(r => r.json()).catch(() => null);
    if (res?.success) syncSelected(res.order);
    setBusy('');
  }

  const filtered = orders.filter(o => {
    const st = adminLiveStatus(o);
    if (filterSt !== 'all' && st !== filterSt) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return o.trackingNumber?.toLowerCase().includes(q) ||
        o.user?.name?.toLowerCase().includes(q) ||
        o.user?.email?.toLowerCase().includes(q);
    }
    return true;
  });

  useEffect(() => {
    if (!filtered.find(o => o._id === selected?._id)) setSelected(filtered[0] ?? null);
  }, [filtered.map(o => o._id).join(',')]);

  const stColor = { packed: '#FBBF24', shipped: '#60A5FA', delivered: '#34D399', cancelled: '#D94840' };
  const stLabel = { packed: 'Packed', shipped: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' };

  return (
    <div>
      
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold" style={{ color: '#FCFFFC' }}>Order Management</h2>
        </div>
        
        <div className="flex items-center gap-1 p-0.5 rounded-[8px]" style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.07)' }}>
          {[['all','All'],['packed','Packed'],['shipped','Shipped'],['delivered','Delivered'],['cancelled','Cancelled']].map(([val, lbl]) => (
            <button key={val} onClick={() => {
              const next = orders.filter(o => val === 'all' || adminLiveStatus(o) === val);
              setFilterSt(val);
              if (!next.find(o => o._id === selected?._id)) setSelected(next[0] ?? null);
            }}
              className="px-2.5 py-1 rounded-[6px] text-[10px] font-semibold transition-all"
              style={{ background: filterSt === val ? 'rgba(252,255,252,0.1)' : 'transparent', color: filterSt === val ? '#FCFFFC' : 'rgba(252,255,252,0.35)' }}>
              {lbl}
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs mb-4" style={{ color: 'rgba(252,255,252,0.4)' }}>Update shipping status and manage order history logs.</p>
      <div style={s.divider} />

      
      <div className="mb-4">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by tracking number, name, or email…"
          style={{ ...s.input, fontSize: 12 }} />
      </div>

      {!loading && !fetchErr && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-4 w-full">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#1E1E1E' }}>
            <Package className="w-7 h-7" style={{ color: 'rgba(252,255,252,0.2)' }} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold mb-1" style={{ color: '#FCFFFC' }}>No orders found</p>
            <p className="text-xs" style={{ color: 'rgba(252,255,252,0.35)' }}>Orders will appear here once customers place them.</p>
          </div>
        </div>
      )}

      {(!loading || filtered.length > 0) && <div className="flex gap-5" style={{ alignItems: 'flex-start' }}>


        <div style={{ flex: 1, minWidth: 0 }}>
          {loading && (
            <div className="space-y-2">
              {[0,1,2].map(i => <div key={i} style={{ height: 60, borderRadius: 8, background: 'rgba(252,255,252,0.04)', animation: 'pulse 1.5s ease-in-out infinite' }} />)}
            </div>
          )}
          {!loading && fetchErr && (
            <div className="flex flex-col items-center py-10 gap-2">
              <p className="text-xs" style={{ color: 'rgba(245,245,245,0.45)', letterSpacing: '0.05em' }}>Something's not right — please try again later.</p>
              <p className="text-[10px]" style={{ color: 'rgba(252,255,252,0.3)' }}>Check that the server is running and you are logged in as admin.</p>
            </div>
          )}
          <div className="kuroyu-scroll space-y-1.5" style={{ maxHeight: 600, overflowY: 'auto' }}>
            {filtered.map(order => {
              const st = adminLiveStatus(order);
              const isActive = selected?._id === order._id;
              return (
                <button key={order._id} onClick={() => { setSelected(order); setLogText(''); setLogTime(''); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-all"
                  style={{ background: isActive ? 'rgba(217,72,64,0.08)' : '#1E1E1E', border: `1px solid ${isActive ? 'rgba(217,72,64,0.3)' : 'rgba(252,255,252,0.07)'}` }}>
                  <div className="w-8 h-8 rounded-[6px] overflow-hidden shrink-0" style={{ background: '#2E2E2E' }}>
                    {order.items?.[0]?.image && <img src={imgUrl(order.items[0].image)} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold truncate" style={{ color: '#FCFFFC' }}>{order.trackingNumber}</p>
                    <p className="text-[10px] truncate" style={{ color: 'rgba(252,255,252,0.4)' }}>{order.user?.name || 'Unknown'}</p>
                  </div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: stColor[st] }}>{stLabel[st]?.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        </div>

        
        {selected && (
          <div style={{ width: 480, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div
            ref={panelWrapRef}
            style={{ flex: 1, minHeight: 0, height: 420, overflowY: 'hidden', overflowX: 'hidden' }}>
            <div ref={panelContentRef} style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.08)', borderRadius: '14px 14px 0 0' }}>

              
              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(252,255,252,0.07)' }}>
                <style>{`
                  .cancel-btn { position: relative; display: inline-flex; align-items: center; gap: 5px; }
                  .cancel-btn::after { content:''; position:absolute; bottom:-1px; left:0; right:0; height:1px; background:#D94840; transform:scaleX(0); transform-origin:left center; transition:transform 0.25s ease; }
                  .cancel-btn:hover::after { transform:scaleX(1); }
                `}</style>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold" style={{ color: '#FCFFFC' }}>{selected.trackingNumber}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: stColor[adminLiveStatus(selected)] }}>
                    {stLabel[adminLiveStatus(selected)]}
                  </span>
                </div>
                <p className="text-[11px]" style={{ color: 'rgba(252,255,252,0.4)' }}>
                  {selected.user?.name} · {selected.user?.email}
                </p>
                <div className="flex items-center justify-between mt-0.5">
                  <p className="text-[11px]" style={{ color: 'rgba(252,255,252,0.3)' }}>
                    {fmtDT(selected.createdAt)} · {selected.items?.length} item{selected.items?.length > 1 ? 's' : ''} · {currency2.format(selected.total)}
                  </p>
                  {!selected.cancelled && (
                    <button onClick={() => setShowCancelForm(true)} className="cancel-btn"
                      style={{ fontSize: 12, fontWeight: 600, color: '#D94840', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <Ban size={12} /> Cancel Order
                    </button>
                  )}
                  
                  {showCancelForm && (
                    <div onClick={closeCancel}
                      style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
                      <style>{`
                        @keyframes popout-in { from { opacity:0; transform:scale(0.92) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }
                        @keyframes popout-out { from { opacity:1; transform:scale(1) translateY(0); } to { opacity:0; transform:scale(0.92) translateY(10px); } }
                        .cancel-popout-enter { animation: popout-in 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards; }
                        .cancel-popout-exit { animation: popout-out 0.18s ease forwards; }
                      `}</style>
                      <div className={cancelClosing ? 'cancel-popout-exit' : 'cancel-popout-enter'} onClick={e => e.stopPropagation()} style={{
                        background: '#1A1A1A', border: '1px solid rgba(252,255,252,0.1)', borderRadius: 14,
                        padding: '24px 28px 20px', width: 420,
                        boxShadow: '0 32px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(217,72,64,0.12)',
                      }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#FCFFFC', marginBottom: 14 }}>Cancel Reason</p>
                        
                        {[
                          'Customer requested cancellation',
                          'Item out of stock',
                          'Payment issue',
                          'Duplicate order',
                          'Shipping address problem',
                          'Fraud suspected',
                        ].map((tmpl, i) => (
                          <button key={i} type="button"
                            onClick={() => setCancelReason(cancelReason === tmpl ? '' : tmpl)}
                            style={{
                              display: 'block', width: '100%', textAlign: 'left',
                              padding: '7px 10px', marginBottom: 4, borderRadius: 7, border: 'none', cursor: 'pointer',
                              background: cancelReason === tmpl ? 'rgba(217,72,64,0.14)' : 'rgba(252,255,252,0.04)',
                              color: cancelReason === tmpl ? '#FCFFFC' : 'rgba(252,255,252,0.55)',
                              fontSize: 11, lineHeight: 1.4,
                              transition: 'all 0.12s',
                            }}>
                            {tmpl}
                          </button>
                        ))}
                        <textarea
                          value={cancelReason}
                          onChange={e => setCancelReason(e.target.value)}
                          placeholder="Or type a custom reason…"
                          rows={2}
                          style={{ ...s.input, resize: 'none', fontSize: 12, marginTop: 10, marginBottom: 14, width: '100%' }}
                        />
                        <div className="flex gap-3">
                          <button onClick={handleAdminCancel} disabled={busy === 'cancel'}
                            style={{ flex: 1, padding: '9px 0', borderRadius: 8, background: '#D94840', color: '#FCFFFC', fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', opacity: busy === 'cancel' ? 0.5 : 1 }}>
                            {busy === 'cancel' ? '…' : 'Confirm Cancel'}
                          </button>
                          <button onClick={closeCancel}
                            style={{ flex: 1, padding: '9px 0', borderRadius: 8, background: 'rgba(252,255,252,0.06)', color: 'rgba(252,255,252,0.5)', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer' }}>
                            Back
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>


              <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(252,255,252,0.07)' }}>
                <div className="space-y-2.5 mb-3">
                  {selected.items?.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[6px] overflow-hidden shrink-0" style={{ background: '#2E2E2E' }}>
                        {item.image && <img src={imgUrl(item.image)} alt={item.title} className="w-full h-full object-cover" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: '#FCFFFC' }}>{item.title}</p>
                        <p className="text-[10px]" style={{ color: 'rgba(252,255,252,0.4)' }}>
                          {item.qty}× · {currency2.format(item.price)}{item.color ? ` · ${item.color}` : ''}{item.size ? ` · ${item.size}` : ''}
                        </p>
                      </div>
                      <p className="text-xs font-semibold shrink-0" style={{ color: '#FCFFFC' }}>{currency2.format(item.price * item.qty)}</p>
                    </div>
                  ))}
                </div>
                {(() => {
                  const subtotal = selected.subtotal ?? selected.items?.reduce((sum, i) => sum + i.price * i.qty, 0) ?? 0;
                  const shipping = selected.shippingCost ?? selected.courier?.price ?? 0;
                  const protection = selected.addons?.protection ?? 0;
                  const insurance  = selected.addons?.insurance  ?? 0;
                  return (
                    <div className="space-y-1.5 text-[11px] pt-2.5" style={{ borderTop: '1px solid rgba(252,255,252,0.07)' }}>
                      <div className="flex justify-between">
                        <span style={{ color: 'rgba(252,255,252,0.4)' }}>Subtotal</span>
                        <span style={{ color: 'rgba(252,255,252,0.7)' }}>{currency2.format(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: 'rgba(252,255,252,0.4)' }}>Shipping ({selected.courier?.label || '-'})</span>
                        <span style={{ color: 'rgba(252,255,252,0.7)' }}>{shipping > 0 ? currency2.format(shipping) : 'Free'}</span>
                      </div>
                      {protection > 0 && (
                        <div className="flex justify-between">
                          <span style={{ color: 'rgba(252,255,252,0.4)' }}>Package Protection</span>
                          <span style={{ color: 'rgba(252,255,252,0.7)' }}>{currency2.format(protection)}</span>
                        </div>
                      )}
                      {insurance > 0 && (
                        <div className="flex justify-between">
                          <span style={{ color: 'rgba(252,255,252,0.4)' }}>Shipping Insurance</span>
                          <span style={{ color: 'rgba(252,255,252,0.7)' }}>{currency2.format(insurance)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold pt-1" style={{ borderTop: '1px solid rgba(252,255,252,0.07)' }}>
                        <span style={{ color: '#FCFFFC' }}>Total</span>
                        <span style={{ color: '#D94840' }}>{currency2.format(selected.total)}</span>
                      </div>
                    </div>
                  );
                })()}
                <div className="space-y-1.5 text-[11px] pt-2.5 mt-1" style={{ borderTop: '1px solid rgba(252,255,252,0.07)' }}>
                  {selected.courier?.label && (
                    <div className="flex justify-between gap-3">
                      <span style={{ color: 'rgba(252,255,252,0.4)', flexShrink: 0 }}>Courier</span>
                      <span className="text-right font-medium" style={{ color: 'rgba(252,255,252,0.75)' }}>{selected.courier.label}</span>
                    </div>
                  )}
                  {selected.paymentMethod && (
                    <div className="flex justify-between gap-3">
                      <span style={{ color: 'rgba(252,255,252,0.4)', flexShrink: 0 }}>Payment</span>
                      <span className="text-right font-medium uppercase" style={{ color: 'rgba(252,255,252,0.75)' }}>{selected.paymentMethod}</span>
                    </div>
                  )}
                  {selected.shippingAddress?.name && (
                    <div className="flex justify-between gap-3">
                      <span style={{ color: 'rgba(252,255,252,0.4)', flexShrink: 0 }}>Ship to</span>
                      <span className="text-right" style={{ color: 'rgba(252,255,252,0.7)' }}>
                        {[selected.shippingAddress.name, selected.shippingAddress.street, selected.shippingAddress.city, selected.shippingAddress.province, selected.shippingAddress.zip].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  {selected.shippingAddress?.phone && (
                    <div className="flex justify-between gap-3">
                      <span style={{ color: 'rgba(252,255,252,0.4)', flexShrink: 0 }}>Phone</span>
                      <span style={{ color: 'rgba(252,255,252,0.7)' }}>{selected.shippingAddress.phone}</span>
                    </div>
                  )}
                  {selected.note && (
                    <div className="flex justify-between gap-3">
                      <span style={{ color: 'rgba(252,255,252,0.4)', flexShrink: 0 }}>Note</span>
                      <span className="text-right italic" style={{ color: 'rgba(252,255,252,0.5)' }}>"{selected.note}"</span>
                    </div>
                  )}
                </div>
              </div>


              {!selected.cancelled && (
                <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(252,255,252,0.07)' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(252,255,252,0.35)' }}>Update Status</p>
                  <div className="flex items-center gap-3">
                    {STATUS_STEPS.map(({ key, label, Icon }) => {
                      const current = adminLiveStatus(selected);
                      const stepIdx = STATUS_STEPS.findIndex(s => s.key === key);
                      const curIdx  = STATUS_STEPS.findIndex(s => s.key === current);
                      const done    = stepIdx <= curIdx;
                      const isNext  = stepIdx === curIdx + 1 && key !== 'delivered';
                      const isDelivered = key === 'delivered';
                      return (
                        <button key={key}
                          onClick={() => {
                            if (!isNext) return;
                            if (key === 'shipped') {
                              const courierId = selected.courier?.id || '';
                              const now = Date.now();
                              const day = 24 * 3600000;
                              const ranges = { jne: [3,5], jt: [2,3], sicepat: [1,1], grab: [0,0] };
                              const [min, max] = ranges[courierId] || [1,5];
                              const days = min + Math.floor(Math.random() * (max - min + 1));
                              const deliveredAt = new Date(now + days * day + (days === 0 ? randInt(2,6)*3600000 : 0));
                              handleStatus('shipped', { deliveredAt: deliveredAt.toISOString() });
                            }
                          }}
                          disabled={!isNext || busy === 'status' || isDelivered}
                          title={isDelivered ? 'Delivered automatically when estimate date is reached' : ''}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '7px 12px', borderRadius: 8, border: 'none',
                            fontSize: 11, fontWeight: 600,
                            cursor: isNext ? 'pointer' : 'default',
                            background: done ? 'rgba(52,211,153,0.1)' : isNext ? 'rgba(252,255,252,0.07)' : 'rgba(252,255,252,0.03)',
                            color: done ? '#34D399' : isNext ? '#FCFFFC' : 'rgba(252,255,252,0.2)',
                            border: `1px solid ${done ? 'rgba(52,211,153,0.2)' : isNext ? 'rgba(252,255,252,0.15)' : 'rgba(252,255,252,0.06)'}`,
                            transition: 'all 0.15s',
                            opacity: busy === 'status' ? 0.5 : 1,
                          }}>
                          <Icon size={13} />
                          {label}
                          {isNext && <span style={{ fontSize: 9, color: 'rgba(252,255,252,0.4)', marginLeft: 2 }}>↑ set</span>}
                          {isDelivered && !done && <span style={{ fontSize: 9, color: 'rgba(252,255,252,0.25)', marginLeft: 2 }}>auto</span>}
                        </button>
                      );
                    })}
                  </div>

                  {selected.shippedAt && (
                    <p className="text-[10px] mt-3" style={{ color: 'rgba(252,255,252,0.3)' }}>
                      Shipped: {fmtDT(selected.shippedAt)}
                      {selected.deliveredAt && <> &nbsp;·&nbsp; Est. Delivered: {fmtDT(selected.deliveredAt)}</>}
                    </p>
                  )}
                </div>
              )}

            </div>
          </div>

          {!selected.cancelled && (
            <div className="px-5 py-4" style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.08)', borderTop: 'none', borderRadius: '0 0 14px 14px' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(252,255,252,0.35)' }}>Add Log</p>
              {(() => {
                const st = adminLiveStatus(selected);
                const templates = LOG_TEMPLATES[st] || [];
                const courier = selected.courier?.label || '';
                return (
                  <div>
                    {templates.length > 0 && (
                      <div className="kuroyu-scroll mb-3" onWheel={e => {
                          e.stopPropagation();
                          e.preventDefault();
                          const el = e.currentTarget;
                          const atTop = el.scrollTop <= 0 && e.deltaY < 0;
                          const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1 && e.deltaY > 0;
                          if (!atTop && !atBottom) el.scrollTop += e.deltaY;
                        }} style={{ height: 160, overflowY: 'scroll', display: 'flex', flexDirection: 'column', gap: 2, paddingRight: 4 }}>
                        {templates.map((tmpl, i) => {
                          const text = courier ? tmpl.replace(/{courier}/g, courier) : tmpl;
                          const active = logText === text;
                          return (
                            <button key={i} type="button" onClick={() => setLogText(active ? '' : text)}
                              style={{
                                textAlign: 'left', padding: '7px 10px', borderRadius: 7, border: 'none', cursor: 'pointer',
                                background: active ? 'rgba(217,72,64,0.12)' : 'rgba(252,255,252,0.04)',
                                color: active ? '#FCFFFC' : 'rgba(252,255,252,0.6)',
                                fontSize: 11, lineHeight: 1.4, transition: 'all 0.12s',
                              }}>
                              {text}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {templates.length === 0 && (
                      <textarea value={logText} onChange={e => setLogText(e.target.value)}
                        placeholder="Type a custom message…" rows={2}
                        style={{ ...s.input, resize: 'none', fontSize: 12, marginBottom: 8 }} />
                    )}
                    <button onClick={handleAddLog} disabled={busy === 'addlog' || !logText.trim()}
                      style={{ marginTop: 10, padding: '7px 18px', borderRadius: 8, background: '#D94840', color: '#FCFFFC', fontSize: 11, fontWeight: 700, border: 'none', cursor: logText.trim() ? 'pointer' : 'not-allowed', opacity: busy === 'addlog' || !logText.trim() ? 0.4 : 1 }}>
                      {busy === 'addlog' ? '…' : 'Send Log'}
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
          </div>
        )}
      </div>}
    </div>
  );
}

function AddProductBtn({ saving, disabled, added, addErr }) {
  const [hovered, setHovered] = useState(false);
  const isErr = !!addErr;
  const label = saving ? 'Uploading…' : added ? 'Added' : isErr ? (addErr === 'too-large' ? 'Too Large' : 'Error') : 'Add Product';
  const textColor = added ? '#34D399' : isErr ? '#D94840' : 'rgba(252,255,252,0.85)';
  const lineColor = added ? '#34D399' : '#D94840';
  const lineWidth = added || isErr ? '100%' : hovered && !saving && !disabled ? '100%' : '0%';
  return (
    <button type="submit" form="add-product-form" disabled={saving || disabled || added || isErr}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'none', border: 'none', padding: '8px 4px',
        cursor: saving || disabled || added || isErr ? 'not-allowed' : 'pointer',
        fontSize: 13, fontWeight: 700,
        color: textColor,
        position: 'relative', opacity: saving || disabled ? 0.4 : 1,
        transition: 'color 0.2s ease',
      }}>
      {label}
      <span style={{
        position: 'absolute', bottom: 0, left: 0, height: 2, borderRadius: 2,
        background: lineColor,
        width: lineWidth,
        transition: 'width 0.25s ease',
      }} />
    </button>
  );
}

function SaveFeaturedBtn({ saving, saved, onSave }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onSave} disabled={saving}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0, padding: '8px 4px', background: 'none', border: 'none',
        cursor: saving ? 'not-allowed' : 'pointer',
        fontSize: 13, fontWeight: 700,
        color: saved ? '#34D399' : 'rgba(252,255,252,0.85)',
        position: 'relative', opacity: saving ? 0.5 : 1,
      }}>
      {saving ? 'Saving…' : 'Save Featured'}
      <span style={{
        position: 'absolute', bottom: 0, left: 0, height: 2, borderRadius: 2,
        background: saved ? '#34D399' : '#D94840',
        width: hovered ? '100%' : '0%',
        transition: 'width 0.25s ease',
      }} />
    </button>
  );
}

function FeaturedPanel() {
  const EMPTY = { product: null, customImage: '', imageFile: null, imagePreview: '' };
  const [slots, setSlots] = useState([{ ...EMPTY }, { ...EMPTY }, { ...EMPTY }, { ...EMPTY }]);
  const [queries, setQueries] = useState(['', '', '', '']);
  const [results, setResults] = useState([[], [], [], []]);
  const [loading, setLoading] = useState([false, false, false, false]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const debounceRef = useRef([null, null, null, null]);
  const fileRefs = useRef([null, null, null, null]);

  useEffect(() => {
    fetch(`${API_URL}/api/admin/settings/featured`, { headers: authHeader() })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.featured?.length > 0) {
          const filled = [...d.featured, EMPTY, EMPTY, EMPTY, EMPTY].slice(0, 4).map(f => ({
            product: f?.product || null,
            customImage: f?.customImage || '',
            imageFile: null,
            imagePreview: f?.customImage
              ? (f.customImage.startsWith('/uploads') ? `${API_URL}${f.customImage}` : f.customImage)
              : '',
          }));
          setSlots(filled);
        }
      }).catch(() => {});
  }, []);

  function search(idx, q) {
    const newQ = [...queries]; newQ[idx] = q; setQueries(newQ);
    if (!q.trim()) {
      const r = [...results]; r[idx] = []; setResults(r);
      return;
    }
    if (debounceRef.current[idx]) clearTimeout(debounceRef.current[idx]);
    const ld = [...loading]; ld[idx] = true; setLoading(ld);
    debounceRef.current[idx] = setTimeout(async () => {
      const res = await fetch(`${API_URL}/api/products?search=${encodeURIComponent(q)}&limit=8`, { headers: authHeader() })
        .then(r => r.json()).catch(() => null);
      const r2 = [...results]; r2[idx] = res?.data || res?.products || []; setResults(r2);
      const ld2 = [...loading]; ld2[idx] = false; setLoading(ld2);
    }, 280);
  }

  function pick(idx, product) {
    const next = [...slots];
    next[idx] = { product, customImage: next[idx].customImage, imageFile: next[idx].imageFile, imagePreview: next[idx].imagePreview };
    setSlots(next);
    const q = [...queries]; q[idx] = ''; setQueries(q);
    const r = [...results]; r[idx] = []; setResults(r);
  }

  function remove(idx) {
    const next = [...slots];
    next[idx] = { ...EMPTY };
    setSlots(next);
  }

  function handleImageFile(idx, file) {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    const next = [...slots];
    next[idx] = { ...next[idx], imageFile: file, imagePreview: preview };
    setSlots(next);
  }

  function removeImage(idx) {
    const next = [...slots];
    if (next[idx].imagePreview && next[idx].imageFile) URL.revokeObjectURL(next[idx].imagePreview);
    next[idx] = { ...next[idx], imageFile: null, imagePreview: '', customImage: '' };
    setSlots(next);
  }

  async function handleSave() {
    setSaving(true);
    const fd = new FormData();
    const slotsMeta = slots.map(sl => ({
      productId: sl.product?._id || null,
      existingImage: sl.imageFile ? '' : sl.customImage,
      keepImage: !sl.imageFile,
    }));
    fd.append('slots', JSON.stringify(slotsMeta));
    slots.forEach(sl => { if (sl.imageFile) fd.append('images', sl.imageFile); });

    const token = getToken();
    const res = await fetch(`${API_URL}/api/admin/settings/featured`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    }).then(r => r.json()).catch(() => null);
    setSaving(false);
    if (res?.success) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
  }

  return (
    <div>
      
      <div style={{ marginBottom: 4 }}>
        <h2 className="text-lg font-bold mb-0.5" style={{ color: '#FCFFFC' }}>Featured Products</h2>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 12, borderBottom: '1px solid rgba(252,255,252,0.08)', marginBottom: 20 }}>
        <p className="text-xs" style={{ color: 'rgba(252,255,252,0.4)' }}>Select up to 4 products for the homepage "THE DROP." section.</p>
        <SaveFeaturedBtn saving={saving} saved={saved} onSave={handleSave} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {slots.map((slot, idx) => (
          <div key={idx} className="rounded-[12px] p-4" style={{ background: '#1E1E1E', border: '1px solid rgba(252,255,252,0.08)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(252,255,252,0.35)' }}>Slot {idx + 1}</p>

            
            {slot.product ? (
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-[7px] overflow-hidden shrink-0" style={{ background: '#2E2E2E' }}>
                  {slot.product.image && <img src={imgUrl(slot.product.image)} alt={slot.product.title} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: '#FCFFFC' }}>{slot.product.title}</p>
                  <p className="text-[10px]" style={{ color: 'rgba(252,255,252,0.4)' }}>
                    {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(slot.product.price)}
                  </p>
                </div>
                <button onClick={() => remove(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(252,255,252,0.3)', padding: 4 }}>✕</button>
              </div>
            ) : (
              <div className="relative mb-3">
                <input
                  value={queries[idx]}
                  onChange={e => search(idx, e.target.value)}
                  placeholder="Search product name…"
                  style={{ ...s.input, fontSize: 12 }}
                  autoComplete="off"
                />
                {loading[idx] && (
                  <p className="text-[10px] mt-1" style={{ color: 'rgba(252,255,252,0.3)' }}>Searching…</p>
                )}
                {!loading[idx] && queries[idx] && results[idx].length === 0 && (
                  <p className="text-[10px] mt-1" style={{ color: 'rgba(252,255,252,0.3)' }}>No products found.</p>
                )}
                {results[idx].length > 0 && (
                  <div className="kuroyu-scroll absolute left-0 right-0 top-full mt-1 rounded-[10px] z-20"
                    style={{ background: '#242424', border: '1px solid rgba(252,255,252,0.12)', boxShadow: '0 16px 40px rgba(0,0,0,0.6)', maxHeight: 220, overflowY: 'auto' }}>
                    {results[idx].map((p, pi) => (
                      <button key={p._id} onClick={() => pick(idx, p)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                        style={{ border: 'none', background: 'none', cursor: 'pointer', borderBottom: pi < results[idx].length - 1 ? '1px solid rgba(252,255,252,0.05)' : 'none' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(252,255,252,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        <div className="w-9 h-9 rounded-[7px] overflow-hidden shrink-0" style={{ background: '#3A3A3A' }}>
                          {p.image && <img src={imgUrl(p.image)} alt={p.title} className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold truncate" style={{ color: '#FCFFFC' }}>{p.title}</p>
                          <p className="text-[10px]" style={{ color: 'rgba(252,255,252,0.4)' }}>
                            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p.price)}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            
            <div style={{ borderTop: '1px solid rgba(252,255,252,0.06)', paddingTop: 10 }}>
              <p className="text-[10px] mb-2" style={{ color: 'rgba(252,255,252,0.35)' }}>Custom Image</p>
              {slot.imagePreview ? (
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img src={slot.imagePreview} alt="preview" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
                  <button onClick={() => removeImage(idx)} style={{
                    position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%',
                    background: '#D94840', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 10,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                  }}>✕</button>
                </div>
              ) : (
                <button onClick={() => fileRefs.current[idx]?.click()} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7,
                  background: 'rgba(252,255,252,0.05)', border: '1px dashed rgba(252,255,252,0.15)',
                  cursor: 'pointer', color: 'rgba(252,255,252,0.5)', fontSize: 11,
                }}>
                  <span style={{ fontSize: 14 }}>+</span> Upload Image
                </button>
              )}
              <input
                ref={el => fileRefs.current[idx] = el}
                type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => handleImageFile(idx, e.target.files?.[0])}
              />
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

const PANELS = {
  account:       AccountPanel,
  address:       AddressPanel,
  orders:        OrdersPanel,
  payment:       PaymentPanel,
  notifications: NotificationsPanel,
  help:          HelpPanel,
  admin:         AdminPanel,
  addproduct:    AddProductPanel,
  productlist:   ProductListPanel,
  ordermanage:   OrderManagementPanel,
  featured:      FeaturedPanel,
};

export default function SettingsPage() {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab && PANELS[tab] ? tab : 'account';

  const [user] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('kuroyu_user') || localStorage.getItem('kuroyu_user')); } catch { return null; }
  });
  function logout() {
    localStorage.removeItem('kuroyu_token');
    localStorage.removeItem('kuroyu_user');
    sessionStorage.removeItem('kuroyu_token');
    sessionStorage.removeItem('kuroyu_user');
    window.location.href = '/';
  }

  const Panel = PANELS[activeTab];

  return (
    <div style={{ background: '#262626', color: '#FCFFFC', minHeight: '100vh', overflowX: 'hidden' }}>
      <div className="fixed inset-0 pointer-events-none select-none flex items-center justify-center z-0" aria-hidden="true">
        <img src="/CatLogoWhite.png" alt="" style={{ width: '15vw', maxWidth: 600, opacity: 0.01, userSelect: 'none', filter: 'grayscale(1)' }} />
      </div>


      <div className="max-w-[1280px] mx-auto px-4 lg:px-8 pt-16 pb-8 flex gap-8 items-start">

        
        <aside className="w-52 shrink-0 sticky top-8">

          
          <button onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-xs hover:opacity-60 transition-opacity mb-4"
            style={{ color: 'rgba(252,255,252,0.45)' }}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          
          <div className="mb-4" style={{ borderBottom: '1px solid rgba(252,255,252,0.06)', paddingBottom: '1rem' }}>
            <div className="text-sm font-semibold truncate" style={{ color: '#FCFFFC' }}>{user?.name ?? 'Guest'}</div>
            <div className="text-[11px] truncate mt-0.5" style={{ color: 'rgba(252,255,252,0.4)' }}>{user?.email ?? ''}</div>
          </div>

          
          <nav>
            {NAV.map(({ id, icon: Icon, label }) => (
              <button key={id}
                onClick={() => navigate(`/settings/${id}`)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[7px] text-xs font-medium transition-all text-left"
                style={activeTab === id
                  ? { background: 'rgba(252,255,252,0.07)', color: '#FCFFFC' }
                  : { color: 'rgba(252,255,252,0.5)' }
                }>
                <Icon className="w-4 h-4 shrink-0"
                  style={{ color: activeTab === id ? '#FCFFFC' : 'rgba(252,255,252,0.3)' }} />
                {label}
              </button>
            ))}

            {user?.role === 'admin' && (
              <>
                <div className="my-2" style={{ borderTop: '1px solid rgba(217,72,64,0.2)' }} />
                <button
                  onClick={() => navigate('/settings/admin')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[7px] text-xs font-medium transition-all text-left"
                  style={activeTab === 'admin'
                    ? { background: 'rgba(217,72,64,0.12)', color: '#D94840' }
                    : { color: 'rgba(217,72,64,0.7)' }
                  }>
                  <Shield className="w-4 h-4 shrink-0" style={{ color: activeTab === 'admin' ? '#D94840' : 'rgba(217,72,64,0.5)' }} />
                  Admin Panel
                </button>
                <button
                  onClick={() => navigate('/settings/addproduct')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[7px] text-xs font-medium transition-all text-left"
                  style={activeTab === 'addproduct'
                    ? { background: 'rgba(217,72,64,0.12)', color: '#D94840' }
                    : { color: 'rgba(217,72,64,0.7)' }
                  }>
                  <Sparkles className="w-4 h-4 shrink-0" style={{ color: activeTab === 'addproduct' ? '#D94840' : 'rgba(217,72,64,0.5)' }} />
                  Add Product
                </button>
                <button
                  onClick={() => navigate('/settings/productlist')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[7px] text-xs font-medium transition-all text-left"
                  style={activeTab === 'productlist'
                    ? { background: 'rgba(217,72,64,0.12)', color: '#D94840' }
                    : { color: 'rgba(217,72,64,0.7)' }
                  }>
                  <Package className="w-4 h-4 shrink-0" style={{ color: activeTab === 'productlist' ? '#D94840' : 'rgba(217,72,64,0.5)' }} />
                  Product List
                </button>
                <button
                  onClick={() => navigate('/settings/ordermanage')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[7px] text-xs font-medium transition-all text-left"
                  style={activeTab === 'ordermanage'
                    ? { background: 'rgba(217,72,64,0.12)', color: '#D94840' }
                    : { color: 'rgba(217,72,64,0.7)' }
                  }>
                  <Truck className="w-4 h-4 shrink-0" style={{ color: activeTab === 'ordermanage' ? '#D94840' : 'rgba(217,72,64,0.5)' }} />
                  Manage Orders
                </button>
                <button
                  onClick={() => navigate('/settings/featured')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[7px] text-xs font-medium transition-all text-left"
                  style={activeTab === 'featured'
                    ? { background: 'rgba(217,72,64,0.12)', color: '#D94840' }
                    : { color: 'rgba(217,72,64,0.7)' }
                  }>
                  <Sparkles className="w-4 h-4 shrink-0" style={{ color: activeTab === 'featured' ? '#D94840' : 'rgba(217,72,64,0.5)' }} />
                  Featured Home
                </button>
              </>
            )}

            <div className="my-2" style={{ borderTop: '1px solid rgba(252,255,252,0.06)' }} />

            <button onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[7px] text-xs font-medium transition-all hover:bg-[rgba(217,72,64,0.07)]"
              style={{ color: '#D94840' }}>
              <LogOut className="w-4 h-4 shrink-0" />
              Sign Out
            </button>

          </nav>
        </aside>

        
        <main className="flex-1 min-w-0 pt-2">
          <Panel user={user} />
        </main>

      </div>

    </div>
  );
}
