import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full pt-12 pb-8 mt-12" style={{ background: '#262626', borderTop: '1px solid rgba(252,255,252,0.07)', color: 'rgba(252,255,252,0.45)' }}>
      <div className="max-w-[1280px] mx-auto px-4 lg:px-8">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <img src="/CatLogoWhite.png" alt="Kuroyu Logo" className="h-10 w-auto object-contain" />
              <span className="font-heading text-xl font-bold tracking-tight" style={{ color: '#FCFFFC' }}>
                kuroyu<span style={{ color: 'rgba(252,255,252,0.3)' }}>.</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed max-w-sm">
              Modern minimalist e-commerce marketplace. Delivering a safe, transparent, and trusted shopping experience for buyers and merchant partners.
            </p>
          </div>

          <div>
            <h5 className="font-heading text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#FCFFFC' }}>Customer Care</h5>
            <ul className="space-y-2.5 text-xs">
              {['24/7 Help Center','How to Purchase','Shipping & Logistics','Returns & Refunds','Buyer Protection','Contact Support'].map(item => (
                <li key={item} className="hover:text-white cursor-pointer transition-colors">{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-heading text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#FCFFFC' }}>Explore</h5>
            <ul className="space-y-2.5 text-xs">
              {['About Our Company','Careers','Blog & News','Affiliate Program','Merchant Hub','Privacy Policy'].map(item => (
                <li key={item} className="hover:text-white cursor-pointer transition-colors">{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-heading text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#FCFFFC' }}>Payment Methods</h5>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { label: 'GoPay',      logo: '/GoPay.svg',  bg: '#FFFFFF' },
                { label: 'OVO',        logo: '/OVO.svg',    bg: '#FFFFFF' },
                { label: 'DANA',       logo: '/Dana.svg',   bg: '#FFFFFF' },
                { label: 'ShopeePay', logo: '/Spay.png',   bg: '#FFFFFF' },
                { label: 'COD',        logo: '/COD.png',    bg: '#FFFFFF' },
              ].map(({ label, logo, bg, el }) => (
                <div key={label} className="h-7 rounded-[6px] flex items-center justify-center px-1.5"
                  style={{ background: bg, border: '1px solid rgba(252,255,252,0.07)' }}>
                  {logo
                    ? <img src={logo} alt={label} style={{ height: 26 }} className="w-auto object-contain max-w-full"
                        onError={e => { e.currentTarget.style.display='none'; }} />
                    : el}
                </div>
              ))}
            </div>
            <h5 className="font-heading text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#FCFFFC' }}>Shipping</h5>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'JNE',     logo: '/JNE.svg' },
                { label: 'J&T',     logo: '/J&T.svg' },
                { label: 'SiCepat', logo: '/SiCepat.svg' },
                { label: 'Grab',    logo: '/Grab.svg' },
              ].map(({ label, logo }) => (
                <div key={label} className="h-8 rounded-[6px] flex items-center justify-center px-1"
                  style={{ background: '#FFFFFF', border: '1px solid rgba(252,255,252,0.07)' }}>
                  <img src={logo} alt={label} className="h-4 w-auto object-contain max-w-full"
                    onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='block'; }}
                  />
                  <span className="text-[9px] font-bold hidden" style={{ color: '#FCFFFC' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
          style={{ borderTop: '1px solid rgba(252,255,252,0.07)' }}>
          <div>© 2026 <span className="font-semibold" style={{ color: '#FCFFFC' }}>Kuroyu</span>. All Rights Reserved.</div>
          <div className="flex items-center gap-6">
            {['Terms of Service','Privacy Policy','Security'].map(item => (
              <span key={item} className="hover:text-white cursor-pointer transition-colors">{item}</span>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}
