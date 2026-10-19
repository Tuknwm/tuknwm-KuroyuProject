import { useEffect, useRef, useContext } from 'react';
import gsap from 'gsap';
import { AnimReadyContext } from '../../../App';

export default function BrandStory() {
  const sectionRef = useRef(null);
  const animReady = useContext(AnimReadyContext);

  useEffect(() => {
    if (!animReady) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const obs = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;

      sectionRef.current?.querySelectorAll('.bs-anim').forEach((el, i) => {
        el.style.animation = `bsFadeUp 0.9s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s forwards`;
      });

      const kanji = sectionRef.current?.querySelectorAll('.bs-bg-kanji');
      kanji?.forEach((el, i) => {
        const baseOpacity = 0.08 + (i % 4) * 0.02;
        gsap.timeline({ delay: 0.3 + i * 0.18 })
          .to(el, { opacity: 0.4,  duration: 0.05 })
          .to(el, { opacity: 0.05, duration: 0.04 })
          .to(el, { opacity: 0.35, duration: 0.06, filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.4))' })
          .to(el, { opacity: 0.05, duration: 0.05 })
          .to(el, { opacity: baseOpacity, duration: 0.4, filter: 'none', ease: 'power2.out' })
          .then(() => {
            const loop = () => {
              const delay = 2 + i * 0.8 + Math.random() * 3;
              gsap.timeline({ delay })
                .to(el, { opacity: baseOpacity * 4, filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))', duration: 0.05 })
                .to(el, { opacity: baseOpacity * 0.3, duration: 0.04 })
                .to(el, { opacity: baseOpacity * 3, filter: 'drop-shadow(0 0 14px rgba(255,255,255,0.2))', duration: 0.06 })
                .to(el, { opacity: baseOpacity, filter: 'none', duration: 0.3, ease: 'power2.out' })
                .then(loop);
            };
            loop();
          });
      });

      obs.disconnect();
    }, { threshold: 0.1 });

    obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, [animReady]);

  return (
    <section
      ref={sectionRef}
      style={{
        background: '#000',
        position: 'relative',
        overflow: 'hidden',
        padding: '20rem 3rem',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div aria-hidden="true" style={{
        position: 'absolute', inset: 0,
        pointerEvents: 'none', userSelect: 'none',
        overflow: 'hidden', zIndex: 0,
        fontFamily: '"Hiragino Kaku Gothic Pro","Noto Sans JP","Yu Gothic",sans-serif',
        fontWeight: 900, lineHeight: 1.1,
      }}>
        {[
          { chars: 'クロキュウアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフ', left: '1%',  pt: '0%'  },
          { chars: 'ハヒフヘホマミムメモヤユヨラリルレロワヲンクロキュウアイウエオカキ', left: '8%',  pt: '12%' },
          { chars: 'サシスセソタチツテトクロキュウアイウエオカキクケコナニヌネノルレロ', left: '15%', pt: '5%'  },
          { chars: 'ナニヌネノハヒフヘホマミムメモヤユヨラリクロキュウアイウエオカキク', left: '22%', pt: '18%' },
          { chars: 'ルレロワヲンサシスセソタチツテトナニヌネノクロキュウハヒフヘホマミ', left: '29%', pt: '8%'  },
          { chars: 'アイウエオカキクケコサシスセソハヒフヘホマミムメモヤユヨラリルレロ', left: '36%', pt: '22%' },
          { chars: 'ルレロワヲンハヒフヘホマミムメモヤユヨラリクロキュウアイウエオカキ', right: '1%',  pt: '0%'  },
          { chars: 'アイウエオカキクケコサシスセソハヒフヘホマミムメモヤユヨラリルレロ', right: '8%',  pt: '15%' },
          { chars: 'ナニヌネノタチツテトクロキュウルレロワヲンアイウエオカキクサシスセ', right: '15%', pt: '6%'  },
          { chars: 'クロキュウアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフ', right: '22%', pt: '20%' },
          { chars: 'サシスセソタチツテトクロキュウアイウエオカキクケコナニヌネノルレロ', right: '29%', pt: '10%' },
          { chars: 'ハヒフヘホマミムメモヤユヨラリルレロワヲンクロキュウアイウエオカキ', right: '36%', pt: '3%'  },
        ].map((col, ci) => (
          <div key={ci} className="bs-bg-kanji" style={{
            position: 'absolute', top: 0, bottom: 0,
            ...(col.left ? { left: col.left } : { right: col.right }),
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: 'clamp(1.2rem, 2vw, 2.2rem)',
            color: '#fff',
            opacity: 0,
            paddingTop: col.pt,
            gap: '0.1em',
          }}>
            {col.chars.split('').map((ch, i) => (
              <span key={i}>{ch}</span>
            ))}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes bsFadeUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        .bs-anim { opacity:1 }
      `}</style>

      <div style={{
        position: 'relative',
        width: 'min(90vw, 560px)',
        aspectRatio: '4/5',
        flexShrink: 0,
        background: '#0a0a0a',
        overflow: 'hidden',
      }}>

        <div className="bs-anim" style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none', userSelect: 'none',
          lineHeight: 0.85,
          overflow: 'hidden',
        }}>
          <span style={{
            fontSize: 'clamp(18rem, 60vw, 72rem)',
            fontWeight: 900,
            color: '#fff',
            fontFamily: '"Hiragino Kaku Gothic Pro","Noto Sans JP","Yu Gothic",sans-serif',
            letterSpacing: '-0.04em',
            whiteSpace: 'nowrap',
            display: 'block',
            transform: 'rotate(-4deg) scale(1.1)',
          }}>
            黒湯
          </span>
        </div>

        <div className="bs-anim" style={{
          position: 'absolute',
          bottom: '28%', left: 0, right: 0,
          background: '#FCFFFC',
          padding: '0.9rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          zIndex: 2,
        }}>
          <span style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
            fontWeight: 700,
            color: '#000',
            letterSpacing: '0.5em',
            fontFamily: '"Arial Black","Helvetica Neue",sans-serif',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}>
            K U R O Y U
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <span style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              fontSize: 'clamp(0.55rem, 1vw, 0.75rem)',
              color: 'rgba(0,0,0,0.7)',
              letterSpacing: '0.15em',
              fontFamily: '"Hiragino Kaku Gothic Pro","Noto Sans JP",sans-serif',
              whiteSpace: 'nowrap',
            }}>
              日本の暗闇から生まれた。
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', textAlign: 'right' }}>
              {[
                ['CREATIVE DIRECTION', 'KUROYU STUDIO'],
                ['ART DIRECTION', 'TUKNWM'],
                ['CONCEPT TEXT', 'BORN IN THE DARK'],
              ].map(([label, val]) => (
                <div key={label} style={{ lineHeight: 1.3 }}>
                  <span style={{
                    fontSize: 'clamp(0.45rem, 0.7vw, 0.6rem)',
                    color: 'rgba(0,0,0,0.4)',
                    letterSpacing: '0.18em',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    display: 'block',
                  }}>{label}</span>
                  <span style={{
                    fontSize: 'clamp(0.5rem, 0.8vw, 0.65rem)',
                    color: 'rgba(0,0,0,0.85)',
                    letterSpacing: '0.12em',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    display: 'block',
                  }}>{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div aria-hidden="true" style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '12rem',
        background: 'linear-gradient(to bottom, #000 0%, transparent 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        maskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 30%, transparent 100%)',
        pointerEvents: 'none', zIndex: 3,
      }} />

      <div aria-hidden="true" style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '20rem',
        background: 'linear-gradient(to top, #080808 0%, transparent 100%)',
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        maskImage: 'linear-gradient(to top, black 40%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to top, black 40%, transparent 100%)',
        pointerEvents: 'none', zIndex: 3,
      }} />


    </section>
  );
}
