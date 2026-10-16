import React, { lazy, Suspense, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import LoadingPage from './pages/LoadingPage/LoadingPage';
import ChatWidget from './components/ChatWidget';
import useSmoothScroll from './hooks/useSmoothScroll';
import { lenis } from './hooks/useSmoothScroll';
import { CartProvider } from './context/CartContext';
import PageTransition from './components/PageTransition';

export const AnimReadyContext = createContext(false);

function MobileGuard({ children }) {
  const [isMobile, setIsMobile] = React.useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const handler = e => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (!isMobile) return children;

  return (
    <div style={{
      minHeight: '100svh', background: '#080808',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '2rem', textAlign: 'center', gap: '1.5rem',
      fontFamily: '"Arial Black","Helvetica Neue",sans-serif',
    }}>
      <img src="/CatLogoWhite.png" alt="Kuroyu" style={{ width: 64, opacity: 0.9 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <span style={{ fontSize: 10, letterSpacing: '0.3em', color: '#A9232C', textTransform: 'uppercase', fontFamily: 'monospace' }}>
          Coming Soon
        </span>
        <h1 style={{ fontSize: 'clamp(1.8rem,8vw,3rem)', fontWeight: 900, color: '#FCFFFC', lineHeight: 1, letterSpacing: '-0.03em', margin: 0 }}>
          PHONE UI<br />ON THE WAY.
        </h1>
      </div>
      <p style={{ fontSize: 13, color: 'rgba(252,255,252,0.45)', lineHeight: 1.6, maxWidth: '28ch', fontFamily: 'sans-serif' }}>
        We're crafting a mobile experience worthy of Kuroyu.<br />
        Check back soon — or visit us on desktop.
      </p>
      <div style={{ width: 40, height: 2, background: '#A9232C', borderRadius: 999 }} />
    </div>
  );
}

const HomePage          = lazy(() => import('./pages/HomePage/HomePage'));
const SettingsPage      = lazy(() => import('./pages/SettingsPage/SettingsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage/ProductDetailPage'));
const CartPage          = lazy(() => import('./pages/CartPage/CartPage'));
const CheckoutPage      = lazy(() => import('./pages/CheckoutPage/CheckoutPage'));
const SearchPage        = lazy(() => import('./pages/SearchPage/SearchPage'));
const NotFoundPage      = lazy(() => import('./pages/NotFoundPage/NotFoundPage'));
const OrdersPage        = lazy(() => import('./pages/OrdersPage/OrdersPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage/ResetPasswordPage'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppRoutes() {
  useSmoothScroll();
  const location = useLocation();
  return (
    <>
      <ScrollToTop />
      <ChatWidget />
      <Suspense fallback={null}>
        <PageTransition key={location.pathname}>
          <Routes location={location}>
            <Route path="/"             element={<HomePage />} />
            <Route path="/product/:id"  element={<ProductDetailPage />} />
            <Route path="/cart"         element={<CartPage />} />
            <Route path="/search"       element={<SearchPage />} />
            <Route path="/settings"     element={<SettingsPage />} />
            <Route path="/settings/:tab" element={<SettingsPage />} />
            <Route path="/checkout"     element={<CheckoutPage />} />
            <Route path="/orders"       element={<OrdersPage />} />
            <Route path="/loading"        element={<LoadingPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="*"               element={<NotFoundPage />} />
          </Routes>
        </PageTransition>
      </Suspense>
    </>
  );
}

function AppWithIntro() {
  const visited = !!sessionStorage.getItem('hasVisited');
  const skipIntro = window.location.pathname.startsWith('/reset-password');
  const [animReady, setAnimReady] = React.useState(visited || skipIntro);
  const [gone, setGone]           = React.useState(visited || skipIntro);
  return (
    <AnimReadyContext.Provider value={animReady}>
      <AppRoutes />
      {!gone && <LoadingPage onReady={() => setAnimReady(true)} onDone={() => setGone(true)} />}
    </AnimReadyContext.Provider>
  );
}

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <MobileGuard>
          <AppWithIntro />
        </MobileGuard>
      </BrowserRouter>
    </CartProvider>
  );
}
