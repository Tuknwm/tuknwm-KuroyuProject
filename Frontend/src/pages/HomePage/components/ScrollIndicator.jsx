import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

const SECTIONS = [
  { id: 'section-hero',     label: 'Hero' },
  { id: 'section-featured', label: 'Featured' },
  { id: 'section-products', label: 'Products' },
];

export default function ScrollIndicator() {
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(wrapRef.current,
      { autoAlpha: 0, x: 16 },
      { autoAlpha: 1, x: 0, duration: 0.6, ease: 'power3.out', delay: 1.2 }
    );

    const observers = SECTIONS.map((sec, i) => {
      const el = document.getElementById(sec.id);
      if (!el) return null;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActive(i); },
        { threshold: 0.1 }
      );
      obs.observe(el);
      return obs;
    });

    return () => observers.forEach(o => o?.disconnect());
  }, []);

  function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div
      ref={wrapRef}
      style={{
        position: 'fixed',
        right: '2.5rem',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 12,
        opacity: 0,
      }}
    >
      {SECTIONS.map((sec, i) => (
        <button
          key={sec.id}
          onClick={() => scrollTo(sec.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 0',
          }}
        >
          <span style={{
            fontSize: 10,
            fontWeight: i === active ? 700 : 500,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            color: i === active ? '#F5F5F5' : 'rgba(252,255,252,0.28)',
            transition: 'color 0.3s ease',
          }}>
            {sec.label}
          </span>

          
          <div style={{
            width: i === active ? 20 : 4,
            height: 2,
            borderRadius: 999,
            background: i === active ? '#A9232C' : 'rgba(252,255,252,0.2)',
            transition: 'width 0.35s cubic-bezier(.4,0,.2,1), background 0.3s ease',
            flexShrink: 0,
          }} />
        </button>
      ))}
    </div>
  );
}
