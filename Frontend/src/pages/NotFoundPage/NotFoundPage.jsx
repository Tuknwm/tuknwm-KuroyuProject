import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../HomePage/components/Header';
import Footer from '../HomePage/components/Footer';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: '#262626' }}>
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center select-none">

        
        <img
          src="/CatLogoWhite.png"
          alt="Kuroyu"
          draggable={false}
          className="w-auto object-contain mb-8 pointer-events-none"
          style={{ height: 'clamp(6rem, 18vw, 11rem)', opacity: 0.15 }}
        />

        
        <h1
          className="text-xl font-bold mb-3"
          style={{ color: '#FCFFFC' }}
        >
          Page not found
        </h1>
        <p
          className="text-sm mb-8 max-w-[28ch]"
          style={{ color: 'rgba(252,255,252,0.4)', lineHeight: 1.6 }}
        >
          The page you're looking for doesn't exist or has been moved.
        </p>

        
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-[10px] text-sm font-bold transition-all hover:opacity-85 active:scale-[0.98]"
          style={{ background: '#FCFFFC', color: '#262626' }}
        >
          Back to Home
        </button>

      </main>

      <Footer />
    </div>
  );
}
