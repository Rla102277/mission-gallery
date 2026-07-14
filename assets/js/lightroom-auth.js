// Lightroom auth token store with auto-refresh (vanilla port of old lightroomAuth.js)
(function () {
  var STORAGE_KEY = 'adobe_lightroom_auth';
  var METADATA_KEY = 'adobe_lightroom_metadata';

  function getStored() {
    try {
      var v = window.localStorage.getItem(STORAGE_KEY);
      return v ? JSON.parse(v) : null;
    } catch (e) { return null; }
  }

  function save(tokenData) {
    if (!tokenData) return;
    var existing = getStored() || {};
    var expiresIn = tokenData.expires_in || tokenData.expiresIn;
    var expiresAt = expiresIn
      ? Date.now() + Math.max(expiresIn - 60, 30) * 1000 // refresh ~1 min early
      : existing.expiresAt || Date.now() + 5 * 60 * 1000;
    var payload = {
      accessToken: tokenData.access_token || existing.accessToken,
      refreshToken: tokenData.refresh_token || existing.refreshToken,
      tokenType: tokenData.token_type || existing.tokenType,
      scope: tokenData.scope || existing.scope,
      expiresAt: expiresAt,
      receivedAt: Date.now()
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    return payload;
  }

  function clear() {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(METADATA_KEY);
  }

  function getMetadata() {
    try {
      var v = window.localStorage.getItem(METADATA_KEY);
      return v ? JSON.parse(v) : null;
    } catch (e) { return null; }
  }

  function saveMetadata(meta) {
    var existing = getMetadata() || {};
    var merged = Object.assign({}, existing, meta || {}, { updatedAt: Date.now() });
    window.localStorage.setItem(METADATA_KEY, JSON.stringify(merged));
  }

  async function getValidAccessToken() {
    var auth = getStored();
    if (!auth || !auth.accessToken) return null;
    if (!auth.expiresAt || auth.expiresAt > Date.now()) return auth.accessToken;
    if (!auth.refreshToken) { clear(); return null; }
    try {
      var res = await fetch('/api/adobe/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: auth.refreshToken })
      });
      if (!res.ok) throw new Error('refresh failed: ' + res.status);
      var data = await res.json();
      if (!data.refresh_token) data.refresh_token = auth.refreshToken;
      var saved = save(data);
      return saved.accessToken;
    } catch (e) {
      console.error('Failed to refresh Lightroom token', e);
      clear();
      return null;
    }
  }

  // Lightroom API responses are prefixed with `while (1) {}` — strip before parsing
  function stripWhile1(text) {
    var t = String(text);
    if (t.trim().indexOf('while') === 0) {
      var firstBrace = t.indexOf('{');
      var secondBrace = t.indexOf('{', firstBrace + 1);
      if (secondBrace > 0) return t.substring(secondBrace);
    }
    return t;
  }

  async function lrFetch(url, apiKey, opts) {
    var token = await getValidAccessToken();
    if (!token) throw new Error('Not connected to Lightroom');
    var options = Object.assign({}, opts || {});
    options.headers = Object.assign({
      'Authorization': 'Bearer ' + token,
      'X-API-Key': apiKey
    }, (opts && opts.headers) || {});
    var res = await fetch(url, options);
    var text = await res.text();
    var body = stripWhile1(text);
    var json = null;
    try { json = body ? JSON.parse(body) : null; } catch (e) { /* non-JSON */ }
    if (!res.ok) {
      var msg = (json && (json.description || json.message)) || ('Lightroom API error ' + res.status);
      throw new Error(msg);
    }
    return json;
  }

  window.LightroomAuth = {
    getStored: getStored,
    save: save,
    clear: clear,
    getMetadata: getMetadata,
    saveMetadata: saveMetadata,
    getValidAccessToken: getValidAccessToken,
    stripWhile1: stripWhile1,
    lrFetch: lrFetch,
    isConnected: function () {
      var a = getStored();
      return !!(a && a.accessToken && (a.refreshToken || !a.expiresAt || a.expiresAt > Date.now()));
    }
  };
})();
