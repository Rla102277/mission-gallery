import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Footer from '../components/Footer';

export default function PortfolioView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get(`/api/portfolios/public/${slug}`)
      .then(r => setPortfolio(r.data))
      .catch(() => setError('Portfolio not found or unpublished.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="tia-loading">
      <div className="tia-spinner" />
      <p className="label-sm">Loading portfolio</p>
    </div>
  );

  if (error || !portfolio) return (
    <div className="tia-loading">
      <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 24, opacity: 0.4 }}>{error || 'Portfolio unavailable'}</p>
      <Link to="/" className="btn-tia" style={{ marginTop: 16 }}>← Return Home</Link>
    </div>
  );

  const { heroImage, aboutContent, gearSummary, galleries = [] } = portfolio;

  return (
    <div style={{ background: 'var(--ink)', color: 'var(--cream)', minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <header style={{ position: 'relative', width: '100%', height: '60vh', minHeight: 480, overflow: 'hidden' }}>
        {heroImage ? (
          <img
            src={heroImage.url || heroImage}
            alt={portfolio.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg, #1a1a1e 0%, #0d0d0d 100%)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(13,13,13,1) 0%, rgba(13,13,13,0.3) 50%, rgba(13,13,13,0.1) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, maxWidth: 1000, margin: '0 auto', padding: '0 80px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 80 }}>
          <p className="label-sm fade-up" style={{ marginBottom: 14 }}>Portfolio</p>
          <h1 className="fade-up d1" style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(36px, 5.5vw, 72px)', lineHeight: 0.92, letterSpacing: '-2px', marginBottom: 20 }}>
            {portfolio.title}
          </h1>
          <div className="fade-up d2" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 32, height: 1, background: 'var(--gold)', opacity: 0.55 }} />
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 16, opacity: 0.45, maxWidth: 520 }}>
              {portfolio.subtitle || 'Curated photographic stories from the Infinite Arch studio.'}
            </p>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 80px' }}>

        {/* About + Gear */}
        {(aboutContent || gearSummary) && (
          <section style={{ display: 'grid', gridTemplateColumns: aboutContent && gearSummary ? '1fr 1fr' : '1fr', gap: 3, marginBottom: 80 }}>
            {aboutContent && (
              <div style={{ background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.08)', padding: '36px 40px' }}>
                <p className="label-sm" style={{ marginBottom: 16 }}>About This Portfolio</p>
                <div style={{ width: 32, height: 1, background: 'var(--gold)', opacity: 0.4, marginBottom: 20 }} />
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, lineHeight: 1.85, opacity: 0.55, whiteSpace: 'pre-line' }}>
                  {aboutContent}
                </p>
              </div>
            )}
            {gearSummary && (
              <div style={{ background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.08)', padding: '36px 40px' }}>
                <p className="label-sm" style={{ marginBottom: 16 }}>Gear Highlights</p>
                <div style={{ width: 32, height: 1, background: 'var(--gold)', opacity: 0.4, marginBottom: 20 }} />
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, lineHeight: 1.85, opacity: 0.55, whiteSpace: 'pre-line' }}>
                  {gearSummary}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Galleries */}
        <section>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40 }}>
            <div>
              <p className="label-sm" style={{ marginBottom: 10 }}>Featured Galleries</p>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(24px, 3vw, 38px)', letterSpacing: '-1px' }}>
                The <strong style={{ fontWeight: 900, fontStyle: 'normal' }}>Collection</strong>
              </h2>
            </div>
            <Link to="/galleries" style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.3, fontFamily: "'Cormorant Garamond', serif", transition: 'opacity 0.3s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = 0.7}
              onMouseLeave={e => e.currentTarget.style.opacity = 0.3}
            >
              All Galleries →
            </Link>
          </div>

          {galleries.length === 0 ? (
            <div style={{ background: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.07)', padding: '60px 40px', textAlign: 'center' }}>
              <p className="label-sm">No galleries linked yet</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {galleries.map((gallery) => {
                const previewImages = (gallery.images || []).slice(0, 6);
                return (
                  <article
                    key={gallery._id}
                    style={{ background: 'rgba(245,240,232,0.02)', border: '1px solid rgba(245,240,232,0.07)', overflow: 'hidden', transition: 'border-color 0.3s', cursor: gallery.slug ? 'pointer' : 'default' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,240,232,0.18)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(245,240,232,0.07)'}
                    onClick={() => gallery.slug && navigate(`/gallery/${gallery.slug}`)}
                  >
                    {/* Image strip */}
                    {previewImages.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(previewImages.length, 6)}, 1fr)`, height: 160 }}>
                        {previewImages.map((img, i) => (
                          <div key={i} style={{ overflow: 'hidden', background: 'rgba(245,240,232,0.04)' }}>
                            <img
                              src={img.imageId?.thumbnailPath || img.imageId?.path}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Info */}
                    <div style={{ padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, borderTop: '1px solid rgba(245,240,232,0.05)' }}>
                      <div>
                        <h3 style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 400, fontSize: 22, marginBottom: 5 }}>
                          {gallery.title}
                        </h3>
                        <p style={{ fontSize: 13, opacity: 0.35, fontFamily: "'Cormorant Garamond', serif" }}>
                          {gallery.description || 'Curated collection'} &nbsp;·&nbsp; {gallery.images?.length || 0} photographs
                        </p>
                      </div>
                      {gallery.slug && (
                        <span style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.3, fontFamily: "'Cormorant Garamond', serif", whiteSpace: 'nowrap' }}>
                          View Gallery →
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
