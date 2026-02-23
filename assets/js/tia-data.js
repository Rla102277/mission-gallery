// ═══════════════════════════════════════════════════════════════
// TIA-DATA.JS  v3 — The Infinite Arch shared data layer
//
// HOW IT WORKS:
//   Admin uploads photos → saves config JSON to Cloudinary
//   All pages fetch that JSON on load → always in sync
//   localStorage used as fallback/cache only
//
// CONFIG JSON lives at:
//   https://res.cloudinary.com/duxiir9lv/raw/upload/tia/config.json
// ═══════════════════════════════════════════════════════════════

const TIA = {
  CLOUD:      'duxiir9lv',
  FOLDER:     'tia',
  PRESET:     'tia_unsigned',
  STORE_KEY:  'tia_admin',
  CONFIG_URL: 'https://res.cloudinary.com/duxiir9lv/raw/upload/tia/tia-config.json',

  // ── URL builders ──────────────────────────────────────────
  url(pid, w) {
    if (!pid) return '';
    const t = w ? `w_${w},` : '';
    return `https://res.cloudinary.com/${TIA.CLOUD}/image/upload/${t}q_auto,f_auto/${pid}`;
  },
  thumb(pid)  { return TIA.url(pid, 600);  },
  cover(pid)  { return TIA.url(pid, 1400); },
  hero(pid)   { return TIA.url(pid, 2400); },
  full(pid)   { return TIA.url(pid, 0);    },

  // ── Series definitions ─────────────────────────────────────
  DEFAULT_SERIES: [
    { id:'s1', num:'01', folder:'s1-solitude-scale',      title:'Solitude & Scale',          subtitle:'The Secret Lagoon',                  type:'Triptych', camera:'GFX 100S II + 32–64mm',   location:'Fjallsárlón Glacier Lagoon' },
    { id:'s2', num:'02', folder:'s2-glacial-contrasts',   title:'Glacial Contrasts',          subtitle:'Ice in Two Realms',                  type:'Diptych',  camera:'GFX 100S II + 100–200mm',  location:'Jökulsárlón & Diamond Beach' },
    { id:'s3', num:'03', folder:'s3-blue-trilogy',        title:'Blue Trilogy',               subtitle:'The Impossible Blues of Iceland Ice', type:'Triptych', camera:'X-E5 + GFX 100S II',       location:'Ice Cave · Diamond Beach · Jökulsárlón' },
    { id:'s4', num:'04', folder:'s4-coastal-contrasts',   title:'Coastal Contrasts',          subtitle:'Black Sand vs Blue Water',            type:'Diptych',  camera:'GFX 100S II',              location:'Reynisfjara · Blue Lagoon' },
    { id:'s5', num:'05', folder:'s5-human-element',       title:'The Human Element',          subtitle:'Presence at the Edge of the World',   type:'Diptych',  camera:'GFX 100S II',              location:'South Iceland Plains' },
    { id:'s6', num:'06', folder:'s6-arnarstapi-geometry', title:'Arnarstapi Geometry',        subtitle:'The Architecture of Erosion',         type:'Triptych', camera:'GFX 100S II + 32–64mm',   location:'Arnarstapi, Snæfellsnes' },
    { id:'s7', num:'07', folder:'s7-peninsular-panorama', title:'Peninsular Panorama',        subtitle:'Snæfellsnes in Three Moods',          type:'Triptych', camera:'GFX 100S II + 32–64mm',   location:'Snæfellsnes Peninsula' },
    { id:'s8', num:'08', folder:'s8-urban-odyssey',       title:'Urban Odyssey',              subtitle:'Reykjavík as Coda',                   type:'Triptych', camera:'GFX 100S II + 32–64mm',   location:'Reykjavík' },
  ],

  // ── State (in-memory, loaded from Cloudinary JSON) ────────
  _state: null,

  // ── Load config from Cloudinary (called once on page load) ─
  async load() {
    // Try Cloudinary config first
    try {
      const res = await fetch(TIA.CONFIG_URL + '?t=' + Date.now());
      if (res.ok) {
        TIA._state = await res.json();
        // Also mirror to localStorage as cache
        localStorage.setItem(TIA.STORE_KEY, JSON.stringify(TIA._state));
        return TIA._state;
      }
    } catch {}

    // Fall back to localStorage cache
    try {
      const cached = localStorage.getItem(TIA.STORE_KEY);
      if (cached) {
        TIA._state = JSON.parse(cached);
        return TIA._state;
      }
    } catch {}

    TIA._state = {};
    return TIA._state;
  },

  // ── Get state (sync — call after load()) ──────────────────
  getState() {
    if (TIA._state) return TIA._state;
    // Sync fallback for code that calls getState before load()
    try { return JSON.parse(localStorage.getItem(TIA.STORE_KEY) || '{}'); }
    catch { return {}; }
  },

  // ── Save state — writes to localStorage AND Cloudinary ────
  async save(state) {
    TIA._state = state;
    localStorage.setItem(TIA.STORE_KEY, JSON.stringify(state));
    await TIA._pushToCloudinary(state);
  },

  // ── Push config JSON to Cloudinary as a raw file ──────────
  async _pushToCloudinary(state) {
    const json    = JSON.stringify(state, null, 2);
    const blob    = new Blob([json], { type: 'application/json' });
    const dataUri = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });

    const fd = new FormData();
    fd.append('file',           dataUri);
    fd.append('upload_preset',  TIA.PRESET);
    fd.append('folder',         TIA.FOLDER);
    fd.append('public_id',      'tia-config');
    fd.append('resource_type',  'raw');
    fd.append('overwrite',      'true');
    fd.append('invalidate',     'true');

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${TIA.CLOUD}/raw/upload`,
      { method: 'POST', body: fd }
    );
    if (!res.ok) {
      const err = await res.text();
      console.warn('Config push failed:', err);
      throw new Error('Config push failed: ' + err);
    }
    return res.json();
  },

  // ── Get series with admin overrides ───────────────────────
  getSeries() {
    const state = TIA.getState();
    return TIA.DEFAULT_SERIES.map(s => ({
      ...s, ...(state.series?.[s.id] || {}),
    }));
  },

  // ── Get photos for a series ───────────────────────────────
  getPhotos(seriesId) {
    const state = TIA.getState();
    return (state.photos?.[seriesId] || []).map(pid => ({
      publicId: pid,
      thumb:    TIA.thumb(pid),
      full:     TIA.full(pid),
      cover:    TIA.cover(pid),
      hero:     TIA.hero(pid),
      filename: pid.split('/').pop(),
    }));
  },

  // ── Get cover URL for a series ─────────────────────────────
  getCoverUrl(seriesId, size = 'cover') {
    const state    = TIA.getState();
    const adminPid = state.series?.[seriesId]?.coverPublicId;
    if (adminPid) return TIA[size]?.(adminPid) || TIA.url(adminPid);
    const photos   = TIA.getPhotos(seriesId);
    return photos[0]?.[size] || photos[0]?.cover || '';
  },

  // ── Get homepage slot URL ──────────────────────────────────
  getHomeUrl(slotId, size = 'hero') {
    const pid = TIA.getState().home?.[slotId];
    return pid ? (TIA[size]?.(pid) || TIA.url(pid)) : '';
  },

  // ── Get portfolio cover URL ────────────────────────────────
  getPortfolioUrl(pfKey, size = 'cover') {
    const pid = TIA.getState().portfolio?.[pfKey];
    return pid ? (TIA[size]?.(pid) || TIA.url(pid)) : '';
  },

  // ── Apply all data-tia slots on a page ────────────────────
  applyAll() {
    document.querySelectorAll('[data-tia]').forEach(el => {
      const slot = el.dataset.tia;
      const ctx  = el.dataset.tiaCtx  || 'home';
      const size = el.dataset.tiaSize || (el.tagName === 'IMG' ? 'cover' : 'hero');
      let url = '';
      if (ctx === 'home')      url = TIA.getHomeUrl(slot, size);
      if (ctx === 'portfolio') url = TIA.getPortfolioUrl(slot, size);
      if (ctx === 'series')    url = TIA.getCoverUrl(slot, size);
      if (!url) return;
      if (el.tagName === 'IMG') { el.src = url; }
      else { el.style.backgroundImage = `url('${url}')`; }
    });
  },
};
