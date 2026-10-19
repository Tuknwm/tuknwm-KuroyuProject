import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const inputCls = {
  width: '100%', borderRadius: 8, padding: '0.625rem 0.875rem',
  fontSize: '0.875rem', background: '#1E1E1E',
  border: '1px solid rgba(252,255,252,0.1)', color: '#FCFFFC', outline: 'none',
  boxSizing: 'border-box',
};

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Something went wrong.');
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#080808' }}>
      <div className="w-full max-w-md rounded-[12px] overflow-hidden" style={{ background: '#2E2E2E', border: '1px solid rgba(252,255,252,0.08)' }}>
        <div className="flex flex-col items-center py-8 px-6" style={{ background: '#1E1E1E', borderBottom: '1px solid rgba(252,255,252,0.07)' }}>
          <img src="/CatLogoWhite.png" alt="Kuroyu" className="h-10 w-auto object-contain mb-3" />
          <span className="font-heading text-lg font-bold" style={{ color: '#FCFFFC' }}>
            kuroyu<span style={{ color: 'rgba(252,255,252,0.3)' }}>.</span>
          </span>
        </div>

        <div className="p-6">
          {done ? (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <CheckCircle className="w-12 h-12" style={{ color: '#10b981' }} />
              <h2 className="text-base font-bold" style={{ color: '#FCFFFC' }}>Password updated!</h2>
              <p className="text-xs" style={{ color: 'rgba(252,255,252,0.45)' }}>Your password has been changed. You can now sign in.</p>
              <button onClick={() => navigate('/')}
                className="px-6 py-2.5 rounded-[8px] text-sm font-bold transition-all hover:opacity-85"
                style={{ background: '#FCFFFC', color: '#262626' }}>
                Back to Home
              </button>
            </div>
          ) : !token ? (
            <p className="text-sm text-center py-4" style={{ color: '#D94840' }}>Invalid or missing reset link.</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 className="text-base font-bold" style={{ color: '#FCFFFC' }}>Set new password</h2>
              <p className="text-xs mt-1" style={{ color: 'rgba(252,255,252,0.45)' }}>Choose a new password for your account.</p>

              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(252,255,252,0.6)', marginTop: 16 }}>
                New Password
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: 4 }}>
                  <input required minLength="8" type={showPass ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    style={{ ...inputCls, paddingRight: 36 }} placeholder="Min. 8 characters" />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(252,255,252,0.4)', display: 'flex' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'rgba(252,255,252,0.6)', marginTop: 16 }}>
                Confirm Password
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginTop: 4 }}>
                  <input required minLength="8" type={showPass ? 'text' : 'password'}
                    value={confirm} onChange={e => setConfirm(e.target.value)}
                    style={{ ...inputCls, paddingRight: 36 }} placeholder="Repeat password" />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(252,255,252,0.4)', display: 'flex' }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              {error && (
                <p className="text-xs mt-3 px-3 py-2 rounded-[6px]"
                  style={{ color: '#D94840', background: 'rgba(217,72,64,0.08)', border: '1px solid rgba(217,72,64,0.2)' }}>
                  {error}
                </p>
              )}

              <button type="submit" disabled={loading}
                className="w-full rounded-[8px] py-2.5 text-sm font-bold transition-all hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: '#FCFFFC', color: '#262626', marginTop: 20 }}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
