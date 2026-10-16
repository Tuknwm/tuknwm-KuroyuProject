import React from 'react';
import Header from './components/Header';
import HeroBanner from './components/HeroBanner';
import FeaturedCards from './components/FeaturedCards';
import BrandStory from './components/BrandStory';
import ProductFeed from './components/ProductFeed';
import Footer from './components/Footer';
import ScrollIndicator from './components/ScrollIndicator';

export default function HomePage() {
  return (
    <div className="min-h-screen font-body flex flex-col selection:bg-white selection:text-[#262626]"
      style={{ background: '#262626', color: '#FCFFFC' }}>

      
      <div className="fixed inset-0 pointer-events-none select-none flex items-center justify-center z-0"
        aria-hidden="true">
        <img src="/CatLogoWhite.png" alt=""
          style={{ width: '15vw', maxWidth: 600, opacity: 0.01, userSelect: 'none', filter: 'grayscale(1)' }} />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <Header />
        <main className="flex-1 w-full flex flex-col">
          <div id="section-hero"><HeroBanner /></div>
          <div id="section-featured"><FeaturedCards /></div>
          <div id="section-brand" style={{ background: 'linear-gradient(to bottom, #000 70%, #262626 100%)' }}><BrandStory /></div>
          <div id="section-products"><ProductFeed /></div>
        </main>
        <ScrollIndicator />
        <Footer />
      </div>
    </div>
  );
}
