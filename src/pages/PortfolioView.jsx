import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import Footer from '../components/Footer';

export default function PortfolioView() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/portfolios/public/${slug}`)
      .then(r => setPortfolio(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--ink)' }}>
      <div className="tia-spinner" />
    </div>
  );

  if (!portfolio) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'var(--ink)' }}>
      <p style={{ fontFamily:"'Playfair Display',serif", fontStyle:'italic', fontSize:28, opacity:0.35 }}>Portfolio not found</p>
      <Link to="/galleries" className="btn-tia" style={{ marginTop:16 }}>← Galleries</Link>
    </div>
  );

  return (
    <div style={{ background:'var(--ink)', color:'var(--cream)', minHeight:'100vh' }}>

      {/* Hero */}
      <div style={{ position:'relative', height:'60vh', minHeight:400, overflow:'hidden', display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
        {portfolio.heroImage?.url ? (
          <img src={portfolio.heroImage.url} alt={portfolio.title} style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover' }} />
        ) : (
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(155deg,#1a1a1e 0%,#0d0d0d 100%)' }} />
        )}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,0.9) 0%,rgba(0,0,0,0.3) 50%,transparent 100%)' }} />
        <div style={{ position:'relative', zIndex:2, padding:'0 80px 60px' }}>
          <p className="fade-up label-xs" style={{ marginBottom:14 }}>Portfolio</p>
          <h1 className="fade-up d1" style={{ fontFamily:"'Playfair Display',serif", fontStyle:'italic', fontWeight:400, fontSize:'clamp(36px,5.5vw,72px)', lineHeight:0.93, letterSpacing:'-2px', marginBottom:14 }}>
            {portfolio.title}
          </h1>
          {portfolio.subtitle && (
            <p className="fade-up d2" style={{ fontStyle:'italic', fontSize:16, opacity:0.45 }}>{portfolio.subtitle}</p>
          )}
        </div>
      </div>

      {/* About + Gear */}
      {(portfolio.aboutContent || portfolio.gearSummary) && (
        <div className="pg-bd">
          <div style={{ display:'grid', gridTemplateColumns: portfolio.aboutContent && portfolio.gearSummary ? '1fr 1fr' : '1fr', gap:48 }}>
            {portfolio.aboutContent && (
              <div className="fade-up" style={{ background:'rgba(245,240,232,0.03)', border:'1px solid rgba(245,240,232,0.08)', padding:32 }}>
                <div className="rule-gold" style={{ marginBottom:18 }} />
                <p className="label-xs" style={{ marginBottom:14 }}>About</p>
                <p style={{ fontSize:16, lineHeight:1.82, opacity:0.55 }}>{portfolio.aboutContent}</p>
              </div>
            )}
            {portfolio.gearSummary && (
              <div className="fade-up d2" style={{ background:'rgba(245,240,232,0.03)', border:'1px solid rgba(245,240,232,0.08)', padding:32 }}>
                <div className="rule-gold" style={{ marginBottom:18 }} />
                <p className="label-xs" style={{ marginBottom:14 }}>Gear</p>
                <p style={{ fontSize:16, lineHeight:1.82, opacity:0.55 }}>{portfolio.gearSummary}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Galleries */}
      {portfolio.galleries?.length > 0 && (
        <div className="pg-bd" style={{ paddingTop:0 }}>
          <p className="label-xs" style={{ marginBottom:32 }}>Featured Galleries</p>
          <div style={{ display:'flex', flexDirection:'column', gap:48 }}>
            {portfolio.galleries.map(g => (
              <div key={g._id} className="fade-up">
                <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:16 }}>
                  <h3 style={{ fontFamily:"'Playfair Display',serif", fontStyle:'italic', fontWeight:400, fontSize:26 }}>{g.title}</h3>
                  <Link to={`/gallery/${g.slug}`} className="label-xs" style={{ opacity:0.35 }}>View Gallery →</Link>
                </div>
                {g.description && <p style={{ fontSize:15, opacity:0.42, marginBottom:18, maxWidth:600 }}>{g.description}</p>}
                {/* Preview strip */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:2 }}>
                  {(g.cloudinaryAssets?.slice(0,6) || []).map((a,i) => (
                    <div key={i} onClick={() => navigate(`/gallery/${g.slug}`)} style={{ aspectRatio:'1', overflow:'hidden', cursor:'pointer', background:'rgba(245,240,232,0.04)' }}>
                      <img src={a.thumbnailUrl || a.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.5s' }}
                        onMouseEnter={e => e.target.style.transform='scale(1.08)'}
                        onMouseLeave={e => e.target.style.transform='none'} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
