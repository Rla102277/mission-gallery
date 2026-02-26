import axios from 'axios';

const normalizedBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const normalizedAuthBaseUrl = normalizedBaseUrl.endsWith('/api')
  ? normalizedBaseUrl.slice(0, -4)
  : normalizedBaseUrl;

axios.defaults.withCredentials = true;
if (normalizedBaseUrl) {
  axios.defaults.baseURL = normalizedBaseUrl;
}

const api = axios.create({
  baseURL: normalizedBaseUrl || undefined,
  withCredentials: true,
});

// Add JWT token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getApiUrl = (path = '') => {
  if (!normalizedBaseUrl) {
    return path || '';
  }
  if (!path) {
    return normalizedBaseUrl;
  }
  return `${normalizedBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export const getAuthUrl = (path = '') => {
  if (!normalizedAuthBaseUrl) {
    return path || '';
  }
  if (!path) {
    return normalizedAuthBaseUrl;
  }
  return `${normalizedAuthBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export const getConfiguredApiBaseUrl = () => normalizedBaseUrl;
export const getConfiguredAuthBaseUrl = () => normalizedAuthBaseUrl;

export default api;
