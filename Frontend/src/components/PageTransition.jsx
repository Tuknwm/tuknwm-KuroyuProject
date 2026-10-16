import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function PageTransition({ children }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      overlayRef.current.style.display = 'none';
      return;
    }
    gsap.fromTo(overlayRef.current,
      { opacity: 1 },
      { opacity: 0, duration: 0.35, ease: 'power2.out',
        onComplete: () => { overlayRef.current.style.display = 'none'; } }
    );
  }, []);

  return (
    <>
      
      <div ref={overlayRef} style={{
        position: 'fixed', inset: 0,
        background: '#262626',
        zIndex: 9999,
        pointerEvents: 'none',
      }} />
      {children}
    </>
  );
}
