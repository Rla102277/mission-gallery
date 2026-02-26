import api from './api';

const STORAGE_KEY = 'adobe_lightroom_auth';
const LEGACY_TOKEN_KEY = 'adobe_lightroom_token';
const METADATA_KEY = 'adobe_lightroom_metadata';

const isBrowser = () => typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

export const getStoredLightroomAuth = () => {
  if (!isBrowser()) return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Failed to parse Lightroom auth from storage', error);
    return null;
  }
};

export const setLightroomCatalogInfo = ({ catalogId, baseUrl }) => {
  const metadata = {};
  if (catalogId) {
    metadata.catalogId = catalogId;
  }
  if (baseUrl) {
    metadata.baseUrl = baseUrl;
  }
  saveLightroomMetadata(metadata);
};

export const getLightroomCatalogId = () => getLightroomMetadata()?.catalogId || null;

export const getLightroomBaseUrl = () => {
  const metadata = getLightroomMetadata();
  if (metadata?.baseUrl) {
    return metadata.baseUrl.replace(/\/$/, '');
  }
  if (metadata?.catalogId) {
    return `https://lr.adobe.io/v2/catalogs/${metadata.catalogId}`;
  }
  return null;
};

export const saveLightroomMetadata = (metadata = {}) => {
  if (!isBrowser()) return;
  const existing = getLightroomMetadata() || {};
  window.localStorage.setItem(METADATA_KEY, JSON.stringify({ ...existing, ...metadata, updatedAt: Date.now() }));
};

export const getLightroomMetadata = () => {
  if (!isBrowser()) return null;
  try {
    const value = window.localStorage.getItem(METADATA_KEY);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Failed to parse Lightroom metadata from storage', error);
    return null;
  }
};

export const saveLightroomAuth = (tokenData = {}) => {
  if (!isBrowser() || !tokenData) return;

  const existing = getStoredLightroomAuth() || {};
  const expiresInSeconds = tokenData.expires_in || tokenData.expiresIn;
  const expiresAt = expiresInSeconds
    ? Date.now() + Math.max(expiresInSeconds - 60, 30) * 1000 // refresh 1 min early
    : existing.expiresAt || Date.now() + 5 * 60 * 1000;

  const payload = {
    accessToken: tokenData.access_token || existing.accessToken,
    refreshToken: tokenData.refresh_token || existing.refreshToken,
    tokenType: tokenData.token_type || existing.tokenType,
    scope: tokenData.scope || existing.scope,
    expiresAt,
    receivedAt: Date.now(),
  };

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  if (payload.accessToken) {
    window.localStorage.setItem(LEGACY_TOKEN_KEY, payload.accessToken);
  }
};

export const clearLightroomAuth = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
  window.localStorage.removeItem(METADATA_KEY);
};

export const getStoredLightroomToken = () => {
  const auth = getStoredLightroomAuth();
  return auth?.accessToken || null;
};

export const getStoredLightroomRefreshToken = () => {
  const auth = getStoredLightroomAuth();
  return auth?.refreshToken || null;
};

export const getStoredLightroomExpiry = () => {
  const auth = getStoredLightroomAuth();
  return auth?.expiresAt || null;
};

export const getStoredLightroomAccessToken = () => {
  const auth = getStoredLightroomAuth();
  if (!auth) return null;
  if (!auth.expiresAt || auth.expiresAt > Date.now()) {
    return auth.accessToken;
  }
  return null;
};

export const getValidLightroomAccessToken = async () => {
  if (!isBrowser()) return null;
  const auth = getStoredLightroomAuth();
  if (!auth?.accessToken) {
    return null;
  }

  if (!auth.expiresAt || auth.expiresAt > Date.now()) {
    return auth.accessToken;
  }

  if (!auth.refreshToken) {
    clearLightroomAuth();
    return null;
  }

  try {
    const response = await api.post('/api/adobe/refresh-token', {
      refreshToken: auth.refreshToken,
    });

    const refreshedData = {
      ...response.data,
      refresh_token: response.data.refresh_token || auth.refreshToken,
    };

    saveLightroomAuth(refreshedData);
    return refreshedData.access_token;
  } catch (error) {
    console.error('Failed to refresh Lightroom token', error);
    clearLightroomAuth();
    return null;
  }
};
