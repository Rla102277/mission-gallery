# The Infinite Arch - Photography Portfolio CMS

## Overview
JSON-config-driven CMS photography platform with a block-rendered page system and Wix-like admin page builder.

## Architecture
- **Frontend**: Block-rendered pages — thin HTML shells load blocks from config via `block-renderer.js`
- **Admin Panel**: `admin/index.html` — single-page admin for managing pages (block editor), portfolio works with gallery hierarchy, navigation, site settings, photos, and Cloudflare images
- **Config Storage**: Server-side JSON (`/api/config` → `data/tia-config.json`)
- **Photo Hosting**: Cloudflare Images (sole image server)
- **Server**: Express with multer — proxies uploads to Cloudflare Images API (protects API token)
- **Build**: `script/build.cjs` copies static files to `dist/public/` and creates `dist/index.cjs` Express server

## Block Renderer System (Phase 1 Complete)
Pages are thin HTML shells that:
1. Load `tia-data.js` and `block-renderer.js`
2. Fetch config from `/api/config`
3. Get blocks for the page via `state.pages[slug].blocks` or fall back to `BlockRenderer.defaultBlocks(slug)`
4. Render blocks into `#pageBlocks` div via `BlockRenderer.render(blocks, state)`
5. Call `BlockRenderer.initReveals()` for scroll animations
6. Load `components.js` (nav/footer) and `tia.js` (page transitions)

### Block Types (16 total)
- `hero` — Full-screen hero (variants: wordmark, standard, centered, masthead)
- `text` — Eyebrow + heading + body + CTA (variants: default, pull-quote, article)
- `divider` — Decorative star divider
- `collections-grid` — 2×2 portfolio work tiles (dark gradients, cream text)
- `featured-list` — Numbered feature items with tags
- `process-grid` — Numbered step cards
- `callout` — Bordered card with gold accent (like Hope Hike)
- `services-grid` — Service cards with pricing
- `newsletter` — Email signup form
- `quote` — Centered quote with attribution
- `stats-bar` — Row of stat items
- `image-text` — Side-by-side image + text
- `photo-grid` — Grid of photos (2/3/4 columns)
- `details-list` — Vertical list of detail items
- `badge` — Bordered text badge
- `email-link` — Styled mailto link
- `purpose-quote` — Italic quote with border
- `back-link` — Return home link

### Default Block Seeds
Each page has hardcoded default blocks in `BlockRenderer.PAGE_DEFAULTS`:
- `home` — 11 blocks (hero wordmark, philosophy, dividers, collections, featured, process, callout, services, newsletter, quote)
- `about` — 5 blocks (masthead, pull-quote, divider, article, quote)
- `prints` — 4 blocks (centered hero, details, badge, back-link)
- `hope-hike` — 4 blocks (centered hero, stats, purpose-quote, back-link)
- `contact` — 3 blocks (centered hero, email-link, back-link)

