import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { getApiUrl } from '../lib/api';
import Lightbox from '../components/Lightbox';
import Footer from '../components/Footer';

export default function PublicGallery() {
  const { slug } = useParams();
  const [gallery, setGallery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lrPhotos, setLrPhotos] = useState([]);
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIndex, setLbIndex] = useState(0);

  useEffect(() => {
    fetchGallery();
  }, [slug]);

  const fetchGallery = async () => {
    try {
      const res = await api.get(`/api/galleries/public/${slug}`);
      setGallery(res.data);
      if (res.data.lightroomAlbum) {
        await fetchLightroomPhotos(res.data);
      }
    } catch (err) {
      setError('Gallery not found or is private');
    } finally {
      setLoading(false);
    }
  };

  const fetchLightroomPhotos = async (galleryData) => {
    try {
      const token = localStorage.getItem('adobe_lightroom_token');
      if (!token) return;
      const { catalogId, id: albumId } = galleryData.lightroomAlbum;
      const res = await fetch(
        `https://lr.adobe.io/v2/catalogs/${catalogId}/albums/${albumId}/assets?embed=asset&subtype=image`,
        { headers: { 'Authorization': `Bearer ${token}`, 'X-API-Key': import.meta.env.VITE_ADOBE_CLIENT_ID } }
      );
      let text = await res.text();
      if (text.trim().startsWith('while')) {
        const idx = text.indexOf('{', text.indexOf('{') + 1);
        if (idx > 0) text = text.substring(idx);
      }
      const data = JSON.parse(text);
      const all = data.resources || [];
      const visible = galleryData.visibleLightroomPhotos || [];
      setLrPhotos(visible.length > 0 ? all.filter(p => visible.includes(p.id)) : all);
    } catch (err) {
      console.error('LR fetch error', err);
    }
  };

  const openLightbox = (idx) => { setLbIndex(idx); setLbOpen(true); };

  // Build image list for lightbox
  const buildImages = () => {
    if (lrPhotos.length > 0) {
      const token = localStorage.getItem('adobe_lightroom_token');
      return lrPhotos.map(p => {
        const largeHref = p.asset?.links?.['/rels/rendition_type/2048']?.href;
        const base = localStorage.getItem('lr_base_url') || `https://lr.adobe.io/v2/catalogs/${gallery?.lightroomAlbum?.catalogId}/`;
        const lrUrl = largeHref ? `${base}${largeHref}` : null;
        return {
          url: lrUrl ? getApiUrl(`/api/adobe/image-proxy?url=${encodeURIComponent(lrUrl)}&token=${token}`) : null,
          title: p.asset?.payload?.importSource?.fileName || 'Photo',
        };
      });
    }
    return (gallery?.images || [])
      .filter(item => item.imageId?.isPublic)
      .map(item => ({
        url: `/${item.imageId.path}`,
        title: item.imageId.caption || item.imageId.filename || 'Photo',
      }));
  };

  if (loading) return (
    <div className="tia-loading">
      <div className="tia-spinner" />
      <p className="label-sm">Loading gallery</p>
    </div>
  );

  if (error || !gallery) return (
    <div className="tia-loading" style={{ gap: 20 }}>
      <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 24, opacity: 0.4 }}>Gallery not found</p>
      <Link to="/galleries" className="btn-tia" style={{ marginTop: 8 }}>← Back to Galleries</Link>
    </div>
  );

  const images = buildImages();

  // Cloudinary assets take priority for display
  const cloudAssets = gallery.cloudinaryAssets || [];
  const classicImages = (gallery.images || []).filter(item => item.imageId?.isPublic);

  const renderGrid = () => {
    if (lrPhotos.length > 0) {
      const token = localStorage.getItem('adobe_lightroom_token');
      return lrPhotos.map((photo, i) => {
        const thumbHref = photo.asset?.links?.['/rels/rendition_type/thumbnail2x']?.href;
        const base = localStorage.getItem('lr_base_url') || `https://lr.adobe.io/v2/catalogs/${gallery.lightroomAlbum.catalogId}/`;
        const lrUrl = thumbHref ? `${base}${thumbHref}` : null;
        const thumbUrl = lrUrl ? getApiUrl(`/api/adobe/image-proxy?url=${encodeURIComponent(lrUrl)}&token=${token}`) : null;
        return (
          <div key={photo.id} className="photo-cell" onClick={() => openLightbox(i)}>
            {thumbUrl && <img src={thumbUrl} alt={photo.asset?.payload?.importSource?.fileName || ''} loading="lazy" />}
            <div className="photo-cell-overlay">
              <span style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.7, color: 'var(--cream)', fontFamily: "'Cormorant Garamond', serif" }}>View</span>
            </div>
          </div>
        );
      });
    }

    if (cloudAssets.length > 0) {
      return cloudAssets.map((asset, i) => (
        <div key={asset.publicId || i} className="photo-cell" onClick={() => openLightbox(i)}>
          <img src={asset.thumbnailUrl || asset.url} alt="" loading="lazy" />
          <div className="photo-cell-overlay">
            <span style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.7, color: 'var(--cream)', fontFamily: "'Cormorant Garamond', serif" }}>View</span>
          </div>
        </div>
      ));
    }

    return classicImages.map((item, i) => (
      <div key={item.imageId._id} className="photo-cell" onClick={() => openLightbox(i)}>
        <img src={`/${item.imageId.path}`} alt={item.imageId.caption || ''} loading="lazy" />
        {item.imageId.caption && (
          <div className="photo-cell-overlay">
            <span style={{ fontSize: 12, opacity: 0.7, color: 'var(--cream)', fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>{item.imageId.caption}</span>
          </div>
        )}
      </div>
    ));
  };

  const photoCount = lrPhotos.length || cloudAssets.length || classicImages.length;

  return (
    <div style={{ background: 'var(--ink)', color: 'var(--cream)', minHeight: '100vh' }}>

      {/* ── GALLERY HEADER ── */}
      <div style={{ paddingTop: 'var(--nav-h)' }}>
        <div style={{ padding: '70px 80px 50px', borderBottom: '1px solid rgba(245,240,232,0.07)', maxWidth: 1400, margin: '0 auto' }}>
          <Link to="/galleries" style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.3, fontFamily: "'Cormorant Garamond', serif", display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28, transition: 'opacity 0.3s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = 0.7}
            onMouseLeave={e => e.currentTarget.style.opacity = 0.3}
          >
            ← All Galleries
          </Link>
          <div className="fade-up">
            <p className="label-sm" style={{ marginBottom: 14 }}>
              {gallery.missionId?.location || 'Iceland'} {gallery.missionId?.startDate ? `· ${new Date(gallery.missionId.startDate).getFullYear()}` : ''}
            </p>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(32px, 5vw, 62px)', lineHeight: 0.95, letterSpacing: '-2px', marginBottom: 22 }}>
              {gallery.title}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ width: 32, height: 1, background: 'var(--gold)', opacity: 0.5 }} />
              {gallery.description && (
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 16, opacity: 0.45, maxWidth: 560 }}>
                  {gallery.description}
                </p>
              )}
              <span style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.2, fontFamily: "'Cormorant Garamond', serif", marginLeft: 'auto' }}>
                {photoCount} {photoCount === 1 ? 'photograph' : 'photographs'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── PHOTO GRID ── */}
      <section style={{ padding: '40px 0' }}>
        {photoCount === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p className="label-sm">No photographs published in this gallery yet</p>
          </div>
        ) : (
          <div className="photo-grid" style={{ padding: '0 3px', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {renderGrid()}
          </div>
        )}
      </section>

      {/* Lightbox */}
      {lbOpen && (
        <Lightbox
          images={images.filter(i => i.url)}
          currentIndex={lbIndex}
          onNavigate={setLbIndex}
          onClose={() => setLbOpen(false)}
        />
      )}

      <Footer />
    </div>
  );
}
