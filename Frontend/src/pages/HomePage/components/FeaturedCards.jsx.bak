import { useEffect, useRef, useState, useContext } from 'react';
import { gsap } from 'gsap';
import { AnimReadyContext } from '../../../App';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const currency = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

const OVERFLOW = 90;

export default function FeaturedCards() {
  const sectionRef = useRef(null);
  const navigate   = useNavigate();
  const [cards, setCards] = useState([]);
  const animReady = useContext(AnimReadyContext);
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/products/featured`)
      .then(r => { if (!r.ok) throw new Error('not ok'); return r.json(); })
      .then(d => {
        if (d.success && d.featured?.length > 0) setCards(d.featured);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!cards.length || !animReady) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const ctx = gsap.context(() => {
      gsap.from('.fc-card', {
        y: 20, autoAlpha: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08,
        scrollTrigger: { trigger: sectionRef.current, start: 'top 95%', toggleActions: 'play none none none' },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, [cards, animReady]);

  return (
    <section
      ref={sectionRef}
      style={{ background: '#080808', padding: `${OVERFLOW + 60}px 3rem 10rem`, position: 'relative' }}
    >
      
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden',
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Ccircle cx='150' cy='150' r='140' fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='1'/%3E%3Ccircle cx='150' cy='150' r='110' fill='none' stroke='rgba(255,255,255,0.04)' stroke-width='1'/%3E%3Ccircle cx='150' cy='150' r='80' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat', backgroundSize: '300px 300px',
        maskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 10%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 70% at 50% 50%, black 10%, transparent 70%)',
        opacity: 0.7,
      }} />

      
      <div style={{ marginBottom: '3rem', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, position: 'relative' }}>
        <div>
          <span style={{ fontSize: 10, letterSpacing: '0.22em', fontWeight: 600, color: '#A9232C', textTransform: 'uppercase', fontFamily: 'monospace', display: 'block', marginBottom: 8 }}>
            Featured
          </span>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em', color: '#F5F5F5', fontFamily: '"Arial Black", "Helvetica Neue", sans-serif', margin: 0 }}>
            THE DROP.
          </h2>
        </div>
      </div>

      <div aria-hidden="true" style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '12rem',
        background: 'linear-gradient(to bottom, transparent 0%, #000 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        maskImage: 'linear-gradient(to bottom, transparent 20%, black 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 20%, black 100%)',
        pointerEvents: 'none',
        zIndex: 2,
      }} />

      {cards.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: OVERFLOW, paddingBottom: '2rem', position: 'relative', gap: 20 }}>
          <img src="/CatLogoWhite.png" alt="Kuroyu" style={{ width: 64, height: 64, objectFit: 'contain', opacity: 0.15 }} />
          <span style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'rgba(245,245,245,0.08)', fontFamily: '"Arial Black", "Helvetica Neue", sans-serif', lineHeight: 1, textTransform: 'uppercase' }}>
            Coming Soon
          </span>
        </div>
      )}

      {cards.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(cards.length, 4)}, 1fr)`, gap: '1.5rem', paddingTop: OVERFLOW, position: 'relative' }}>
          {cards.map((slot, i) => {
            const p = slot.product || slot;
            const img = slot.customImage
              ? (slot.customImage.startsWith('/uploads') ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${slot.customImage}` : slot.customImage)
              : p.image;
            return (
              <CardItem key={p._id || i} card={{
                id: p._id,
                name: p.title,
                price: currency.format(p.price),
                img,
                href: `/product/${p._id}`,
              }} navigate={navigate}
                dimmed={hoveredId !== null && hoveredId !== (p._id || i)}
                onHover={id => setHoveredId(id)}
                onLeave={() => setHoveredId(null)}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

function CardItem({ card, navigate, dimmed, onHover, onLeave }) {
  const cardRef = useRef(null);
  const imgRef  = useRef(null);

  useEffect(() => {
    gsap.to(cardRef.current, { opacity: dimmed ? 0.35 : 1, duration: 0.3, ease: 'power2.out' });
  }, [dimmed]);

  function handleMouseEnter() {
    gsap.to(imgRef.current, { scale: 1.08, duration: 0.4, ease: 'power2.out' });
    onHover(card.id);
  }
  function handleMouseLeave() {
    gsap.to(imgRef.current, { scale: 1, duration: 0.4, ease: 'power2.out' });
    onLeave();
  }

  return (
    <div
      ref={cardRef}
      className="fc-card"
      onClick={() => navigate(card.href)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        overflow: 'visible',
        background: 'rgba(22,22,22,.80)',
        backdropFilter: 'blur(16px) saturate(150%)',
        WebkitBackdropFilter: 'blur(16px) saturate(150%)',
        boxShadow: '0 8px 32px rgba(0,0,0,.4)',
        borderRadius: 8,
        cursor: 'pointer',
      }}
    >
      
      <img
        ref={imgRef}
        className="fc-img"
        src={card.img}
        alt={card.name}
        loading="lazy"
        style={{
          display: 'block',
          width: '78%',
          aspectRatio: '3/4',
          objectFit: 'cover',
          margin: `${-OVERFLOW}px auto 0`,
          boxShadow: '0 8px 24px rgba(0,0,0,.5)',
          position: 'relative',
          zIndex: 1,
          transformOrigin: 'center bottom',
        }}
      />

      
      <div style={{ padding: '0.75rem 1rem 1rem', textAlign: 'center' }}>
        <p style={{ margin: '0 0 6px', fontSize: 13, fontWeight: 700, color: '#F5F5F5', letterSpacing: '0.01em', lineHeight: 1.3 }}>
          {card.name}
        </p>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(245,245,245,.5)', fontFamily: 'monospace' }}>
          {card.price}
        </span>
      </div>
    </div>
  );
}
