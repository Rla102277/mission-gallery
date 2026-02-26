import { createContext, useContext, useState, useEffect } from 'react';
import api, { getAuthUrl, getConfiguredApiBaseUrl, getConfiguredAuthBaseUrl } from '../lib/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [backendHealthy, setBackendHealthy] = useState(null);

  const apiBaseUrl = getConfiguredApiBaseUrl();
  const authBaseUrl = getConfiguredAuthBaseUrl();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const oauthError = urlParams.get('error');

    if (token) {
      localStorage.setItem('authToken', token);
      setAuthError('');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (oauthError) {
      const message = oauthError === 'oauth_failed'
        ? 'Google login failed. Confirm OAuth redirect URLs and backend environment settings.'
        : 'Login was cancelled or failed. Please try again.';
      setAuthError(message);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    checkAuth();
  }, []);

  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    const healthPaths = apiBaseUrl ? ['/health'] : ['/api/health', '/health'];

    try {
      let isHealthy = false;

      for (const path of healthPaths) {
        try {
          await api.get(path);
          isHealthy = true;
          break;
        } catch (error) {
          // Try the next candidate path.
        }
      }

      if (!isHealthy) {
        throw new Error('Backend health check failed');
      }

      setBackendHealthy(true);
      return true;
    } catch (error) {
      setBackendHealthy(false);
      return false;
    }
  };

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      const response = await api.get('/auth/user', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUser(response.data.user);
      setAuthError('');
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('authToken');
      setUser(null);
      if (error?.response?.status !== 401) {
        setAuthError('Unable to reach authentication service. Check backend URL and CORS settings.');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    setAuthError('');
    const healthy = await checkBackendHealth();

    if (!healthy) {
      setAuthError('Backend is unreachable. Set VITE_API_URL to your live backend (/api) and redeploy frontend.');
      return;
    }

    window.location.href = getAuthUrl('/auth/google');
  };

  const logout = async () => {
    localStorage.removeItem('authToken');
    setUser(null);
    setAuthError('');
    window.location.href = '/';
  };

  const value = {
    user,
    loading,
    authError,
    backendHealthy,
    apiBaseUrl,
    authBaseUrl,
    checkBackendHealth,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
