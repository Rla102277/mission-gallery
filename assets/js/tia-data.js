// ═══════════════════════════════════════════════════════════════
// TIA-DATA.JS  v5
//
// Photo sources: Cloudinary (primary) + Adobe Lightroom (optional)
// Config store: Cloudinary raw JSON (tia-config.json)
//
// Config JSON at:
//   https://res.cloudinary.com/duxiir9lv/raw/upload/tia/tia-config.json
//
// Config schema:
// {
//   series:    { s1: { title, subtitle, description, coverAssetId } }
//   photos:    { s1: [ id, id, ... ] }
//   home:      { hero: id, carousel1: id, ... }
//   portfolio: { 'pf-s1': id, ... }
//   cl:        { assetMeta: { publicId: { publicId, filename } } }
//   lr:        { assetMeta: { assetId: { url2048, urlThumb, filename } } }
// }
// ═══════════════════════════════════════════════════════════════

const TIA = {
  CLOUD:      'duxiir9lv',
  FOLDER:     'tia',
  PRESET:     'tia_unsigned',
  STORE_KEY:  'tia_admin',
  CONFIG_PID: 'tia/tia-config',
  CONFIG_URL: 'https://res.cloudinary.com/duxiir9lv/raw/upload/tia/tia-config.json',

  // ── Cloudinary image URL builder ──────────────────────────
  clUrl(photoId, size) {
    const meta = TIA.getState().cl?.assetMeta?.[photoId];
    if (!meta) return '';
    const pid = meta.publicId || photoId;
    const base = `https://res.cloudinary.com/${TIA.CLOUD}/image/upload`;
    if (size === 'thumb') return `${base}/c_fill,w_400,h_267/${pid}`;
    if (size === 'cover') return `${base}/c_fill,w_1200,h_600/${pid}`;
    if (size === 'hero')  return `${base}/c_fill,w_1920,h_1080/${pid}`;
    if (size === 'full')  return `${base}/${pid}`;
    return `${base}/${pid}`;
  },

  // ── Adobe CDN URL builders (optional) ───────────────────
  lrUrl(assetId, size) {
    const meta = TIA.getState().lr?.assetMeta?.[assetId];
    if (!meta) return '';
    if (size === 'thumb')  return meta.urlThumb  || meta.url2048 || '';
    if (size === 'full')   return meta.urlFull   || meta.url2048 || '';
    return meta.url2048 || meta.urlThumb || '';
  },

  // ── Resolve URL — checks Cloudinary first, then Lightroom ─
  photoUrl(id, size) {
    return TIA.clUrl(id, size) || TIA.lrUrl(id, size);
  },

  thumb(assetId)  { return TIA.photoUrl(assetId, 'thumb');  },
  cover(assetId)  { return TIA.photoUrl(assetId, 'cover'); },
  hero(assetId)   { return TIA.photoUrl(assetId, 'full'); },
  full(assetId)   { return TIA.photoUrl(assetId, 'full');   },

  // ── Series definitions ─────────────────────────────────────
  DEFAULT_SERIES: [
    { id:'s1', num:'01', title:'Solitude & Scale',          subtitle:'The Secret Lagoon',                  type:'Triptych', camera:'GFX 100S II + 32–64mm',  location:'Fjallsárlón Glacier Lagoon'          },
    { id:'s2', num:'02', title:'Glacial Contrasts',          subtitle:'Ice in Two Realms',                  type:'Diptych',  camera:'GFX 100S II + 100–200mm', location:'Jökulsárlón & Diamond Beach'         },
    { id:'s3', num:'03', title:'Blue Trilogy',               subtitle:'The Impossible Blues of Iceland Ice', type:'Triptych', camera:'X-E5 + GFX 100S II',      location:'Ice Cave · Diamond Beach · Jökulsárlón'},
    { id:'s4', num:'04', title:'Coastal Contrasts',          subtitle:'Black Sand vs Blue Water',            type:'Diptych',  camera:'GFX 100S II',              location:'Reynisfjara · Blue Lagoon'           },
    { id:'s5', num:'05', title:'The Human Element',          subtitle:'Presence at the Edge of the World',   type:'Diptych',  camera:'GFX 100S II',              location:'South Iceland Plains'                },
    { id:'s6', num:'06', title:'Arnarstapi Geometry',        subtitle:'The Architecture of Erosion',         type:'Triptych', camera:'GFX 100S II + 32–64mm',  location:'Arnarstapi, Snæfellsnes'             },
    { id:'s7', num:'07', title:'Peninsular Panorama',        subtitle:'Snæfellsnes in Three Moods',          type:'Triptych', camera:'GFX 100S II + 32–64mm',  location:'Snæfellsnes Peninsula'               },
    { id:'s8', num:'08', title:'Urban Odyssey',              subtitle:'Reykjavík as Coda',                   type:'Triptych', camera:'GFX 100S II + 32–64mm',  location:'Reykjavík'                           },
  ],

  _state: null,

  // ── Load config ──────────────────────────────────────────
  async load() {
    const urls = [
      localStorage.getItem('tia_config_url'),
      TIA.CONFIG_URL
    ].filter(Boolean);
    for (const url of urls) {
      try {
        const res = await fetch(url + (url.includes('?') ? '&' : '?') + 't=' + Date.now());
        if (res.ok) {
          TIA._state = await res.json();
          localStorage.setItem(TIA.STORE_KEY, JSON.stringify(TIA._state));
          return TIA._state;
        }
      } catch {}
    }
    try {
      const cached = localStorage.getItem(TIA.STORE_KEY);
      if (cached) { TIA._state = JSON.parse(cached); return TIA._state; }
    } catch {}
    TIA._state = {};
    return TIA._state;
  },

  getState() {
    if (TIA._state) return TIA._state;
    try { return JSON.parse(localStorage.getItem(TIA.STORE_KEY) || '{}'); }
    catch { return {}; }
  },

  // ── Save — localStorage + push JSON to Cloudinary ─────────
  async save(state) {
    TIA._state = state;
    localStorage.setItem(TIA.STORE_KEY, JSON.stringify(state));
    await TIA._pushConfig(state);
  },

  async _pushConfig(state) {
    const blob    = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const dataUri = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(blob); });
    const fd = new FormData();
    fd.append('file',          dataUri);
    fd.append('upload_preset', TIA.PRESET);
    fd.append('folder',        TIA.FOLDER);
    fd.append('public_id',     'tia-config-' + Date.now());
    fd.append('resource_type', 'raw');
    const res = await fetch(`https://api.cloudinary.com/v1_1/${TIA.CLOUD}/raw/upload`, { method:'POST', body:fd });
    if (!res.ok) throw new Error('Config push failed: ' + await res.text());
    const data = await res.json();
    if (data.secure_url) {
      TIA._latestConfigUrl = data.secure_url;
      localStorage.setItem('tia_config_url', data.secure_url);
    }
  },

  // ── Series helpers ─────────────────────────────────────────
  getSeries() {
    const state = TIA.getState();
    return TIA.DEFAULT_SERIES.map(s => ({ ...s, ...(state.series?.[s.id] || {}) }));
  },

  getPhotos(seriesId) {
    const state = TIA.getState();
    return (state.photos?.[seriesId] || []).map(aid => ({
      assetId:  aid,
      thumb:    TIA.thumb(aid),
      full:     TIA.full(aid),
      cover:    TIA.cover(aid),
      hero:     TIA.hero(aid),
      filename: state.cl?.assetMeta?.[aid]?.filename || state.lr?.assetMeta?.[aid]?.filename || aid.split('/').pop() || aid,
    }));
  },

  getCoverUrl(seriesId, size = 'cover') {
    const state    = TIA.getState();
    const adminAid = state.series?.[seriesId]?.coverAssetId;
    if (adminAid) return TIA[size]?.(adminAid) || TIA.lrUrl(adminAid, '');
    const photos   = TIA.getPhotos(seriesId);
    return photos[0]?.[size] || photos[0]?.cover || '';
  },

  getHomeUrl(slotId, size = 'hero') {
    const aid = TIA.getState().home?.[slotId];
    return aid ? (TIA[size]?.(aid) || TIA.lrUrl(aid, '')) : '';
  },

  getPortfolioUrl(pfKey, size = 'cover') {
    const aid = TIA.getState().portfolio?.[pfKey];
    return aid ? (TIA[size]?.(aid) || TIA.lrUrl(aid, '')) : '';
  },

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
      if (el.tagName === 'IMG') el.src = url;
      else el.style.backgroundImage = `url('${url}')`;
    });
  },
};
