import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full pt-12 pb-8 mt-12" style={{ background: '#080808', borderTop: '1px solid rgba(252,255,252,0.07)', color: 'rgba(252,255,252,0.45)' }}>
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
              Kuroyu is a modern minimalist e-commerce platform built with React, featuring real-time chat, smooth animations, and a clean shopping experience from browsing to checkout.
            </p>
            <a
              href="https://github.com/Tuknwm/tuknwm-KuroyuProject"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              View on GitHub
            </a>
          </div>

          <div>
            <h5 className="font-heading text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#FCFFFC' }}>Customer Care</h5>
            <ul className="space-y-2.5 text-xs">
              {['24/7 Help Center', 'How to Purchase', 'Shipping & Logistics', 'Returns & Refunds', 'Buyer Protection', 'Contact Support'].map(item => (
                <li key={item} className="hover:text-white cursor-pointer transition-colors">{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-heading text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#FCFFFC' }}>Explore</h5>
            <ul className="space-y-2.5 text-xs">
              {['About Our Company', 'Careers', 'Blog & News', 'Affiliate Program', 'Merchant Hub', 'Privacy Policy'].map(item => (
                <li key={item} className="hover:text-white cursor-pointer transition-colors">{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-heading text-xs font-bold uppercase tracking-wider mb-4" style={{ color: '#FCFFFC' }}>Payment Methods</h5>
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[
                { label: 'GoPay', logo: '/GoPay.svg', bg: '#FFFFFF' },
                { label: 'OVO', logo: '/OVO.svg', bg: '#FFFFFF' },
                { label: 'DANA', logo: '/Dana.svg', bg: '#FFFFFF' },
                { label: 'ShopeePay', logo: '/Spay.png', bg: '#FFFFFF' },
                { label: 'COD', logo: '/COD.png', bg: '#FFFFFF' },
              ].map(({ label, logo, bg, el }) => (
                <div key={label} className="h-9 rounded-[6px] flex items-center justify-center px-1.5"
                  style={{ background: bg, border: '1px solid rgba(252,255,252,0.07)' }}>
                  {logo
                    ? <img src={logo} alt={label} style={{ height: 26 }} className="w-auto object-contain max-w-full"
                      onError={e => { e.currentTarget.style.display = 'none'; }} />
                    : el}
                </div>
              ))}
            </div>
            <h5 className="font-heading text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#FCFFFC' }}>Shipping</h5>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'JNE', logo: '/JNE.svg' },
                { label: 'J&T', logo: '/J&T.svg' },
                { label: 'SiCepat', logo: '/SiCepat.svg' },
                { label: 'Grab', logo: '/Grab.svg' },
              ].map(({ label, logo }) => (
                <div key={label} className="h-9 rounded-[6px] flex items-center justify-center px-1.5"
                  style={{ background: '#FFFFFF', border: '1px solid rgba(252,255,252,0.07)' }}>
                  <img src={logo} alt={label} style={{ height: 26 }} className="w-auto object-contain max-w-full"
                    onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'block'; }}
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
            {['Terms of Service', 'Privacy Policy', 'Security'].map(item => (
              <span key={item} className="hover:text-white cursor-pointer transition-colors">{item}</span>
            ))}
          </div>
        </div>

      </div>
    </footer>
  );
}
