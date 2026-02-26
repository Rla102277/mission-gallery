import axios from 'axios';

const normalizedBaseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

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

export default api;
