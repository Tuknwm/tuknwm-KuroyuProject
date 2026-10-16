import { useEffect, useRef, useState, useContext } from 'react';
import { gsap } from 'gsap';
import { useNavigate } from 'react-router-dom';
import { AnimReadyContext } from '../../../App';

const SLIDES = [
  {
    src: '/Hero1.mp4',
    description: 'A black oversized streetwear T-shirt featuring a bold Japanese-inspired graphic. Blends cultural heritage with modern urban aesthetics.',
  },
  {
    src: '/Hero2.mp4',
    description: 'Black oversized wide-leg cargo pants featuring minimalist Japanese calligraphy, subtle red seal accents, adjustable drawstrings, and hanging side straps. Designed with a relaxed silhouette, premium black fabric, and a clean, modern Japanese streetwear aesthetic.',
  },
  {
    src: '/Hero3.mp4',
    description: 'Oversized white techwear jacket featuring Japanese calligraphy, cherry blossom graphics, black tactical straps, and utility details. A minimalist, futuristic Japanese streetwear design.',
  },
  {
    src: '/Hero4.mp4',
    description: 'Minimalist white shorts featuring a subtle Japanese cherry blossom motif, clean detailing, and a relaxed fit for a modern streetwear look.',
  },
  {
    src: '/Hero5.mp4',
    description: 'A compact 60% mechanical keyboard featuring Japanese-inspired artwork, distinctive keycaps, and a sleek minimalist design. Available in Black and White editions, perfect for gaming setups and stylish workspaces.',
  },
];

const VHS_STYLE = `
  @keyframes discoverBounce {
    0%,100%{ transform: translateY(0) }
    50%{ transform: translateY(4px) }
  }
  @keyframes line-ltr {
    from { transform: scaleX(0); transform-origin: left }
    to   { transform: scaleX(1); transform-origin: left }
  }
  .shop-btn-line {
    position: relative;
  }
  .shop-btn-line::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0;
    width: 100%; height: 1px;
    background: #F5F5F5;
    transform: scaleX(0);
    transform-origin: left center;
    transition: transform 0.35s cubic-bezier(.4,0,.2,1);
  }
  .shop-btn-line:hover::after { transform: scaleX(1); }
  @keyframes vhs-flicker {
    0%,100%{opacity:1} 92%{opacity:1} 93%{opacity:.97} 94%{opacity:1} 96%{opacity:.98} 97%{opacity:1}
  }
  @keyframes vhs-track {
    0%,100%{transform:translateY(0)} 25%{transform:translateY(-1px)} 75%{transform:translateY(1px)}
  }
  @keyframes hero-grain {
    0%,100%{transform:translate(0,0)} 10%{transform:translate(-2%,-3%)} 20%{transform:translate(3%,2%)}
    30%{transform:translate(-1%,4%)} 40%{transform:translate(4%,-2%)} 50%{transform:translate(-3%,1%)}
    60%{transform:translate(2%,3%)} 70%{transform:translate(-4%,-1%)} 80%{transform:translate(1%,-3%)}
    90%{transform:translate(3%,4%)}
  }
  @keyframes rgb-bleed {
    0%,100%{box-shadow:0 0 0 0 transparent} 50%{box-shadow:2px 0 0 0 rgba(169,35,44,.18),-2px 0 0 0 rgba(0,180,220,.12)}
  }
  @keyframes glow-pulse {
    0%,100%{opacity:.55} 50%{opacity:.75}
  }
  @keyframes arch-reveal {
    from{clip-path:inset(100% 0 0 0)} to{clip-path:inset(0% 0 0 0)}
  }
  @media (prefers-reduced-motion: reduce) {
    .hero-arch-img,.hero-left,.hero-arch-wrap{animation:none!important;transition:none!important}
  }
`;

