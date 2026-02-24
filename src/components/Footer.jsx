import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="tia-footer">
      <div style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.18, lineHeight: 2.2, fontFamily: "'Cormorant Garamond', serif" }}>
        <div>The Infinite Arch</div>
        <div>Fine Art Photography</div>
        <div>© {new Date().getFullYear()}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 40, height: 1, background: 'var(--gold)', opacity: 0.4 }} />
        <p className="footer-quote">
          "Beyond the Daydream"
        </p>
        <p style={{ fontSize: 9, letterSpacing: 4, textTransform: 'uppercase', opacity: 0.18, fontFamily: "'Cormorant Garamond', serif" }}>
          Randy Allen &middot; Fujifilm GFX
        </p>
      </div>

      <div style={{ textAlign: 'right', fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.18, lineHeight: 2.2, fontFamily: "'Cormorant Garamond', serif" }}>
        <Link to="/galleries" style={{ display: 'block', transition: 'opacity 0.3s' }} onMouseEnter={e => e.target.style.opacity = 0.6} onMouseLeave={e => e.target.style.opacity = 0.18}>Galleries</Link>
        <Link to="/about" style={{ display: 'block', transition: 'opacity 0.3s' }} onMouseEnter={e => e.target.style.opacity = 0.6} onMouseLeave={e => e.target.style.opacity = 0.18}>About</Link>
        <Link to="/gear" style={{ display: 'block', transition: 'opacity 0.3s' }} onMouseEnter={e => e.target.style.opacity = 0.6} onMouseLeave={e => e.target.style.opacity = 0.18}>Gear</Link>
      </div>
    </footer>
  );
}
