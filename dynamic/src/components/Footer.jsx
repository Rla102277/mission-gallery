import { Link } from 'react-router-dom';
export default function Footer() {
  return (
    <footer className="tia-footer">
      <div style={{ fontSize:10, letterSpacing:3, textTransform:'uppercase', opacity:0.15, lineHeight:2.4, fontFamily:"'Cormorant Garamond',serif" }}>
        <div>The Infinite Arch</div>
        <div>Fine Art Photography</div>
        <div>© {new Date().getFullYear()} Randy Allen</div>
      </div>
      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
        <div className="rule-gold" />
        <p className="footer-quote">"Beyond the Daydream"</p>
        <p style={{ fontSize:9, letterSpacing:4, textTransform:'uppercase', opacity:0.14, fontFamily:"'Cormorant Garamond',serif" }}>Fujifilm GFX · Iceland 2026</p>
      </div>
      <div style={{ textAlign:'right', fontSize:10, letterSpacing:3, textTransform:'uppercase', opacity:0.15, lineHeight:2.8, fontFamily:"'Cormorant Garamond',serif" }}>
        {[['/galleries','Galleries'],['/about','About'],['/gear','Gear']].map(([p,l]) => (
          <div key={p}><Link to={p}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.65'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            style={{ transition:'opacity 0.2s' }}>{l}</Link></div>
        ))}
      </div>
    </footer>
  );
}
