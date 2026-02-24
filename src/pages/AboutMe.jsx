import { useState, useEffect } from 'react';
import api from '../lib/api';
import Footer from '../components/Footer';

export default function AboutMe() {
  const [about, setAbout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/about')
      .then(r => { if (r.data?.isPublished) setAbout(r.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="tia-loading">
      <div className="tia-spinner" />
      <p className="label-sm">Loading</p>
    </div>
  );

  return (
    <div style={{ background: 'var(--ink)', color: 'var(--cream)', minHeight: '100vh' }}>
      <div style={{ paddingTop: 'var(--nav-h)' }}>

        {/* Header */}
        <div style={{ padding: '80px 80px 60px', borderBottom: '1px solid rgba(245,240,232,0.07)', maxWidth: 1400, margin: '0 auto' }}>
          <p className="label-sm fade-up" style={{ marginBottom: 16 }}>The Photographer</p>
          <h1 className="fade-up d1" style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(36px, 5vw, 68px)', lineHeight: 0.95, letterSpacing: '-2px' }}>
            About <strong style={{ fontWeight: 900, fontStyle: 'normal' }}>the Work</strong>
          </h1>
        </div>

        <section style={{ padding: '60px 80px', maxWidth: 1100, margin: '0 auto' }}>
          {about ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80, alignItems: 'start' }}>
              {/* Sidebar */}
              <div className="fade-up">
                <div style={{ width: 40, height: 1, background: 'var(--gold)', opacity: 0.5, marginBottom: 28 }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {[
                    ['Camera', 'Fujifilm GFX 100S / X-T5'],
                    ['Focus', 'Landscape · Arches · Portals'],
                    ['Style', 'Contemplative · Fine Art'],
                    ['Tagline', 'Beyond the Daydream'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <p style={{ fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.3, marginBottom: 4, fontFamily: "'Cormorant Garamond', serif" }}>{k}</p>
                      <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, opacity: 0.65 }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main text */}
              <div className="fade-up d2">
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, lineHeight: 1.9, opacity: 0.6, whiteSpace: 'pre-wrap' }}>
                  {about.refinedText || about.rawText}
                </div>
              </div>
            </div>
          ) : (
            <div className="fade-up" style={{ textAlign: 'center', padding: '80px 0' }}>
              <div style={{ width: 40, height: 1, background: 'var(--gold)', opacity: 0.4, margin: '0 auto 28px' }} />
              <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 22, opacity: 0.35 }}>
                Profile coming soon
              </p>
              <p style={{ fontSize: 13, opacity: 0.22, marginTop: 12, fontFamily: "'Cormorant Garamond', serif", letterSpacing: 2 }}>
                The photographer hasn't published their profile yet.
              </p>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
}