export default function HeroBanner() {
  const sectionRef  = useRef(null);
  const leftRef     = useRef(null);
  const archRef     = useRef(null);
  const glowRef     = useRef(null);
  const trackRef    = useRef(null);
  const videoRefs   = useRef([null, null]);
  const navigate    = useNavigate();
  
  const [activeSlot, setActiveSlot] = useState(0);
  const [current, setCurrent]       = useState(0);
  const sliding    = useRef(false);
  const activeRef  = useRef(0);  // mirrors activeSlot for use inside closures
  const currentRef = useRef(0);  // mirrors current for use inside closures

  function slideTo(n, dir) {
    if (sliding.current || n === currentRef.current) return;
    sliding.current = true;
    const forward  = dir !== undefined ? dir > 0 : n > currentRef.current;
    const curSlot  = activeRef.current;
    const idleSlot = 1 - curSlot;

    const vid = videoRefs.current[idleSlot];
    if (vid) { vid.src = SLIDES[n].src; vid.load(); vid.play().catch(() => {}); }

    if (!trackRef.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      activeRef.current = idleSlot; currentRef.current = n;
      setActiveSlot(idleSlot); setCurrent(n); sliding.current = false; return;
    }

    const activeEl = videoRefs.current[curSlot];
    const idleEl   = videoRefs.current[idleSlot];
    const vw       = window.innerWidth;

    gsap.set(idleEl,  { x: forward ? vw : -vw, opacity: 1 });
    gsap.to(activeEl, { x: forward ? -vw : vw, duration: 0.7, ease: 'power3.inOut' });
    gsap.to(idleEl,   { x: 0, duration: 0.7, ease: 'power3.inOut',
      onComplete: () => {
        gsap.set(activeEl, { x: 0, opacity: 0 });
        activeRef.current = idleSlot; currentRef.current = n;
        setActiveSlot(idleSlot); setCurrent(n);
        sliding.current = false;
      },
    });
  }

  const prev = () => slideTo((currentRef.current - 1 + SLIDES.length) % SLIDES.length, -1);
  const next = () => slideTo((currentRef.current + 1) % SLIDES.length, 1);
  const animReady = useContext(AnimReadyContext);

  useEffect(() => {
    if (!animReady) return;
    if (!document.getElementById('hero-vhs-style')) {
      const s = document.createElement('style');
      s.id = 'hero-vhs-style';
      s.textContent = VHS_STYLE;
      document.head.appendChild(s);
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      
      gsap.set([leftRef.current, archRef.current], { autoAlpha: 0 });
      gsap.set(leftRef.current, { y: 32 });

      tl.to(sectionRef.current, { autoAlpha: 1, duration: 0.6 })
        .to(archRef.current, { autoAlpha: 1, duration: 1.2 }, 0.1)
        .to(leftRef.current, { autoAlpha: 1, y: 0, duration: 0.9 }, 0.5)
        .to(glowRef.current, { autoAlpha: 0.7, duration: 1.2 }, 0.6);
    }, sectionRef);

    return () => ctx.revert();
  }, [animReady]);

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden"
      style={{
        minHeight: 'min(95svh, 960px)',
        background: '#080808',
      }}
    >

      <div ref={glowRef} className="absolute inset-0 pointer-events-none">
        <div style={{
          position: 'absolute', right: '10%', top: '10%',
          width: '55%', height: '75%',
          background: 'radial-gradient(ellipse at 60% 40%, rgba(169,35,44,.28) 0%, rgba(169,35,44,.06) 50%, transparent 75%)',
          filter: 'blur(40px)',
          animation: 'glow-pulse 5s ease-in-out infinite',
        }} />
        
        <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.04 }} aria-hidden="true">
          <defs>
            <pattern id="hero-grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M80 0L0 0 0 80" fill="none" stroke="#F5F5F5" strokeWidth=".5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>
      </div>

      
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,.18) 2px, rgba(0,0,0,.18) 4px)',
          animation: 'vhs-flicker 8s linear infinite',
        }} />
      </div>

      
      <div ref={archRef} className="absolute inset-0" style={{ zIndex: 1, overflow: 'hidden' }}>
        
        <div ref={trackRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
          {[0, 1].map(slot => (
            <video
              key={slot}
              ref={el => videoRefs.current[slot] = el}
              src={SLIDES[slot === 0 ? 0 : 1 % SLIDES.length].src}
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%', objectFit: 'cover',
                filter: 'contrast(1.05) brightness(1)',
                opacity: slot === 0 ? 1 : 0,
                pointerEvents: 'none',
              }}
              autoPlay muted playsInline
              onEnded={() => { if (slot === activeRef.current) slideTo((currentRef.current + 1) % SLIDES.length, 1); }}
            />
          ))}
        </div>
        
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, rgba(8,8,8,.75) 0%, rgba(8,8,8,.35) 60%, rgba(8,8,8,.1) 100%)',
        }} aria-hidden="true" />
        
        <div style={{
          position: 'absolute', inset: '-20%', width: '140%', height: '140%',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          opacity: 0.045, pointerEvents: 'none',
          animation: 'hero-grain 0.4s steps(1) infinite',
        }} aria-hidden="true" />
      </div>

      
      <div aria-hidden="true" style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '18rem',
        background: 'linear-gradient(to bottom, transparent 0%, rgba(8,8,8,0.6) 60%, #080808 100%)',
        zIndex: 6,
        pointerEvents: 'none',
      }} />

      
      <div className="relative flex items-end lg:items-center" style={{ zIndex: 8, minHeight: 'inherit', padding: '5rem 4rem 4rem' }}>
        <div ref={leftRef} className="flex flex-col gap-6 max-w-xl">
          <h1 style={{
            fontSize: 'clamp(2.8rem, 6vw, 5.5rem)',
            fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em',
            color: '#F5F5F5', fontFamily: '"Arial Black", "Helvetica Neue", sans-serif',
          }}>
            <span style={{ color: '#A9232C' }}>WEAR</span> YOUR<br />OWN STORY<span style={{ color: '#A9232C' }}>.</span>
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(245,245,245,.7)', maxWidth: '34ch' }}>
            Inspired by Japanese visual culture.<br />
            Designed for those who move differently.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <button
              onClick={() => window.scrollBy({ top: window.innerHeight * 0.6, behavior: 'smooth' })}
              className="font-semibold transition-all hover:opacity-70 active:scale-[.98]"
              style={{
                background: 'transparent', color: '#F5F5F5', padding: '11px 22px',
                borderRadius: 4, fontSize: 12, letterSpacing: '0.14em',
                textTransform: 'uppercase', border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              Discover the Story
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"
                style={{ animation: 'discoverBounce 1.4s ease-in-out infinite' }}>
                <path d="M7 2v10M3 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={() => document.getElementById('section-products')?.scrollIntoView({ behavior: 'smooth' })}
              className="shop-btn-line"
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0',
                color: '#F5F5F5', fontSize: 12, letterSpacing: '0.14em',
                textTransform: 'uppercase', fontWeight: 600,
              }}
            >
              Shop Now
            </button>
          </div>
        </div>

        
        <div style={{ position: 'absolute', bottom: '2.5rem', right: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12, maxWidth: 280 }}>
          {SLIDES[current].description && (
            <p style={{ fontSize: 11, color: 'rgba(245,245,245,.55)', lineHeight: 1.6, textAlign: 'right' }}>
              {SLIDES[current].description}
            </p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={prev} aria-label="Previous slide"
              className="transition-all hover:opacity-70 active:scale-95"
              style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 4, width: 32, height: 32, cursor: 'pointer', color: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button onClick={next} aria-label="Next slide"
              className="transition-all hover:opacity-70 active:scale-95"
              style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 4, width: 32, height: 32, cursor: 'pointer', color: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: 6 }}>
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => slideTo(i, i > current ? 1 : -1)} aria-label={`Slide ${i + 1}`}
                style={{ width: i === current ? 20 : 6, height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.3s ease', background: i === current ? '#F5F5F5' : 'rgba(255,255,255,.3)' }} />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
