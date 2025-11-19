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
