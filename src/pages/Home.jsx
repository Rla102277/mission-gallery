import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div style={{ background: 'var(--ink)', color: 'var(--cream)', minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', height: '100vh', minHeight: 640, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
        {/* Hero background — replace src with actual hero image */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, #2a2a2e 0%, #1a1a1e 40%, #0d0d0d 100%)',
        }}>
          {/* Placeholder text — remove when real image is set */}
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(245,240,232,0.12)', textAlign: 'center', pointerEvents: 'none', fontFamily: "'Cormorant Garamond', serif" }}>
            Hero photograph
          </div>
        </div>

        {/* Gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.2) 45%, transparent 70%)' }} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, padding: '0 80px 90px', color: 'var(--cream)' }}>
          <p className="fade-up label-sm" style={{ opacity: 0.4, marginBottom: 18 }}>
            Beyond the Daydream
          </p>
          <h1 className="fade-up d1" style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(52px, 8vw, 96px)', lineHeight: 0.92, letterSpacing: '-2px', marginBottom: 28 }}>
            The Infinite<br /><strong style={{ fontWeight: 900, fontStyle: 'normal' }}>Arch</strong>
          </h1>
          <div className="fade-up d2" style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 40 }}>
            <div style={{ width: 40, height: 1, background: 'var(--gold)', opacity: 0.6 }} />
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 17, letterSpacing: 1.5, opacity: 0.6 }}>
              Fine art landscape photography — Iceland 2026
            </p>
          </div>
          <div className="fade-up d3" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link to="/galleries" className="btn-tia">
              View Galleries
              <span style={{ fontSize: 16, opacity: 0.5 }}>→</span>
            </Link>
            <Link to="/about" className="btn-tia" style={{ opacity: 0.55 }}>
              About the Work
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="fade-up d5" style={{ position: 'absolute', bottom: 32, right: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.25 }}>
          <span style={{ fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', fontFamily: "'Cormorant Garamond', serif" }}>Scroll</span>
          <div style={{ width: 1, height: 48, background: 'var(--cream)' }} />
        </div>
      </section>

      {/* ── SERIES INTRO ── */}
      <section style={{ padding: '100px 80px', maxWidth: 1400, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div className="fade-up">
            <p className="label-sm" style={{ marginBottom: 20 }}>The Collection</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(32px, 4vw, 52px)', lineHeight: 1.1, marginBottom: 28, letterSpacing: '-1px' }}>
              Natural arches as<br />
              <strong style={{ fontWeight: 900, fontStyle: 'normal' }}>portals of transformation</strong>
            </h2>
            <div style={{ width: 40, height: 1, background: 'var(--gold)', opacity: 0.5, marginBottom: 24 }} />
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, lineHeight: 1.85, opacity: 0.55, maxWidth: 460 }}>
              Eight series from Iceland's elemental landscape — capturing the moments where volcanic stone, glacial light, and solitary scale converge into something beyond the ordinary.
            </p>
            <div style={{ marginTop: 36 }}>
              <Link to="/galleries" className="btn-tia-gold btn-tia">
                Explore All Series
              </Link>
            </div>
          </div>

          {/* Series grid preview */}
          <div className="fade-up d2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            {[
              { num: '01', title: 'Solitude & Scale' },
              { num: '03', title: 'Blue Trilogy' },
              { num: '02', title: 'Glacial Contrasts' },
              { num: '05', title: 'The Human Element' },
            ].map((s) => (
              <Link
                key={s.num}
                to="/galleries"
                style={{
                  position: 'relative',
                  aspectRatio: '4/3',
                  background: 'rgba(245,240,232,0.04)',
                  border: '1px solid rgba(245,240,232,0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: 14,
                  overflow: 'hidden',
                  transition: 'border-color 0.3s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,240,232,0.25)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(245,240,232,0.08)'}
              >
                <span style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.25, fontFamily: "'Cormorant Garamond', serif" }}>Series {s.num}</span>
                <span style={{ fontSize: 13, letterSpacing: 1, fontFamily: "'Playfair Display', serif", fontStyle: 'italic', opacity: 0.65 }}>{s.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div style={{ height: 1, background: 'var(--rule)', maxWidth: 1400, margin: '0 auto 100px', padding: '0 80px' }}><div style={{ height: 1, background: 'rgba(245,240,232,0.07)' }} /></div>

      {/* ── ICELAND EXPEDITION ── */}
      <section style={{ padding: '0 80px 100px', maxWidth: 1400, margin: '0 auto' }}>
        <div className="fade-up" style={{ textAlign: 'center', marginBottom: 60 }}>
          <p className="label-sm" style={{ marginBottom: 16 }}>January 2026</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 'clamp(28px, 3.5vw, 44px)', letterSpacing: '-1px', marginBottom: 16 }}>
            Beyond the Daydream: Iceland
          </h2>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 17, opacity: 0.45, maxWidth: 480, margin: '0 auto' }}>
            429 photographs. Eight series. One elemental landscape.
          </p>
        </div>

        {/* 8-series grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
          {[
            { num: '01', title: 'Solitude & Scale' },
            { num: '02', title: 'Glacial Contrasts' },
            { num: '03', title: 'Blue Trilogy' },
            { num: '04', title: 'Coastal Contrasts' },
            { num: '05', title: 'The Human Element' },
            { num: '06', title: 'Arnarstapi Geometry' },
            { num: '07', title: 'Peninsular Panorama' },
            { num: '08', title: 'Urban Odyssey' },
          ].map((s, i) => (
            <Link
              key={s.num}
              to="/galleries"
              className={`fade-up d${Math.min(i + 1, 5)}`}
              style={{
                position: 'relative',
                aspectRatio: '4/5',
                background: `hsl(${220 + i * 8}, 12%, ${8 + i * 1.5}%)`,
                border: '1px solid rgba(245,240,232,0.06)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '16px 18px',
                overflow: 'hidden',
                transition: 'border-color 0.3s, transform 0.4s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(245,240,232,0.22)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(245,240,232,0.06)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ width: 20, height: 1, background: 'var(--gold)', opacity: 0.4, marginBottom: 8 }} />
              <span style={{ fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.28, fontFamily: "'Cormorant Garamond', serif", marginBottom: 3 }}>{s.num}</span>
              <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 15, opacity: 0.7 }}>{s.title}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── ABOUT / CTA ── */}
      <section style={{ background: 'rgba(245,240,232,0.03)', borderTop: '1px solid rgba(245,240,232,0.07)', borderBottom: '1px solid rgba(245,240,232,0.07)', padding: '100px 80px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }} className="fade-up">
          <p className="label-sm" style={{ marginBottom: 24 }}>The Photographer</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(28px, 3.5vw, 46px)', lineHeight: 1.1, marginBottom: 28 }}>
            Moving beyond the postcard
          </h2>
          <div style={{ width: 40, height: 1, background: 'var(--gold)', opacity: 0.5, margin: '0 auto 28px' }} />
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, lineHeight: 1.85, opacity: 0.5, marginBottom: 40 }}>
            Shooting with Fujifilm GFX medium format, I seek the contemplative quality in landscapes that most photographs overlook — the silence before the light changes, the scale that makes the human figure insignificant, the arch that frames what lies beyond.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/about" className="btn-tia">Read My Story</Link>
            <Link to="/galleries" className="btn-tia btn-tia-gold">Enter the Gallery</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
