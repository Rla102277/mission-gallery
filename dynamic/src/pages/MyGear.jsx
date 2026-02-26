import { useState, useEffect } from 'react';
import api from '../lib/api';
import Footer from '../components/Footer';

export default function MyGear() {
  const [gear, setGear] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/gear/published')
      .then(r => { if (r.data) setGear(r.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--ink)' }}>
      <div className="tia-spinner" />
    </div>
  );

  return (
    <div style={{ background:'var(--ink)', color:'var(--cream)', minHeight:'100vh' }}>
      <div className="page-top">
        <div className="pg-hd">
          <p className="fade-up label-xs" style={{ marginBottom:18 }}>The Kit</p>
          <h1 className="fade-up d1" style={{ fontFamily:"'Playfair Display',serif", fontStyle:'italic', fontWeight:400, fontSize:'clamp(34px,5vw,66px)', lineHeight:0.93, letterSpacing:'-1.5px', marginBottom:22 }}>
            My <strong style={{ fontWeight:900, fontStyle:'normal' }}>Gear</strong>
          </h1>
          <div className="fade-up d2" style={{ display:'flex', alignItems:'center', gap:18 }}>
            <div className="rule-gold" />
            <p style={{ fontStyle:'italic', fontSize:15, opacity:0.36 }}>The tools that capture beyond the daydream</p>
          </div>
        </div>
      </div>

      <div className="pg-bd">
        {gear?.refinedContent ? (
          <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', gap:60, alignItems:'start' }}>
            <div className="fade-up" style={{ position:'sticky', top:'calc(var(--nav-h) + 40px)' }}>
              <div className="rule-gold" style={{ marginBottom:24 }} />
              <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                {[
                  ['Body',     'Fujifilm GFX 100S'],
                  ['Body',     'Fujifilm X-T5'],
                  ['System',   'Fujifilm GFX / X'],
                  ['Updated',  gear.updatedAt ? new Date(gear.updatedAt).toLocaleDateString('en-US',{year:'numeric',month:'long'}) : '—'],
                ].map(([k,v],i) => (
                  <div key={i}>
                    <p className="label-xs" style={{ marginBottom:4 }}>{k}</p>
                    <p style={{ fontSize:14, opacity:0.55, lineHeight:1.55 }}>{v}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="fade-up d2" style={{ fontSize:17, lineHeight:1.88, opacity:0.58, whiteSpace:'pre-wrap' }}>
              {gear.refinedContent}
            </div>
          </div>
        ) : (
          <div style={{ textAlign:'center', padding:'80px 0' }}>
            <div className="rule-gold" style={{ margin:'0 auto 24px' }} />
            <p style={{ fontFamily:"'Playfair Display',serif", fontStyle:'italic', fontSize:24, opacity:0.28 }}>Gear list coming soon</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
