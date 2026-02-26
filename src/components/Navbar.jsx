import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [solid, setSolid] = useState(false);
  const [mob, setMob] = useState(false);

  useEffect(() => {
    const fn = () => setSolid(window.scrollY > 30);
    window.addEventListener('scroll', fn, { passive: true });
    fn();
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => setMob(false), [pathname]);

  const isActive = (p) => pathname === p || (p !== '/' && pathname.startsWith(p));

  return (
    <>
      <nav className={`tia-nav${solid ? ' nav-solid' : ''}`}>
        {/* Wordmark */}
        <Link to="/" className="wordmark">
          <span className="wm-bar-top" />
          <span className="wm-bar-sub" />
          <span className="wm-the">The</span>
          <span className="wm-infinite">Infinite</span>
          <span className="wm-arch">ARCH</span>
          <span className="wm-bar-bottom" />
        </Link>

        {/* Desktop links */}
        <ul className="nav-links" style={{ display: 'flex' }}>
          {[
            ['/galleries', 'Galleries'],
            ['/about',     'About'],
            ['/gear',      'Gear'],
          ].map(([p, l]) => (
            <li key={p}><Link to={p} className={isActive(p) ? 'active' : ''}>{l}</Link></li>
          ))}
          {user && (
            <>
              <li><Link to="/admin" className={isActive('/admin') ? 'active' : ''}>Admin</Link></li>
              <li><button className="nav-btn" onClick={logout}>Sign Out</button></li>
            </>
          )}
        </ul>

        {/* Hamburger */}
        <button
          onClick={() => setMob(true)}
          className="mob-ham"
          aria-label="Open menu"
          style={{ display:'none', flexDirection:'column', gap:5, background:'none', border:'none', cursor:'pointer', padding:4 }}
        >
          {[0,1,2].map(i => <span key={i} style={{ display:'block', width:22, height:1, background:'var(--cream)', opacity:0.55 }} />)}
        </button>
      </nav>

      {/* Mobile fullscreen overlay */}
      {mob && (
        <div style={{ position:'fixed', inset:0, zIndex:800, background:'rgba(13,13,13,0.98)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:36 }}>
          <button
            onClick={() => setMob(false)}
            style={{ position:'absolute', top:22, right:24, fontSize:20, opacity:0.3, background:'none', border:'none', color:'var(--cream)', cursor:'pointer', padding:4 }}
          >✕</button>
          {[
            ['/galleries','Galleries'], ['/about','About'], ['/gear','Gear'],
            ...(user ? [['/admin','Admin']] : []),
          ].map(([p, l]) => (
            <Link key={p} to={p}
              style={{ fontFamily:"'Playfair Display',serif", fontStyle:'italic', fontSize:36, color:'var(--cream)', opacity: isActive(p) ? 1 : 0.4, transition:'opacity 0.2s' }}>
              {l}
            </Link>
          ))}
          {user && (
            <button onClick={() => { logout(); setMob(false); }}
              style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:10, letterSpacing:5, textTransform:'uppercase', opacity:0.28, background:'none', border:'none', color:'var(--cream)', cursor:'pointer', marginTop:8 }}>
              Sign Out
            </button>
          )}
        </div>
      )}

      <style>{`
        @media (max-width: 900px) {
          .nav-links  { display: none !important; }
          .mob-ham    { display: flex !important; }
        }
      `}</style>
    </>
  );
}
