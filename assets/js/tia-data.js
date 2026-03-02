// ═══════════════════════════════════════════════════════════════
// TIA-DATA.JS  v8
//
// Photo source: Cloudflare Images
// Config store: Server-side JSON (/api/config)
//
// Config schema:
// {
//   pages: {
//     home:      { title, metaDescription, blocks: [ { id, type, data } ] },
//     about:     { title, metaDescription, blocks: [...] },
//     portfolio: { title, metaDescription, blocks: [...] },
//     prints:    { title, metaDescription, blocks: [...] },
//     'hope-hike': { title, metaDescription, blocks: [...] },
//     contact:   { title, metaDescription, blocks: [...] }
//   },
//   portfolioWorks: [
//     { id, title, subtitle, type, description, camera, location, format, coverAssetId,
//       galleries: [ { id, title, subtitle, coverAssetId, photos: [cfImageId, ...] } ]
//     }
//   ],
//   siteSettings: { siteName, tagline, footerQuote, footerAttr, email },
//   navigation:   [ { label, href, visible } ],
//   series:       { s1: { title, subtitle, description, coverAssetId } },
//   photos:       { s1: [ id, id, ... ] },
//   home:         { hero_bg: id },
//   cf:           { hash, assetMeta: { cfImageId: { id, filename } } },
//   imgFolders:   { fid: { name, images: [] } },
//   contentBlocks:[ { id, heading, eyebrow, body, page, position, style } ]
// }
// ═══════════════════════════════════════════════════════════════

