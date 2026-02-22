// ═══════════════════════════════════════════════════════════════
// THE INFINITE ARCH — Cloudinary Photo Configuration
// Cloud: duxiir9lv
//
// HOW TO USE:
//   1. Open admin/upload.html in your browser
//   2. Upload photos series by series
//   3. Click "Generate Config" — copy output here
//   4. Gallery + Portfolio pages auto-read from PHOTO_URLS and COVER_URLS
//
// MANUAL: You can also paste Cloudinary URLs directly below
// ═══════════════════════════════════════════════════════════════

const CLOUDINARY_CLOUD = 'duxiir9lv';

// ── URL HELPER ────────────────────────────────────────────────
// Inserts Cloudinary transformations into any uploaded URL
// Examples:
//   cldUrl(url)                  → auto quality + format (web default)
//   cldUrl(url, 'w_1600,q_90')   → 1600px wide, 90% quality
//   cldUrl(url, 'w_400,c_fill')  → 400px thumbnail, cropped
function cldUrl(url, transforms = 'q_auto,f_auto') {
  if (!url) return '';
  if (url.startsWith('http')) {
    return url.replace('/upload/', `/upload/${transforms}/`);
  }
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/upload/${transforms}/${url}`;
}

// ═══════════════════════════════════════════════════════════════
// PHOTO URLS — organized by series
// Paste your Cloudinary URLs here after uploading
// Each array matches the order of photos in gallery.html COLLECTIONS
// ═══════════════════════════════════════════════════════════════
const PHOTO_URLS = {

  // Series 01: Solitude & Scale (Triptych — 3 photos)
  // Frame A: Wide — immensity | Frame B: Medium — floating giants | Frame C: Close — golden signature
  s1: [
    '', // s1-01: The Immensity
    '', // s1-02: Floating Giants
    '', // s1-03: The Signature
  ],

  // Series 02: Glacial Contrasts (Diptych — 2 photos)
  // Frame A: Floating icebergs | Frame B: Ice on black sand
  s2: [
    '', // s2-01: Floating Giants
    '', // s2-02: Grounded Jewels
  ],

  // Series 03: Blue Trilogy (Triptych — 3 photos)
  // Frame A: Ice cave interior | Frame B: Beach ice chunk | Frame C: Lagoon twilight
  s3: [
    '', // s3-01: Blue Abyss
    '', // s3-02: Blue Diamond
    '', // s3-03: Blue Hour
  ],

  // Series 04: Coastal Contrasts (Diptych — 2 photos)
  // Frame A: Reynisfjara B&W | Frame B: Blue Lagoon
  s4: [
    '', // s4-01: Volcanic Geometry
    '', // s4-02: Geothermal Serenity
  ],

  // Series 05: The Human Element (Diptych — 2 photos)
  // Frame A: Photographer at sunset | Frame B: With wild horse
  s5: [
    '', // s5-01: Photographer at Sunset
    '', // s5-02: The Companion
  ],

  // Series 06: Arnarstapi Geometry (Triptych — 3 photos)
  // Frame A: Gatklettur arch | Frame B: Basalt cathedral panorama | Frame C: Coastal power
  s6: [
    '', // s6-01: Gatklettur Arch
    '', // s6-02: Basalt Cathedral
    '', // s6-03: Coastal Power
  ],

  // Series 07: Peninsular Panorama (Triptych — 3 photos)
  // Frame A: Kirkjufell | Frame B: Búðir Black Church | Frame C: Arnarstapi arch
  s7: [
    '', // s7-01: The Icon
    '', // s7-02: The Solitude
    '', // s7-03: The Drama
  ],

  // Series 08: Urban Odyssey (Triptych — 3 photos)
  // Frame A: Sun Voyager | Frame B: Harpa | Frame C: Grotta lighthouse
  s8: [
    '', // s8-01: Sun Voyager
    '', // s8-02: Harpa Geometry
    '', // s8-03: Grotta Lighthouse
  ],
};

// ═══════════════════════════════════════════════════════════════
// COVER URLS — hero image shown on each collection card
// Defaults to first photo of series if left blank
// ═══════════════════════════════════════════════════════════════
const COVER_URLS = {
  s1: '', // Solitude & Scale cover
  s2: '', // Glacial Contrasts cover
  s3: '', // Blue Trilogy cover
  s4: '', // Coastal Contrasts cover
  s5: '', // Human Element cover
  s6: '', // Arnarstapi Geometry cover
  s7: '', // Peninsular Panorama cover
  s8: '', // Urban Odyssey cover
};

// ═══════════════════════════════════════════════════════════════
// HOMEPAGE PHOTOS — for index.html sections
// ═══════════════════════════════════════════════════════════════
const HOME_URLS = {
  hero:       '',  // Main hero background (painted desert / Painted Hills landscape)
  carousel1:  '',  // Carousel slide 1 — Iceland glacier
  carousel2:  '',  // Carousel slide 2 — aurora or ice
  carousel3:  '',  // Carousel slide 3 — Palo Duro or Texas landscape
  mountain:   '',  // Full-width "To see the world" section — mountain panoramic
  qrow1:      '',  // Number 25 section right column — Iceland aurora
  qrow2:      '',  // Vonnegut section left — landscape
  qrow3:      '',  // Muir section right — sunset
  qrow4:      '',  // Thoreau section left — wilderness
  portrait:   '',  // Contact section — your portrait
};

// ═══════════════════════════════════════════════════════════════
// PORTFOLIO COVER PHOTOS — large editorial images per series
// Can be same as COVER_URLS or a different hero shot
// ═══════════════════════════════════════════════════════════════
const PORTFOLIO_COVERS = {
  s1: '', // Solitude & Scale editorial hero
  s2: '', // Glacial Contrasts editorial hero
  s3: '', // Blue Trilogy editorial hero
  s5: '', // Human Element editorial hero
  s7: '', // Peninsular Panorama editorial hero
};
