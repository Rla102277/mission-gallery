import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const SERIES = [
  { n:'01', t:'Solitude & Scale' },
  { n:'02', t:'Glacial Contrasts' },
  { n:'03', t:'Blue Trilogy' },
  { n:'04', t:'Coastal Contrasts' },
  { n:'05', t:'The Human Element' },
  { n:'06', t:'Arnarstapi Geometry' },
  { n:'07', t:'Peninsular Panorama' },
  { n:'08', t:'Urban Odyssey' },
];

export default function Home() {
  return (
    <div style={{ background:'var(--ink)', color:'var(--cream)', minHeight:'100vh' }}>

      {/* ── HERO ── */}
      <section style={{ position:'relative', height:'100vh', minHeight:640, display:'flex', flexDirection:'column', justifyContent:'flex-end', overflow:'hidden' }}>
        {/* Background - swap this div for an <img> when you have a hero photo */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(155deg,#1e1e22 0%,#141416 40%,#0a0a0c 100%)' }}>
          <p style={{ position:'absolute', bottom:'48%', left:'50%', transform:'translateX(-50%)', fontSize:9, letterSpacing:5, textTransform:'uppercase', opacity:0.1, fontFamily:"'Cormorant Garamond',serif", whiteSpace:'nowrap' }}>
            Add hero image here
          </p>
        </div>
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.2) 45%,transparent 70%)' }} />

        <div style={{ position:'relative', zIndex:2, padding:'0 80px 92px', maxWidth:900 }}>
          <p className="fade-up label-xs" style={{ marginBottom:18, opacity:0.4 }}>Beyond the Daydream</p>
          <h1 className="fade-up d1" style={{ fontFamily:"'Playfair Display',serif", fontStyle:'italic', fontWeight:400, fontSize:'clamp(52px,8vw,96px)', lineHeight:0.92, letterSpacing:'-2px', marginBottom:28 }}>
            The Infinite<br/><strong style={{ fontWeight:900, fontStyle:'normal' }}>Arch</strong>
          </h1>
          <div className="fade-up d2" style={{ display:'flex', alignItems:'center', gap:20, marginBottom:44 }}>
            <div className="rule-gold" />
            <p style={{ fontStyle:'italic', fontSize:17, letterSpacing:1.5, opacity:0.48 }}>Fine art landscape photography — Iceland 2026</p>
          </div>
          <div className="fade-up d3" style={{ display:'flex', gap:14, flexWrap:'wrap' }}>
            <Link to="/galleries" className="btn-tia">View Galleries <span style={{opacity:0.4}}>→</span></Link>
            <Link to="/about"    className="btn-tia" style={{opacity:0.55}}>About the Work</Link>
          </div>
        </div>

        <div style={{ position:'absolute', bottom:28, right:56, display:'flex', flexDirection:'column', alignItems:'center', gap:7, opacity:0.18 }}>
          <span style={{ fontSize:8, letterSpacing:4, textTransform:'uppercase', fontFamily:"'Cormorant Garamond',serif" }}>Scroll</span>
          <div style={{ width:1, height:44, background:'var(--cream)' }} />
        </div>
      </section>

      {/* ── INTRO ── */}
      <section style={{ padding:'96px 80px', maxWidth:1400, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center' }}>
          <div className="fade-up">
            <p className="label-xs" style={{ marginBottom:20 }}>The Collection</p>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontStyle:'italic', fontWeight:400, fontSize:'clamp(30px,3.8vw,50px)', lineHeight:1.1, letterSpacing:'-1px', marginBottom:24 }}>
              Natural arches as<br/><strong style={{ fontWeight:900, fontStyle:'normal' }}>portals of transformation</strong>
            </h2>
            <div className="rule-gold" style={{ marginBottom:22 }} />
            <p style={{ fontSize:17, lineHeight:1.88, opacity:0.5, maxWidth:430 }}>
              Eight series from Iceland's elemental landscape — capturing the moments where volcanic stone, glacial light, and solitary scale converge into something beyond the ordinary.
            </p>
            <div style={{ marginTop:34 }}>
              <Link to="/galleries" className="btn-tia btn-gold">Explore All Series</Link>
            </div>
          </div>
          <div className="fade-up d2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:3 }}>
            {SERIES.slice(0,4).map(s => (
              <Link key={s.n} to="/galleries"
                style={{ position:'relative', aspectRatio:'4/3', background:'rgba(245,240,232,0.03)', border:'1px solid rgba(245,240,232,0.07)', display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:14, overflow:'hidden', transition:'border-color 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor='rgba(245,240,232,0.22)'}
                onMouseLeave={e => e.currentTarget.style.borderColor='rgba(245,240,232,0.07)'}>
                <div className="rule-gold" style={{ width:16, marginBottom:8 }} />
                <span className="label-xs" style={{ marginBottom:3 }}>Series {s.n}</span>
                <span style={{ fontFamily:"'Playfair Display',serif", fontStyle:'italic', fontSize:14, opacity:0.62 }}>{s.t}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div style={{ height:1, background:'var(--rule)', maxWidth:1240, margin:'0 auto 90px', padding:'0 80px' }} />

      {/* ── 8 SERIES ── */}
      <section style={{ padding:'0 80px 90px', maxWidth:1400, margin:'0 auto' }}>
        <div className="fade-up" style={{ textAlign:'center', marginBottom:52 }}>
          <p className="label-xs" style={{ marginBottom:14 }}>January 2026</p>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontWeight:900, fontSize:'clamp(26px,3.3vw,42px)', letterSpacing:'-1px', marginBottom:12 }}>Beyond the Daydream: Iceland</h2>
          <p style={{ fontStyle:'italic', fontSize:16, opacity:0.38 }}>429 photographs · Eight series · One elemental landscape</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:3 }}>
          {SERIES.map((s,i) => (
            <Link key={s.n} to="/galleries"
              className={`fade-up d${Math.min(i+1,4)}`}
              style={{ position:'relative', aspectRatio:'4/5', background:`hsl(${218+i*6},10%,${7+i}%)`, border:'1px solid rgba(245,240,232,0.06)', display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'16px 18px', transition:'border-color 0.3s, transform 0.4s', cursor:'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(245,240,232,0.22)'; e.currentTarget.style.transform='translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(245,240,232,0.06)'; e.currentTarget.style.transform='none'; }}>
              <div className="rule-gold" style={{ width:16, marginBottom:8 }} />
              <span className="label-xs" style={{ marginBottom:3 }}>{s.n}</span>
              <span style={{ fontFamily:"'Playfair Display',serif", fontStyle:'italic', fontSize:15, opacity:0.65 }}>{s.t}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── ABOUT CTA ── */}
      <section style={{ background:'rgba(245,240,232,0.02)', borderTop:'1px solid var(--rule)', borderBottom:'1px solid var(--rule)', padding:'90px 80px' }}>
        <div style={{ maxWidth:720, margin:'0 auto', textAlign:'center' }} className="fade-up">
          <p className="label-xs" style={{ marginBottom:22 }}>The Photographer</p>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontStyle:'italic', fontWeight:400, fontSize:'clamp(26px,3.5vw,44px)', lineHeight:1.1, marginBottom:24 }}>
            Moving beyond the postcard
          </h2>
          <div className="rule-gold" style={{ margin:'0 auto 24px' }} />
          <p style={{ fontSize:18, lineHeight:1.88, opacity:0.45, marginBottom:36 }}>
            Shooting with Fujifilm GFX medium format, I seek the contemplative quality in landscapes that most photographs overlook — the silence before the light changes, the arch that frames what lies beyond.
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/about"     className="btn-tia">Read My Story</Link>
            <Link to="/galleries" className="btn-tia btn-gold">Enter the Gallery</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