const TIA = {
  STORE_KEY:  'tia_admin',
  CF_HASH:    null,

  cfUrl(imageId, variant) {
    const hash = TIA.CF_HASH || TIA.getState().cf?.hash;
    if (!hash || !imageId) return '';
    return `https://imagedelivery.net/${hash}/${imageId}/${variant || 'public'}`;
  },

  photoUrl(id, size) {
    const variant = size === 'thumb' ? 'thumb' : size === 'cover' ? 'cover' : size === 'hero' ? 'hero' : 'full';
    return TIA.cfUrl(id, variant);
  },

  thumb(assetId)  { return TIA.photoUrl(assetId, 'thumb');  },
  cover(assetId)  { return TIA.photoUrl(assetId, 'cover'); },
  hero(assetId)   { return TIA.photoUrl(assetId, 'hero'); },
  full(assetId)   { return TIA.photoUrl(assetId, 'full');   },

  DEFAULT_PORTFOLIO_WORKS: [
    {id:'pw-daydream',title:'Beyond the Daydream',subtitle:'The places that couldn\u2019t be scrolled past',type:'Expeditions',description:'Iceland. Guadalupe Peak. New Orleans. Each expedition is a deliberate act \u2014 arriving somewhere to wait for the light, the weather, the moment that justifies the journey.',camera:'GFX 100S II',location:'Iceland \u00b7 Guadalupe Peak \u00b7 and beyond',format:'Digital',coverAssetId:'',galleries:[]},
    {id:'pw-frame',title:'Beyond the Frame',subtitle:'The near distance',type:'Home Terrain',description:'North Texas landscape \u2014 the land you drive past every day and never stop for. Palo Duro. The Trinity bottomlands. The Llano Estacado at golden hour. What\u2019s here when you look.',camera:'GFX 100S II',location:'North Texas',format:'Digital',coverAssetId:'',galleries:[]},
    {id:'pw-moment',title:'Beyond the Moment',subtitle:'The ones who also chose to be out there',type:'Figures in the Threshold',description:'People in landscape. Climbers. Hikers. The WE CLIMB community. Figures who remind us that the wilderness is not empty \u2014 it is where we go to remember who we are.',camera:'GFX 100S II',location:'Various',format:'Digital',coverAssetId:'',galleries:[]},
    {id:'pw-shutter',title:'Beyond the Shutter',subtitle:'The slower eye',type:'Film \u00b7 Konica Hexar',description:'The Konica Hexar sees differently. Grain, patience, the commitment of analog \u2014 no spray and pray, no instant review. One frame at a time. One chance to mean it.',camera:'Konica Hexar',location:'Various',format:'Film',coverAssetId:'',galleries:[]}
  ],

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

  async load() {
    try {
      const res = await fetch('/api/config?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        if (data && Object.keys(data).length > 0) {
          TIA._state = data;
          localStorage.setItem(TIA.STORE_KEY, JSON.stringify(TIA._state));
          return TIA._state;
        }
      }
    } catch {}
    try {
      const cached = localStorage.getItem(TIA.STORE_KEY);
      if (cached) { TIA._state = JSON.parse(cached); return TIA._state; }
    } catch {}
    TIA._state = {};
    return TIA._state;
  },

  getState() {
    var s;
    if (TIA._state) s = TIA._state;
    else {
      try { s = JSON.parse(localStorage.getItem(TIA.STORE_KEY) || '{}'); }
      catch { s = {}; }
    }
    if (!s.portfolioWorks || !s.portfolioWorks.length) {
      s.portfolioWorks = JSON.parse(JSON.stringify(TIA.DEFAULT_PORTFOLIO_WORKS));
    }
    return s;
  },

  async save(state) {
    TIA._state = state;
    localStorage.setItem(TIA.STORE_KEY, JSON.stringify(state));
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
    if (!res.ok) throw new Error('Config save failed: ' + await res.text());
    const result = await res.json();
    if (result.timestamp) {
      localStorage.setItem('tia_last_save', result.timestamp);
    }
  },

  getPageBlocks(pageSlug) {
    const state = TIA.getState();
    return state.pages && state.pages[pageSlug] ? state.pages[pageSlug].blocks : null;
  },

  getPageMeta(pageSlug) {
    const state = TIA.getState();
    return state.pages && state.pages[pageSlug] ? { title: state.pages[pageSlug].title, metaDescription: state.pages[pageSlug].metaDescription } : null;
  },

  getSeries() {
    const state = TIA.getState();
    const defaults = TIA.DEFAULT_SERIES.map(s => ({ ...s, ...(state.series?.[s.id] || {}) }));
    const customIds = Object.keys(state.series || {}).filter(id => !TIA.DEFAULT_SERIES.find(d => d.id === id));
    const custom = customIds.map(id => ({ id, ...state.series[id] })).filter(s => s.title);
    return [...defaults, ...custom];
  },

  getAllGalleries() {
    const state = TIA.getState();
    const works = state.portfolioWorks || [];
    const galleries = [];
    works.forEach(function(w) {
      (w.galleries || []).forEach(function(g) {
        galleries.push(Object.assign({}, g, {
          workId: w.id, workTitle: w.title, type: g.type || w.type,
          camera: g.camera || w.camera, location: g.location || w.location
        }));
      });
    });
    if (!galleries.length) {
      return TIA.getSeries().map(function(s) {
        return { id: s.id, title: s.title, subtitle: s.subtitle, type: s.type,
          camera: s.camera, location: s.location, workTitle: 'Default',
          coverAssetId: s.coverAssetId, photos: (state.photos && state.photos[s.id]) || [] };
      });
    }
    return galleries;
  },

  getWorkById(workId) {
    var works = TIA.getState().portfolioWorks || [];
    for (var i = 0; i < works.length; i++) {
      if (works[i].id === workId) return works[i];
    }
    return null;
  },

  getGalleryPhotos(workId, galleryId) {
    var work = TIA.getWorkById(workId);
    if (!work) return [];
    var galleries = work.galleries || [];
    for (var i = 0; i < galleries.length; i++) {
      if (galleries[i].id === galleryId) {
        var state = TIA.getState();
        return (galleries[i].photos || []).map(function(aid) {
          return {
            assetId: aid, thumb: TIA.thumb(aid), full: TIA.full(aid),
            cover: TIA.cover(aid), hero: TIA.hero(aid),
            filename: (state.cf && state.cf.assetMeta && state.cf.assetMeta[aid] && state.cf.assetMeta[aid].filename) || aid
          };
        });
      }
    }
    return [];
  },

  getPhotos(seriesId) {
    const state = TIA.getState();
    const works = state.portfolioWorks || [];
    for (var i = 0; i < works.length; i++) {
      var galleries = works[i].galleries || [];
      for (var j = 0; j < galleries.length; j++) {
        if (galleries[j].id === seriesId) {
          return (galleries[j].photos || []).map(function(aid) {
            return {
              assetId: aid, thumb: TIA.thumb(aid), full: TIA.full(aid),
              cover: TIA.cover(aid), hero: TIA.hero(aid),
              filename: (state.cf && state.cf.assetMeta && state.cf.assetMeta[aid] && state.cf.assetMeta[aid].filename) || aid.split('/').pop() || aid
            };
          });
        }
      }
    }
    return (state.photos && state.photos[seriesId] || []).map(function(aid) {
      return {
        assetId: aid, thumb: TIA.thumb(aid), full: TIA.full(aid),
        cover: TIA.cover(aid), hero: TIA.hero(aid),
        filename: (state.cf && state.cf.assetMeta && state.cf.assetMeta[aid] && state.cf.assetMeta[aid].filename) || aid.split('/').pop() || aid
      };
    });
  },

  getCoverUrl(seriesId, size) {
    size = size || 'cover';
    const state = TIA.getState();
    const works = state.portfolioWorks || [];
    for (var i = 0; i < works.length; i++) {
      var galleries = works[i].galleries || [];
      for (var j = 0; j < galleries.length; j++) {
        if (galleries[j].id === seriesId) {
          if (galleries[j].coverAssetId) return TIA[size] ? TIA[size](galleries[j].coverAssetId) : '';
          var gPhotos = galleries[j].photos || [];
          if (gPhotos.length) return TIA[size] ? TIA[size](gPhotos[0]) : '';
          return '';
        }
      }
    }
    var adminAid = state.series && state.series[seriesId] && state.series[seriesId].coverAssetId;
    if (adminAid) return TIA[size] ? TIA[size](adminAid) : '';
    const photos = TIA.getPhotos(seriesId);
    return (photos[0] && photos[0][size]) || (photos[0] && photos[0].cover) || '';
  },

  getHomeUrl(slotId, size = 'hero') {
    const aid = TIA.getState().home?.[slotId];
    return aid ? (TIA[size]?.(aid) || '') : '';
  },

  applyAll() {
    document.querySelectorAll('[data-tia]').forEach(el => {
      const slot = el.dataset.tia;
      const ctx  = el.dataset.tiaCtx  || 'home';
      const size = el.dataset.tiaSize || (el.tagName === 'IMG' ? 'cover' : 'hero');
      let url = '';
      if (ctx === 'home')      url = TIA.getHomeUrl(slot, size);
      if (ctx === 'series')    url = TIA.getCoverUrl(slot, size);
      if (!url) return;
      if (el.tagName === 'IMG') el.src = url;
      else el.style.backgroundImage = `url('${url}')`;
    });
  },
};
