import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className={`tia-nav ${scrolled ? 'solid' : 'transparent'}`}>
        {/* Wordmark */}
        <Link to="/">
          <div className="wordmark">
            <span className="wm-r-heavy" />
            <span className="wm-r-thin" />
            <span className="wm-the">The</span>
            <span className="wm-infinite">Infinite</span>
            <span className="wm-arch">ARCH</span>
            <span className="wm-r-bot" />
          </div>
        </Link>

        {/* Desktop links */}
        <ul className="nav-links hidden md:flex">
          <li><Link to="/galleries" className={isActive('/galleries') ? 'active' : ''}>Galleries</Link></li>
          <li><Link to="/about" className={isActive('/about') ? 'active' : ''}>About</Link></li>
          <li><Link to="/gear" className={isActive('/gear') ? 'active' : ''}>Gear</Link></li>
          {user ? (
            <>
              <li><Link to="/admin" className={location.pathname.startsWith('/admin') ? 'active' : ''}>Admin</Link></li>
              <li>
                <button
                  onClick={logout}
                  style={{ fontSize: '10px', letterSpacing: '4px', textTransform: 'uppercase', opacity: 0.38, background: 'none', border: 'none', color: 'var(--cream)', cursor: 'pointer', transition: 'opacity 0.3s' }}
                  onMouseEnter={e => e.target.style.opacity = 0.85}
                  onMouseLeave={e => e.target.style.opacity = 0.38}
                >
                  Sign Out
                </button>
              </li>
            </>
          ) : null}
        </ul>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 cursor-pointer bg-transparent border-none p-1"
          onClick={() => setMobileOpen(true)}
        >
          <span style={{ display: 'block', width: 22, height: 1, background: 'var(--cream)', opacity: 0.6 }} />
          <span style={{ display: 'block', width: 22, height: 1, background: 'var(--cream)', opacity: 0.6 }} />
          <span style={{ display: 'block', width: 22, height: 1, background: 'var(--cream)', opacity: 0.6 }} />
        </button>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 800,
            background: 'rgba(13,13,13,0.98)',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 36
          }}
        >
          <button
            onClick={() => setMobileOpen(false)}
            style={{ position: 'absolute', top: 28, right: 28, fontSize: 22, opacity: 0.3, background: 'none', border: 'none', color: 'var(--cream)', cursor: 'pointer' }}
          >
            ✕
          </button>
          {[
            ['/galleries', 'Galleries'],
            ['/about', 'About'],
            ['/gear', 'Gear'],
            ...(user ? [['/admin', 'Admin']] : []),
          ].map(([path, label]) => (
            <Link
              key={path}
              to={path}
              style={{
                fontFamily: "'Playfair Display', serif",
                fontStyle: 'italic',
                fontSize: 34,
                opacity: isActive(path) ? 1 : 0.45,
                color: 'var(--cream)',
              }}
            >
              {label}
            </Link>
          ))}
          {user && (
            <button
              onClick={() => { logout(); setMobileOpen(false); }}
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, letterSpacing: 5, textTransform: 'uppercase', opacity: 0.3, background: 'none', border: 'none', color: 'var(--cream)', cursor: 'pointer', marginTop: 8 }}
            >
              Sign Out
            </button>
          )}
        </div>
      )}
    </>
  );
}
