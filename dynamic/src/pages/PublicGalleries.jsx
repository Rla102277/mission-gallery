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
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, background:'var(--ink)' }}>
      <div className="tia-spinner" />
      <p className="label-xs">Loading</p>
    </div>
  );

  return (
    <div style={{ background:'var(--ink)', color:'var(--cream)', minHeight:'100vh' }}>
      <div className="page-top">
        <div className="pg-hd">
          <p className="fade-up label-xs" style={{ marginBottom:16 }}>Beyond the Daydream</p>
          <h1 className="fade-up d1" style={{ fontFamily:"'Playfair Display',serif", fontStyle:'italic', fontWeight:400, fontSize:'clamp(36px,5.5vw,70px)', lineHeight:0.93, letterSpacing:'-2px', marginBottom:22 }}>
            The <strong style={{ fontWeight:900, fontStyle:'normal' }}>Galleries</strong>
          </h1>
          <div className="fade-up d2" style={{ display:'flex', alignItems:'center', gap:18 }}>
            <div className="rule-gold" />
            <p style={{ fontStyle:'italic', fontSize:16, opacity:0.38 }}>
              {galleries.length} {galleries.length === 1 ? 'collection' : 'collections'} published
            </p>
          </div>
        </div>
      </div>

      <section style={{ padding:'48px 0 0' }}>
        {galleries.length === 0 ? (
          <div style={{ textAlign:'center', padding:'90px 0' }}>
            <p className="label-xs">No galleries published yet — check back soon</p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(360px,1fr))', gap:3, padding:'0 3px' }}>
            {galleries.map((g, i) => {
              const thumb = g.cloudinaryAssets?.[0]?.thumbnailUrl || g.heroImage?.thumbnailUrl || null;
              return (
                <div key={g._id}
                  className={`fade-up d${Math.min(i+1,4)}`}
                  onClick={() => navigate(`/gallery/${g.slug}`)}
                  style={{ position:'relative', aspectRatio:'4/3', background:'rgba(245,240,232,0.03)', border:'1px solid rgba(245,240,232,0.07)', overflow:'hidden', cursor:'pointer', transition:'border-color 0.3s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(245,240,232,0.24)'; const img=e.currentTarget.querySelector('img'); if(img) img.style.transform='scale(1.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(245,240,232,0.07)'; const img=e.currentTarget.querySelector('img'); if(img) img.style.transform='none'; }}>
                  {thumb && (
                    <img src={thumb} alt={g.title}
                      style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)' }} />
                  )}
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.14) 55%,transparent 100%)' }} />
                  <div style={{ position:'absolute', inset:0, padding:'20px 24px', display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
                    <div className="rule-gold" style={{ width:20, marginBottom:10 }} />
                    <h3 style={{ fontFamily:"'Playfair Display',serif", fontStyle:'italic', fontWeight:400, fontSize:22, lineHeight:1.15, marginBottom:7, color:'var(--cream)' }}>{g.title}</h3>
                    {g.description && (
                      <p style={{ fontSize:13, opacity:0.4, lineHeight:1.5, marginBottom:9, color:'var(--cream)', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{g.description}</p>
                    )}
                    <span className="label-xs" style={{ color:'var(--cream)' }}>
                      {g.lightroomAlbum ? 'Lightroom' : `${g.images?.length || 0} photographs`}
                      {g.isPortfolio && <span style={{ color:'var(--gold)', marginLeft:12 }}>Portfolio</span>}
                    </span>
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
