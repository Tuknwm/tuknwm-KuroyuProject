import React, { useEffect, useRef } from 'react';
import { animate } from 'animejs';

export const COURIER_LOGOS = {
  jne: { url: '/JNE.svg', short: 'JNE', bg: '#E8520A' },
  jt: { url: '/J&T.svg', short: 'J&T', bg: '#D91F26' },
  sicepat: { url: '/SiCepat.svg', short: 'SiCepat', bg: '#E31E25' },
  grab: { url: '/Grab.svg', short: 'Grab', bg: '#00B14F' },
};

const windCSS = `
@keyframes windSweep {
  0%   { transform: translateX(70px);  opacity: 0; }
  15%  { opacity: 0.45; }
  80%  { opacity: 0.45; }
  100% { transform: translateX(-80px); opacity: 0; }
}
`;

const WINDS = [
  { top: 64, w: 58, dur: '1.5s', delay: '1.4s', z: 0 },
  { top: 90, w: 48, dur: '1.7s', delay: '1.9s', z: 0 },
  { top: 116, w: 54, dur: '1.4s', delay: '2.4s', z: 0 },
  { top: 76, w: 62, dur: '1.3s', delay: '1.7s', z: 2 },
  { top: 106, w: 42, dur: '1.6s', delay: '2.2s', z: 2 },
  { top: 68, w: 50, dur: '1.4s', delay: '2.0s', z: 3 },
  { top: 98, w: 56, dur: '1.5s', delay: '2.6s', z: 3 },
  { top: 126, w: 46, dur: '1.7s', delay: '1.6s', z: 3 },
];

const windStyle = (ln) => ({
  position: 'absolute', top: ln.top, left: 80 - ln.w / 2,
  width: ln.w, height: 2.5, borderRadius: 2,
  background: 'rgba(252,255,252,0.5)',
  zIndex: ln.z, pointerEvents: 'none',
  animation: `windSweep ${ln.dur} linear ${ln.delay} infinite`,
  animationFillMode: 'backwards',
});

export default function OrderPlacedAnimation({ courierId }) {
  const courier = COURIER_LOGOS[courierId] || null;
  const pkgRef = useRef(null);
  const lidRef = useRef(null);
  const wrapRef = useRef(null);
  const anims = useRef([]);

  useEffect(() => {
    anims.current.push(
      animate(pkgRef.current, {
        translateY: [0, 58], opacity: [1, 0],
        duration: 420, delay: 0, easing: 'easeInQuad',
      })
    );

    anims.current.push(
      animate(lidRef.current, {
        translateY: [-26, 0], opacity: [0, 1],
        duration: 500, delay: 420, easing: 'easeOutBack(1.8)',
      })
    );

    anims.current.push(
      animate(wrapRef.current, {
        translateY: [0, -5, 0],
        duration: 360, delay: 880, easing: 'easeOutElastic(1, 0.5)',
      })
    );

    let floatAnim;
    const t = setTimeout(() => {
      const floatDown = () => {
        floatAnim = animate(wrapRef.current, {
          translateY: 0, rotate: 2.5,
          duration: 1300, easing: 'easeInOutSine', onComplete: floatUp,
        });
      };
      const floatUp = () => {
        floatAnim = animate(wrapRef.current, {
          translateY: -8, rotate: -2.5, 
          duration: 1300, easing: 'easeInOutSine', onComplete: floatDown,
        });
      };
      floatUp();
    }, 1400);

    return () => {
      anims.current.forEach(a => a?.pause?.());
      floatAnim?.pause?.();
      clearTimeout(t);
    };
  }, []);

  return (
    <>
      <style>{windCSS}</style>
      <div style={{ position: 'relative', width: 160, height: 150 }}>

        
        {WINDS.filter(w => w.z === 0).map((ln, i) => (
          <div key={i} style={windStyle(ln)} />
        ))}

        
        <div ref={wrapRef} style={{ position: 'absolute', bottom: 0, left: 35, zIndex: 1 }}>

          
          <div ref={pkgRef} style={{ position: 'absolute', top: -48, left: 17 }}>
            <div style={{
              width: 56, height: 24, background: '#B8956A',
              border: '1.5px solid #8A6840', borderRadius: 3,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '1px 1px 0 #8A6840',
            }}>
              <div style={{ width: 20, height: 3, background: '#D94840', borderRadius: 1, opacity: 0.85 }} />
            </div>
          </div>

          
          <div ref={lidRef} style={{
            width: 90, height: 20, background: '#C8A96E',
            borderRadius: '5px 5px 0 0', opacity: 0,
            position: 'relative', marginTop: -20, zIndex: 10,
            boxShadow: '3px 2px 0 #A08040',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 16, height: 4, background: '#D94840', borderRadius: 1.5, opacity: 0.9 }} />
          </div>

          
          <div style={{
            width: 90, height: 72, background: '#C8A96E',
            borderRadius: '0 0 5px 5px', position: 'relative',
            overflow: 'hidden', boxShadow: '3px 3px 0 #A08040',
          }}>
            {courier ? (
              <div style={{
                position: 'absolute', left: '50%', top: '50%',
                transform: 'translate(-50%,-50%)',
                width: 58, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <img src={courier.url} alt={courier.short}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
                  onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
                <span style={{ display: 'none', fontSize: 10, fontWeight: 800, color: '#262626' }}>{courier.short}</span>
              </div>
            ) : (
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 10, transform: 'translateX(-50%)', background: '#D94840', opacity: 0.7 }} />
            )}
          </div>
        </div>

        
        {WINDS.filter(w => w.z === 2).map((ln, i) => (
          <div key={i} style={windStyle(ln)} />
        ))}

        
        {WINDS.filter(w => w.z === 3).map((ln, i) => (
          <div key={i} style={windStyle(ln)} />
        ))}
      </div>
    </>
  );
}
