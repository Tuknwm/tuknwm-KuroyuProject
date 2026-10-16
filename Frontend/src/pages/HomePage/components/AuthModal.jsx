import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

function loadGSI() {
  return new Promise(resolve => {
    if (window.google?.accounts) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true;
    s.onload = resolve;
    document.head.appendChild(s);
  });
}

async function signInWithGoogle() {
  await loadGSI();
  return new Promise((resolve, reject) => {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: ({ credential }) => credential ? resolve(credential) : reject(new Error('Cancelled')),
    });
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(div);
    window.google.accounts.id.renderButton(div, { type: 'standard' });
    div.querySelector('div[role=button]')?.click();
    setTimeout(() => div.remove(), 3000);
  });
}

const inputCls = {
  width: '100%', borderRadius: 8, padding: '0.625rem 0.875rem',
  fontSize: '0.875rem', background: '#1E1E1E',
  border: '1px solid rgba(252,255,252,0.1)', color: '#FCFFFC', outline: 'none',
};
const labelCls = {
  display: 'block', fontSize: '0.75rem', fontWeight: 600,
  color: 'rgba(252,255,252,0.6)', marginTop: 16,
};
const dividerStyle = { background: 'rgba(252,255,252,0.07)' };

const GoogleSVG = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

function AuthModalInner({ mode, onClose, onAuthenticated }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [existingAccount, setExistingAccount] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const isRegister = mode === 'register';

  async function handleForgot(e) {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      setForgotSent(true);
    } catch { setError('Something went wrong. Try again.'); }
    finally { setSubmitting(false); }
  }
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function submit(e) {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      const signingInExisting = isRegister && existingAccount;
      const endpoint = signingInExisting || !isRegister ? 'login' : 'register';
      const body = signingInExisting ? { email, password }
        : isRegister ? { name, email, password }
          : { email, password };
      const res = await fetch(`${API_URL}/api/auth/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Authentication failed.');
      sessionStorage.setItem('kuroyu_token', data.token);
      sessionStorage.setItem('kuroyu_user', JSON.stringify(data.user));
      if (stayLoggedIn) {
        localStorage.setItem('kuroyu_token', data.token);
        localStorage.setItem('kuroyu_user', JSON.stringify(data.user));
      }
      window.dispatchEvent(new Event('kuroyu:login'));
      onAuthenticated(data.user);
      onClose();
    } catch (err) { setError(err.message); } finally { setSubmitting(false); }
  }

  async function checkEmail() {
    setError(''); setCheckingEmail(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/check-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Unable to check this email.');
      if (data.exists) { setExistingAccount(true); return; }
      setStep(1);
    } catch (err) { setError(err.message); } finally { setCheckingEmail(false); }
  }

  function handleStep0(e) {
    e.preventDefault();
    if (!isEmailValid) { setError('Please enter a valid email address.'); return; }
    if (isRegister && !existingAccount) { checkEmail(); return; }
    submit(e);
  }

  function goBack() { setError(''); setStep(s => s - 1); }

  async function handleGoogle() {
    setError(''); setSubmitting(true);
    try {
      const credential = await signInWithGoogle();
      const res = await fetch(`${API_URL}/api/auth/google`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Google sign-in failed.');
      sessionStorage.setItem('kuroyu_token', data.token);
      sessionStorage.setItem('kuroyu_user', JSON.stringify(data.user));
      if (stayLoggedIn) {
        localStorage.setItem('kuroyu_token', data.token);
        localStorage.setItem('kuroyu_user', JSON.stringify(data.user));
      }
      window.dispatchEvent(new Event('kuroyu:login'));
      onAuthenticated(data.user);
      onClose();
    } catch (err) {
      if (err.message !== 'Cancelled') setError(err.message);
    } finally { setSubmitting(false); }
  }

  function backToSignUp() {
    setError(''); setPassword(''); setConfirmPassword('');
    setExistingAccount(false); setStep(0);
  }

  function handleStep1(e) {
    e.preventDefault();
    if (!password || password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    setError(''); setStep(2);
  }

  const modalHeader = (
    <div className="relative flex flex-col items-center justify-center py-8 px-6"
      style={{ background: '#1E1E1E', borderBottom: '1px solid rgba(252,255,252,0.07)' }}>
      <div className="absolute top-0 left-0 right-0 h-[2px]" />
      <img src="/CatLogoWhite.png" alt="Kuroyu" className="h-10 w-auto object-contain mb-3" />
      <span className="font-heading text-lg font-bold" style={{ color: '#FCFFFC' }}>
        kuroyu<span style={{ color: 'rgba(252,255,252,0.3)' }}>.</span>
      </span>
      <button type="button" onClick={onClose}
        className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-[6px] transition-colors hover:bg-white/10"
        style={{ color: 'rgba(252,255,252,0.5)' }}>
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  const errorEl = error ? (
    <p className="text-xs mt-3 px-3 py-2 rounded-[6px]"
      style={{ color: '#D94840', background: 'rgba(217,72,64,0.08)', border: '1px solid rgba(217,72,64,0.2)' }}>
      {error}
    </p>
  ) : null;

  const primaryBtn = (label, disabled = false) => (
    <button type="submit" disabled={disabled}
      className="w-full rounded-[8px] py-2.5 text-sm font-bold transition-all hover:opacity-85 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: '#FCFFFC', color: '#262626', marginTop: 20 }}>
      {label}
    </button>
  );

  const orDivider = (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-[1px]" style={dividerStyle} />
      <span className="text-[11px]" style={{ color: 'rgba(252,255,252,0.3)' }}>or</span>
      <div className="flex-1 h-[1px]" style={dividerStyle} />
    </div>
  );

  const googleBtn = (
    <button type="button" onClick={handleGoogle} disabled={submitting}
      className="w-full flex items-center justify-center gap-2 rounded-[8px] text-sm font-semibold transition-all hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ padding: '0.625rem', border: '1px solid rgba(252,255,252,0.1)', color: '#FCFFFC' }}>
      <GoogleSVG /> Continue with Google
    </button>
  );

  const backBtn = (onClick) => (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1.5 text-xs mb-4 hover:opacity-70 transition-opacity"
      style={{ color: 'rgba(252,255,252,0.45)' }}>
      <ArrowLeft className="w-3 h-3" /> Back
    </button>
  );

  const overlayStyle = { background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' };
  const boxStyle = {
    background: '#2E2E2E', border: '1px solid rgba(252,255,252,0.08)',
    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
  };

  if (!isRegister) {
    if (forgotMode) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 auth-modal-overlay" style={overlayStyle}>
          <div className="w-full max-w-md rounded-[12px] overflow-hidden auth-modal-box" style={boxStyle}>
            {modalHeader}
            <div className="p-6">
              {forgotSent ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <p className="text-sm font-semibold" style={{ color: '#FCFFFC' }}>Check your email</p>
                  <p className="text-xs" style={{ color: 'rgba(252,255,252,0.45)' }}>If an account exists for <strong>{forgotEmail}</strong>, we sent a reset link. It expires in 1 hour.</p>
                  <button type="button" onClick={() => { setForgotMode(false); setForgotSent(false); }}
                    className="text-xs mt-2 hover:opacity-70 transition-opacity"
                    style={{ color: 'rgba(252,255,252,0.45)' }}>← Back to sign in</button>
                </div>
              ) : (
                <form onSubmit={handleForgot}>
                  {backBtn(() => setForgotMode(false))}
                  <h2 className="text-base font-bold" style={{ color: '#FCFFFC' }}>Forgot password?</h2>
                  <p className="text-xs mt-1" style={{ color: 'rgba(252,255,252,0.45)' }}>Enter your email and we'll send a reset link.</p>
                  <label style={labelCls}>Email
                    <input required type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} style={inputCls} placeholder="you@example.com" />
                  </label>
                  {errorEl}
                  {primaryBtn(submitting ? 'Sending...' : 'Send Reset Link', submitting)}
                </form>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 auth-modal-overlay" style={overlayStyle}>
        <form onSubmit={submit} className="w-full max-w-md rounded-[12px] overflow-hidden auth-modal-box" style={boxStyle}>
          {modalHeader}
          <div className="p-6">
            <h2 className="text-base font-bold" style={{ color: '#FCFFFC' }}>Welcome back</h2>
            <p className="text-xs mt-1" style={{ color: 'rgba(252,255,252,0.45)' }}>Sign in to your Kuroyu account.</p>
            <label style={labelCls}>Email
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputCls} placeholder="you@example.com" />
            </label>
            <label style={labelCls}>Password
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input required minLength="8" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputCls, paddingRight: 36 }} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(252,255,252,0.4)', display: 'flex' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            <div className="flex items-center justify-between mt-4">
              <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: '0.75rem', color: 'rgba(252,255,252,0.55)' }}>
                <input type="checkbox" checked={stayLoggedIn} onChange={e => setStayLoggedIn(e.target.checked)} className="rounded" />
                Stay signed in
              </label>
              <button type="button" onClick={() => { setForgotEmail(email); setForgotMode(true); setError(''); }}
                className="text-xs hover:opacity-70 transition-opacity"
                style={{ color: 'rgba(252,255,252,0.45)' }}>
                Forgot password?
              </button>
            </div>
            {errorEl}
            {primaryBtn(submitting ? 'Signing in...' : 'Sign In', submitting)}
            {orDivider}
            {googleBtn}
          </div>
        </form>
      </div>
    );
  }

  if (step === 0) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 auth-modal-overlay" style={overlayStyle}>
        <form onSubmit={existingAccount ? submit : handleStep0} className="w-full max-w-md rounded-[12px] overflow-hidden auth-modal-box" style={boxStyle}>
          {modalHeader}
          <div className="p-6">
            {existingAccount ? (
              <>
                <h2 className="text-base font-bold" style={{ color: '#FCFFFC' }}>Account found</h2>
                <p className="text-xs mt-1" style={{ color: 'rgba(252,255,252,0.45)' }}>An account with this email already exists. Sign in instead.</p>
                <label style={labelCls}>Email
                  <input type="email" value={email} disabled style={{ ...inputCls, opacity: 0.5, cursor: 'not-allowed' }} />
                </label>
                <label style={labelCls}>Password
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input required minLength="8" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputCls, paddingRight: 36 }} placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(252,255,252,0.4)', display: 'flex' }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
                <label className="flex items-center gap-2 mt-4 cursor-pointer" style={{ fontSize: '0.75rem', color: 'rgba(252,255,252,0.55)' }}>
                  <input type="checkbox" checked={stayLoggedIn} onChange={e => setStayLoggedIn(e.target.checked)} className="rounded" />
                  Stay signed in
                </label>
                {errorEl}
                {primaryBtn(submitting ? 'Signing in...' : 'Sign In', submitting)}
                <button type="button" onClick={backToSignUp}
                  className="w-full flex items-center justify-center gap-1.5 text-xs mt-3 hover:opacity-70 transition-opacity"
                  style={{ color: 'rgba(252,255,252,0.45)' }}>
                  <ArrowLeft className="w-3 h-3" /> Use a different email
                </button>
              </>
            ) : (
              <>
                <h2 className="text-base font-bold" style={{ color: '#FCFFFC' }}>Create your account</h2>
                <p className="text-xs mt-1" style={{ color: 'rgba(252,255,252,0.45)' }}>Enter your email to get started.</p>
                <label style={labelCls}>Email
                  <input required type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputCls} placeholder="you@example.com" />
                </label>
                {errorEl}
                {primaryBtn(checkingEmail ? 'Checking...' : 'Continue', !isEmailValid || checkingEmail)}
                {orDivider}
                {googleBtn}
              </>
            )}
          </div>
        </form>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 auth-modal-overlay" style={overlayStyle}>
        <form onSubmit={handleStep1} className="w-full max-w-md rounded-[12px] overflow-hidden auth-modal-box" style={boxStyle}>
          {modalHeader}
          <div className="p-6">
            {backBtn(goBack)}
            <h2 className="text-base font-bold" style={{ color: '#FCFFFC' }}>Create a password</h2>
            <p className="text-xs mt-1" style={{ color: 'rgba(252,255,252,0.45)' }}>Choose a strong password for your account.</p>
            <label style={labelCls}>Password
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input required minLength="8" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputCls, paddingRight: 36 }} placeholder="Min. 8 characters" />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(252,255,252,0.4)', display: 'flex' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            <label style={labelCls}>Confirm Password
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input required minLength="8" type={showPass ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ ...inputCls, paddingRight: 36 }} placeholder="Repeat password" />
                <button type="button" onClick={() => setShowPass(v => !v)} style={{ position: 'absolute', right: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(252,255,252,0.4)', display: 'flex' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>
            {errorEl}
            {primaryBtn('Continue')}
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 auth-modal-overlay" style={overlayStyle}>
      <form onSubmit={submit} className="w-full max-w-md rounded-[12px] overflow-hidden auth-modal-box" style={boxStyle}>
        {modalHeader}
        <div className="p-6">
          {backBtn(goBack)}
          <h2 className="text-base font-bold" style={{ color: '#FCFFFC' }}>Choose a username</h2>
          <p className="text-xs mt-1" style={{ color: 'rgba(252,255,252,0.45)' }}>Pick a unique username for your profile.</p>
          <label style={labelCls}>Username
            <input required value={name} onChange={e => setName(e.target.value)} style={inputCls} placeholder="e.g. kuroyu_user" />
          </label>
          {errorEl}
          {primaryBtn(submitting ? 'Creating account...' : 'Create Account', submitting)}
        </div>
      </form>
    </div>
  );
}

export default function AuthModal(props) {
  return createPortal(<AuthModalInner {...props} />, document.body);
}
