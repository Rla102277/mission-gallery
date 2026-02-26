import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { getApiUrl } from '../lib/api';
import { getValidLightroomAccessToken, getLightroomMetadata } from '../lib/lightroomAuth';
import Lightbox from '../components/Lightbox';
import Footer from '../components/Footer';

// ── HELPERS ──────────────────────────────────────────────────────────────────

function stripWhile(text) {
  if (!text || !text.trim().startsWith('while')) return text;
  const idx = text.indexOf('{', text.indexOf('{') + 1);
  return idx > 0 ? text.substring(idx) : text;
}

// Build a proxied thumbnail URL using the backend /api/adobe/image-proxy endpoint
// This avoids CORS issues — the server fetches from Adobe using the stored token
function buildProxyUrl(href, catalogId, token) {
  if (!href || !token) return null;
  const baseUrl = `https://lr.adobe.io/v2/catalogs/${catalogId}`;
  const fullUrl = `${baseUrl}${href}`;
  return getApiUrl(`/api/adobe/image-proxy?url=${encodeURIComponent(fullUrl)}&token=${encodeURIComponent(token)}`);
}

// ── COMPONENT ─────────────────────────────────────────────────────────────────

export default function PublicGallery() {
  const { slug } = useParams();
  const [gallery, setGallery]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [photos, setPhotos]       = useState([]);   // unified photo list
  const [lbIndex, setLbIndex]     = useState(null);  // null = closed

  // ── Fetch gallery metadata ─────────────────────────────────────────────────
  useEffect(() => {
    api.get(`/api/galleries/public/${slug}`)
      .then(async r => {
        setGallery(r.data);

        if (r.data.lightroomAlbum?.id) {
          await fetchLightroomPhotos(r.data);
        } else if (r.data.cloudinaryAssets?.length) {
          setPhotos(r.data.cloudinaryAssets.map(a => ({
            id: a.publicId,
            thumbUrl: a.thumbnailUrl || a.secureUrl || a.url,
            fullUrl:  a.secureUrl    || a.url,
            title:    a.publicId?.split('/').pop() || '',
          })));
        } else if (r.data.images?.length) {
          const publicImgs = r.data.images.filter(i => i.imageId?.isPublic);
          setPhotos(publicImgs.map(i => ({
            id:       i.imageId._id,
            thumbUrl: `/${i.imageId.thumbnailPath || i.imageId.path}`,
            fullUrl:  `/${i.imageId.path}`,
            title:    i.imageId.caption || i.imageId.filename || '',
          })));
        }
      })
      .catch(e => { console.error(e); setError('Gallery not found or is private.'); })
      .finally(() => setLoading(false));
  }, [slug]);

  // ── Fetch Lightroom album assets ───────────────────────────────────────────
  const fetchLightroomPhotos = useCallback(async (g) => {
    try {
      // Try stored token — refresh if expired
      const token = await getValidLightroomAccessToken();
      if (!token) {
        console.warn('No Lightroom token — images require Lightroom authentication');
        return;
      }

      const { id: albumId, catalogId } = g.lightroomAlbum;
      const url = `https://lr.adobe.io/v2/catalogs/${catalogId}/albums/${albumId}/assets?embed=asset&subtype=image&limit=500`;
      const resp = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-API-Key': import.meta.env.VITE_ADOBE_CLIENT_ID,
        },
      });

      const raw  = await resp.text();
      const data = JSON.parse(stripWhile(raw));
      const all  = data.resources || [];

      // Filter to only whitelisted photos stored on gallery
      const visible = (g.visibleLightroomPhotos || []);
      const filtered = visible.length > 0
        ? all.filter(p => visible.includes(p.id))
        : all;

      setPhotos(filtered.map(p => {
        const thumbHref = p.asset?.links?.['/rels/rendition_type/thumbnail2x']?.href;
        const fullHref  = p.asset?.links?.['/rels/rendition_type/2048']?.href
                       || p.asset?.links?.['/rels/rendition_type/1280']?.href;
        return {
          id:       p.id,
          thumbUrl: buildProxyUrl(thumbHref, catalogId, token),
          fullUrl:  buildProxyUrl(fullHref,  catalogId, token),
          title:    p.asset?.payload?.importSource?.fileName || '',
        };
      }).filter(p => p.thumbUrl));
    } catch (err) {
      console.error('Lightroom fetch error:', err);
    }
  }, []);

  // ── Lightbox data ──────────────────────────────────────────────────────────
  const lbImages = photos.map(p => ({ url: p.fullUrl || p.thumbUrl, title: p.title }));

  // ── Loading / error ────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, background:'var(--ink)' }}>
      <div className="tia-spinner" />
      <p className="label-xs">Loading gallery</p>
    </div>
  );

  if (error || !gallery) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'var(--ink)', textAlign:'center', padding:40 }}>
      <p style={{ fontFamily:"'Playfair Display',serif", fontStyle:'italic', fontSize:28, opacity:0.4 }}>Gallery not found</p>
      <p className="label-xs" style={{ marginTop:8 }}>{error}</p>
      <Link to="/galleries" className="btn-tia" style={{ marginTop:20 }}>← All Galleries</Link>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background:'var(--ink)', color:'var(--cream)', minHeight:'100vh' }}>

      {/* Header */}
      <div className="page-top">
        <div className="pg-hd">
          <Link to="/galleries" className="label-xs" style={{ opacity:0.38, transition:'opacity 0.2s', display:'inline-block', marginBottom:24 }}
            onMouseEnter={e => e.currentTarget.style.opacity='0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity='0.38'}>
            ← All Galleries
          </Link>

          {gallery.missionId?.location && (
            <p className="fade-up label-xs" style={{ marginBottom:14 }}>{gallery.missionId.location}</p>
          )}

          <h1 className="fade-up d1" style={{ fontFamily:"'Playfair Display',serif", fontStyle:'italic', fontWeight:400, fontSize:'clamp(32px,5vw,64px)', lineHeight:0.94, letterSpacing:'-1.5px', marginBottom:20 }}>
            {gallery.title}
          </h1>

          {gallery.description && (
            <div className="fade-up d2" style={{ display:'flex', alignItems:'flex-start', gap:20, maxWidth:700 }}>
              <div className="rule-gold" style={{ flexShrink:0, marginTop:10 }} />
              <p style={{ fontStyle:'italic', fontSize:17, lineHeight:1.78, opacity:0.48 }}>{gallery.description}</p>
            </div>
          )}

          <p className="fade-up d3" style={{ marginTop:24, fontSize:10, letterSpacing:4, textTransform:'uppercase', opacity:0.24 }}>
            {photos.length > 0 ? `${photos.length} photographs` : (gallery.lightroomAlbum ? 'Lightroom album' : 'No photographs yet')}
            {gallery.lightroomAlbum && photos.length === 0 && (
              <span style={{ marginLeft:16, color:'var(--gold)' }}>— requires Lightroom sign-in</span>
            )}
          </p>
        </div>
      </div>

      {/* Photo grid */}
      <section style={{ padding:'32px 0 0' }}>
        {photos.length > 0 ? (
          <div className="photo-grid" style={{ padding:'0 3px' }}>
            {photos.map((p, i) => (
              <div key={p.id}
                className="photo-cell"
                onClick={() => setLbIndex(i)}>
                <img
                  src={p.thumbUrl}
                  alt={p.title}
                  loading="lazy"
                />
                <div className="photo-overlay">
                  <span className="label-xs" style={{ color:'var(--cream)' }}>View</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <p className="label-xs">
              {gallery.lightroomAlbum
                ? 'Lightroom images require authentication — sign into Lightroom in Admin first'
                : 'No photographs have been added yet'}
            </p>
          </div>
        )}
      </section>

      {/* Lightbox */}
      {lbIndex !== null && (
        <Lightbox
          images={lbImages}
          currentIndex={lbIndex}
          onNavigate={setLbIndex}
          onClose={() => setLbIndex(null)}
        />
      )}

      <Footer />
    </div>
  );
}
