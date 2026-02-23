// ═══════════════════════════════════════════════════════════════
// TIA-DATA.JS  v2 — The Infinite Arch shared data layer
//
// HOW IT WORKS:
//   Admin uploads photos → Cloudinary returns publicIds
//   Admin stores publicIds in localStorage["tia_admin"]
//   Gallery / Portfolio / Homepage read that localStorage
//   No Cloudinary listing API needed — works immediately
// ═══════════════════════════════════════════════════════════════

const TIA = {
  CLOUD:  'duxiir9lv',
  FOLDER: 'tia',
  STORE_KEY: 'tia_admin',

  // ── URL builders ──────────────────────────────────────────
  url(pid, w)  {
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

  // ── Read/write state ───────────────────────────────────────
  getState() {
    try { return JSON.parse(localStorage.getItem(TIA.STORE_KEY) || '{}'); }
    catch { return {}; }
  },
  setState(state) {
    localStorage.setItem(TIA.STORE_KEY, JSON.stringify(state));
  },

  // ── Get series with admin overrides applied ────────────────
  getSeries() {
    const state = TIA.getState();
    return TIA.DEFAULT_SERIES.map(s => ({
      ...s,
      ...(state.series?.[s.id] || {}),
    }));
  },

  // ── Get photos for a series (from localStorage) ───────────
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

  // ── Get cover for a series ────────────────────────────────
  // Priority: 1) admin-chosen cover  2) first uploaded photo
  getCoverUrl(seriesId, size='cover') {
    const state   = TIA.getState();
    const adminPid = state.series?.[seriesId]?.coverPublicId;
    if (adminPid) return TIA[size]?.(adminPid) || TIA.url(adminPid);
    const photos  = TIA.getPhotos(seriesId);
    return photos[0] ? photos[0][size] || photos[0].cover : '';
  },

  // ── Get homepage slot image ───────────────────────────────
  getHomeUrl(slotId, size='hero') {
    const state = TIA.getState();
    const pid   = state.home?.[slotId];
    return pid ? (TIA[size]?.(pid) || TIA.url(pid)) : '';
  },

  // ── Get portfolio cover for a series ──────────────────────
  getPortfolioUrl(pfKey, size='cover') {
    const state = TIA.getState();
    const pid   = state.portfolio?.[pfKey];
    return pid ? (TIA[size]?.(pid) || TIA.url(pid)) : '';
  },

  // ── Store photos after upload ─────────────────────────────
  // Called by admin after each successful upload
  addPhoto(seriesId, publicId) {
    const state = TIA.getState();
    if (!state.photos) state.photos = {};
    if (!state.photos[seriesId]) state.photos[seriesId] = [];
    if (!state.photos[seriesId].includes(publicId)) {
      state.photos[seriesId].push(publicId);
    }
    TIA.setState(state);
  },

  // ── Apply all photo slots to a page ───────────────────────
  // Elements with data-tia="slotId" data-tia-ctx="home|portfolio|series"
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

      if (el.tagName === 'IMG') {
        el.src = url;
      } else {
        el.style.backgroundImage = `url('${url}')`;
      }
    });
  },
};