## Design System
- **Color Palette**: Light cream (#f5f0e8) background with dark ink (#0d0d0d) text EVERYWHERE. Hero sections and collection tiles stay dark (have own dark gradient backgrounds) with cream text. Gold (#b5922a) accents. NEVER set body to dark/ink background.
- **Typography**: Playfair Display (headings), Cormorant Garamond (body)
- **Visual Effects**: Grain overlay via body::before, radial gradient backgrounds, gold accent lines
- **CSS Files**: `tia.css` (base/nav/footer) + `blocks.css` (all block type styles)
- **CSS Variables**: `--rule-dark: rgba(13,13,13,0.12)` for borders, `--gold: #b5922a`

## Key Files
- `index.html` — Homepage thin shell (block-driven)
- `pages/about.html` — Artist Statement thin shell (block-driven)
- `pages/prints.html` — Prints thin shell (block-driven)
- `pages/hope-hike.html` — Hope Hike thin shell (block-driven)
- `pages/contact.html` — Contact thin shell (block-driven)
- `pages/portfolio.html` — Portfolio page (3-view hierarchy drill-down, special-purpose)
- `pages/gallery.html` — Interactive gallery viewer (special-purpose, not block-driven)
- `admin/index.html` — Admin panel (PIN-protected, case-insensitive "tia2026")
- `assets/js/block-renderer.js` — Block renderer engine with 16 block types + default seeds + initReveals()
- `assets/js/tia-data.js` — TIA data layer v8 (helpers: getPageBlocks, getPageMeta, getAllGalleries, getWorkById, getGalleryPhotos)
- `assets/js/tia.js` — Frontend site logic (scroll effects, mobile menu, page transitions) — skips reveal setup if block renderer already handled it
- `assets/js/components.js` — Injects shared nav and footer across all pages (reads from config for dynamic nav/footer)
- `assets/css/tia.css` — Global styles: tokens, nav, footer, page-content wrapper, grain overlay
- `assets/css/blocks.css` — All block type CSS with responsive breakpoints + about page print/dark mode
- `server/index.ts` — Express server with CF API proxy + config endpoints + static files
- `script/build.cjs` — Production build script

## Data Model (STATE / Config JSON)
- `pages` — Object keyed by slug: `{ title, metaDescription, blocks: [{ id, type, data }] }`
- `portfolioWorks` — Array of work objects: `{ id, title, subtitle, type, description, camera, location, format, coverAssetId, galleries: [{ id, title, subtitle, coverAssetId, photos: [] }] }`
- `siteSettings` — `{ siteName, tagline, footerQuote, footerAttr, email }`
- `navigation` — `[{ label, href, visible }]`
- `series` — Gallery metadata keyed by series ID (legacy)
- `photos` — Photo arrays keyed by series ID (legacy CF Image IDs)
- `home` — Homepage slot assignments (`{ hero_bg: cfImageId }`)
- `imgFolders` — Virtual folder organization
- `cf` — `{ hash, assetMeta: { cfImageId: { id, filename } } }`

## Server API Endpoints
- `POST /api/images/upload` — Upload image via multer → Cloudflare Images API
- `DELETE /api/images/:id` — Delete image from Cloudflare Images
- `GET /api/images/list` — List all Cloudflare Images with pagination
- `GET /api/images/config` — Returns CF delivery hash for URL building
- `GET /api/config` — Read site configuration JSON
- `POST /api/config` — Write site configuration JSON

## Admin Panel Features (Phase 3 Complete)
- **Galleries tab**: Browse/create/delete series, set covers, upload photos, edit metadata
- **Images tab**: Browse all CF images, organize into folders, assign to series, upload, delete
- **Pages tab**: Page builder — select page (Home/About/Prints/Hope Hike/Contact), view/add/edit/reorder/duplicate/delete blocks with type-specific form editors, page title & meta description, image picker integration
- **Portfolio tab**: Works with expandable gallery hierarchy — create/edit/reorder/delete works, add/edit/reorder/delete galleries under each work, upload/assign photos to galleries, set gallery covers
- **Settings tab**: Site settings (name, tagline, footer quote/attribution, email), navigation editor (add/edit/reorder/toggle visibility/delete nav items), Cloudflare connection status, config storage info

## Environment Variables
- `CF_ACCOUNT_ID` — Cloudflare account ID
- `CF_IMAGES_TOKEN` — Cloudflare Images API token (secret)
- `CF_IMAGES_HASH` — Cloudflare Images delivery hash
- `SESSION_SECRET` — Session secret

## Portfolio Hierarchy System (Phase 2 Complete)
Portfolio page supports 3 views via URL params (no page reload):
- **Works grid** (default): 2×2 tile grid from portfolioWorks, same dark tile design
- **Work detail** (`?work=WORK_ID`): Hero with cover image, info bar (camera/location/galleries), gallery cards grid
- **Gallery view** (`?work=WORK_ID&gallery=GAL_ID`): Hero + info bar + photo grid + full lightbox with keyboard nav

Key features:
- `history.pushState` navigation with browser back button support
- Back buttons: Gallery → Work Detail → Portfolio grid
- Lightbox with arrow nav, keyboard support (Esc, Left, Right)
- Falls back to static default tiles when no portfolioWorks exist
- Collections-grid block tiles now link directly to `?work=WORK_ID`

Gallery page updated to prefer hierarchy data via `TIA.getAllGalleries()`:
- Shows work title tag on each gallery card when hierarchy data exists
- Falls back to legacy `TIA.getSeries()` when no hierarchy galleries exist

Data layer helpers added to tia-data.js:
- `TIA.getWorkById(workId)` — find a work by ID
- `TIA.getGalleryPhotos(workId, galleryId)` — photos from a specific gallery
- `getPhotos()` and `getCoverUrl()` updated to check hierarchy galleries first, then fall back to legacy series

## CMS Phases
- **Phase 1** (COMPLETE): Block renderer engine + page conversion (5 pages now block-driven)
- **Phase 2** (COMPLETE): Portfolio hierarchy (Works → Galleries → Photos), portfolio page drill-down, gallery page update
- **Phase 3** (COMPLETE): Admin page builder (Pages tab with block editor), portfolio hierarchy admin, nav/settings editor
- **Phase 4** (NEXT): SEO meta editing, final responsive polish

## Deployment
- Target: autoscale
- Build: `node script/build.cjs`
- Run: `node dist/index.cjs`

## GitHub
- Repository: `Rla102277/mission-gallery`
- Integration connected via Replit GitHub connector
