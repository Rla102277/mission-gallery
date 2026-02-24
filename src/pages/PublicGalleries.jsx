import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Footer from '../components/Footer';

export default function PublicGalleries() {
  const navigate = useNavigate();
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/galleries/public/all')
      .then(r => setGalleries(r.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="tia-loading">
        <div className="tia-spinner" />
        <p className="label-sm">Loading galleries</p>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--ink)', color: 'var(--cream)', minHeight: '100vh' }}>

      {/* ── HEADER ── */}
      <div style={{ paddingTop: 'var(--nav-h)' }}>
        <div style={{ padding: '80px 80px 56px', borderBottom: '1px solid rgba(245,240,232,0.07)' }}>
          <div className="fade-up" style={{ maxWidth: 1400, margin: '0 auto' }}>
            <p className="label-sm" style={{ marginBottom: 16 }}>Beyond the Daydream</p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(36px, 5vw, 68px)', lineHeight: 0.95, letterSpacing: '-2px', marginBottom: 24 }}>
              The <strong style={{ fontWeight: 900, fontStyle: 'normal' }}>Galleries</strong>
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 40, height: 1, background: 'var(--gold)', opacity: 0.5 }} />
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 16, opacity: 0.42 }}>
                {galleries.length} {galleries.length === 1 ? 'collection' : 'collections'} — Iceland 2026
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── GALLERY GRID ── */}
      <section style={{ padding: '60px 80px 0', maxWidth: 1400, margin: '0 auto' }}>
        {galleries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <p className="label-sm">No galleries published yet</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '3px' }}>
            {galleries.map((gallery, i) => {
              const thumb = gallery.cloudinaryAssets?.[0]?.thumbnailUrl
                || gallery.images?.[0]?.imageId?.thumbnailPath
                || null;

              return (
                <div
                  key={gallery._id}
                  className={`fade-up d${Math.min(i + 1, 5)}`}
                  onClick={() => navigate(`/gallery/${gallery.slug}`)}
                  style={{
                    position: 'relative',
                    aspectRatio: '4/3',
                    background: 'rgba(245,240,232,0.03)',
                    border: '1px solid rgba(245,240,232,0.07)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    transition: 'border-color 0.3s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(245,240,232,0.22)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(245,240,232,0.07)'}
                >
                  {/* Thumbnail */}
                  {thumb && (
                    <img
                      src={thumb}
                      alt={gallery.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)', position: 'absolute', inset: 0 }}
                      onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                      onMouseLeave={e => e.target.style.transform = 'none'}
                    />
                  )}

                  {/* Overlay */}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)' }} />

                  {/* Meta */}
                  <div style={{ position: 'absolute', inset: 0, padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <div style={{ width: 24, height: 1, background: 'var(--gold)', opacity: 0.5, marginBottom: 10 }} />
                    <h3 style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 400, fontSize: 22, lineHeight: 1.15, marginBottom: 6, color: 'var(--cream)' }}>
                      {gallery.title}
                    </h3>
                    {gallery.description && (
                      <p style={{ fontSize: 13, opacity: 0.45, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.5, marginBottom: 10,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        color: 'var(--cream)' }}>
                        {gallery.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.3, fontFamily: "'Cormorant Garamond', serif", color: 'var(--cream)' }}>
                        {gallery.lightroomAlbum ? 'Lightroom' : `${gallery.images?.length || 0} photos`}
                      </span>
                      {gallery.isPortfolio && (
                        <span style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--gold)', opacity: 0.8, fontFamily: "'Cormorant Garamond', serif" }}>
                          Portfolio
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
