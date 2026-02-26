import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, login, authError, backendHealthy, checkBackendHealth, apiBaseUrl, authBaseUrl } = useAuth();
  const navigate = useNavigate();
  const [isCheckingBackend, setIsCheckingBackend] = useState(false);

  useEffect(() => {
    if (user) navigate('/admin');
  }, [user, navigate]);

  const handleRetryBackendCheck = async () => {
    setIsCheckingBackend(true);
    await checkBackendHealth();
    setIsCheckingBackend(false);
  };

  const backendStateLabel = backendHealthy === null
    ? 'Checking backend...'
    : backendHealthy
      ? 'Backend connected'
      : 'Backend unreachable';

  const backendStateColor = backendHealthy
    ? 'rgba(118, 191, 129, 0.95)'
    : 'rgba(222, 111, 111, 0.95)';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 420, maxWidth: '92vw', textAlign: 'center' }}>
        {/* Wordmark */}
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', marginBottom: 52 }}>
          <div style={{ width: 1, height: 48, background: 'rgba(245,240,232,0.15)', marginBottom: 24 }} />
          <p style={{ fontSize: 9, letterSpacing: 6, textTransform: 'uppercase', opacity: 0.25, fontFamily: "'Cormorant Garamond', serif", marginBottom: 4 }}>The</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontStyle: 'italic', fontSize: 13, letterSpacing: 3, opacity: 0.45, marginBottom: 2 }}>Infinite</p>
          <p style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, fontSize: 42, letterSpacing: '-1px', lineHeight: 0.88 }}>ARCH</p>
          <div style={{ width: 80, height: 1, background: 'rgba(245,240,232,0.15)', marginTop: 16 }} />
        </div>

        <p className="label-sm" style={{ marginBottom: 22 }}>Admin Access</p>

        <div
          style={{
            border: `1px solid ${backendStateColor}`,
            background: 'rgba(245,240,232,0.04)',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            textAlign: 'left',
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', opacity: 0.7 }}>Connection</p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: backendStateColor }}>{backendStateLabel}</p>
          </div>
          <button
            onClick={handleRetryBackendCheck}
            disabled={isCheckingBackend}
            style={{
              border: '1px solid rgba(245,240,232,0.25)',
              background: 'transparent',
              color: 'var(--cream)',
              padding: '8px 10px',
              borderRadius: 8,
              fontSize: 11,
              letterSpacing: 1,
              cursor: 'pointer',
              opacity: isCheckingBackend ? 0.5 : 0.85,
            }}
          >
            {isCheckingBackend ? 'Checking' : 'Retry'}
          </button>
        </div>

        {authError && (
          <div
            style={{
              marginBottom: 14,
              border: '1px solid rgba(222,111,111,0.75)',
              background: 'rgba(222,111,111,0.12)',
              borderRadius: 10,
              padding: '12px 14px',
              textAlign: 'left',
            }}
          >
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.45 }}>{authError}</p>
          </div>
        )}

        <button
          onClick={login}
          className="btn-tia"
          style={{ width: '100%', justifyContent: 'center', padding: '16px 32px', fontSize: 11, letterSpacing: 5 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div style={{ marginTop: 22, textAlign: 'left', opacity: 0.55 }}>
          <p style={{ fontSize: 10, margin: 0, letterSpacing: 0.8 }}>API: {apiBaseUrl || 'Same-origin /api (not configured)'}</p>
          <p style={{ fontSize: 10, margin: '4px 0 0', letterSpacing: 0.8 }}>Auth: {authBaseUrl || 'Same-origin /auth (not configured)'}</p>
        </div>

        <p style={{ fontSize: 11, opacity: 0.25, marginTop: 16, fontFamily: "'Cormorant Garamond', serif", letterSpacing: 1 }}>
          Authorized access only
        </p>
      </div>
    </div>
  );
}
