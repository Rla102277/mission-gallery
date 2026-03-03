# The Infinite Arch - Photography Portfolio CMS

## Overview
JSON-config-driven CMS photography platform with a block-rendered page system and Wix-like admin page builder.

## Architecture
- **Frontend**: Block-rendered pages — thin HTML shells load blocks from config via `block-renderer.js`
- **Admin Panel**: `admin/index.html` — single-page admin for managing pages (block editor), portfolio works with gallery hierarchy, navigation, site settings, photos, and Cloudflare images
- **Config Storage**: PostgreSQL database (`site_config` table with JSONB column) — persists across deployments, shared between dev and production
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

### Block Types (22 total)
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
- `portfolio-statement` — Two-column artist statement (eyebrow+title+rule+byline left, quote+body+signature right)
- `gear-strip` — Dark strip showing camera gear items
- `work-block` — Side-by-side image+text for portfolio works (auto-generates from portfolioWorks, alternating layout/dark variants)
- `inquiry` — Dark section with eyebrow, title, subtitle, CTA button

### Default Block Seeds
Each page has hardcoded default blocks in `BlockRenderer.PAGE_DEFAULTS`:
- `home` — 11 blocks (hero wordmark, philosophy, dividers, collections, featured, process, callout, services, newsletter, quote)
- `portfolio` — 4 blocks (portfolio-statement, gear-strip, work-block auto, inquiry)
- `about` — 5 blocks (masthead, pull-quote, divider, article, quote)
- `prints` — 4 blocks (centered hero, details, badge, back-link)
- `hope-hike` — 4 blocks (centered hero, stats, purpose-quote, back-link)
- `contact` — 3 blocks (centered hero, email-link, back-link)

## Design System
- **Color Palette**: Light cream (#f5f0e8) background with dark ink (#0d0d0d) text EVERYWHERE. Hero sections and collection tiles stay dark (have own dark gradient backgrounds) with cream text. Gold (#b5922a) accents. NEVER set body to dark/ink background.
- **Typography**: Playfair Display (headings), Cormorant Garamond (body)
- **Visual Effects**: Grain overlay via body::before, radial gradient backgrounds, gold accent lines
- **CSS Files**: `tia.css` (base/nav/footer) + `blocks.css` (all block type styles including portfolio statement, gear strip, work blocks, inquiry)
- **CSS Variables**: `--rule-dark: rgba(13,13,13,0.12)` for borders, `--gold: #b5922a`

## Key Files
- `index.html` — Homepage thin shell (block-driven)
- `pages/portfolio.html` — Portfolio page thin shell (block-driven, artist statement + work blocks + inquiry)
- `pages/galleries.html` — Galleries page (4-level Lightroom-style drill-down: Collection Sets → Collections → Folders → Photos)
- `pages/about.html` — Artist Statement thin shell (block-driven)
- `pages/prints.html` — Prints thin shell (block-driven)
- `pages/hope-hike.html` — Hope Hike thin shell (block-driven)
- `pages/contact.html` — Contact thin shell (block-driven)
- `pages/gallery.html` — Interactive gallery viewer (special-purpose, not block-driven)
- `admin/index.html` — Admin panel (PIN-protected, case-insensitive "tia2026")
- `assets/js/block-renderer.js` — Block renderer engine with 22 block types + default seeds + initReveals()
- `assets/js/tia-data.js` — TIA data layer v8 (helpers: getPageBlocks, getPageMeta, getAllGalleries, getWorkById, getGalleryPhotos)
- `assets/js/tia.js` — Frontend site logic (scroll effects, mobile menu, page transitions)
- `assets/js/components.js` — Injects shared nav and footer across all pages (reads from config for dynamic nav/footer)
- `assets/css/tia.css` — Global styles: tokens, nav, footer, page-content wrapper, grain overlay
- `assets/css/blocks.css` — All block type CSS with responsive breakpoints
- `server/index.ts` — Express server with CF API proxy + config endpoints + static files
- `script/build.cjs` — Production build script

## Data Model (STATE / Config JSON)
- `pages` — Object keyed by slug: `{ title, metaDescription, blocks: [{ id, type, data }] }`
- `portfolioWorks` — Array of Collection Set objects: `{ id, title, subtitle, type, description, camera, location, format, coverAssetId, featuredImageId, galleries: [{ id, title, subtitle, coverAssetId, legacySeriesId, photos: [], folders: [{ id, title, coverAssetId, photos: [] }] }] }` — auto-seeded with 4 defaults if empty
- `siteSettings` — `{ siteName, tagline, footerQuote, footerAttr, email }`
- `navigation` — `[{ label, href, visible }]`
- `series` — Gallery metadata keyed by series ID (legacy)
- `photos` — Photo arrays keyed by series ID (legacy CF Image IDs)
- `prints` — Array of CF image IDs marked as available prints
- `home` — Homepage slot assignments (`{ hero_bg: cfImageId }`)
- `imgFolders` — Virtual folder organization
- `cf` — `{ hash, assetMeta: { cfImageId: { id, filename, exif } } }`

## Server API Endpoints
- `POST /api/images/upload` — Upload image via multer → Cloudflare Images API
- `DELETE /api/images/:id` — Delete image from Cloudflare Images
- `GET /api/images/list` — List all Cloudflare Images with pagination
- `GET /api/images/config` — Returns CF delivery hash for URL building
- `GET /api/config` — Read site configuration JSON
- `POST /api/config` — Write site configuration JSON
- `POST /api/ai/enrich` — AI text enrichment via Anthropic Claude (PIN-authenticated, X-Admin-Pin header required)

## AI Text Enrichment
- **Integration**: Replit AI Integrations for Anthropic (no API key needed, billed to Replit credits)
- **Endpoint**: `POST /api/ai/enrich` with `X-Admin-Pin` header for auth
- **Modes**: enrich (improve existing), generate (write from scratch), shorten, expand
- **Fields**: All text fields on portfolio works, galleries, and standalone series
- **UI**: Gold sparkle button next to enrichable fields, dropdown menu with 4 modes, loading spinner during API call

## Admin Panel Features
- **Portfolio tab**: Works with expandable gallery hierarchy — create/edit/reorder/delete works, add/edit/reorder/delete galleries, import default galleries into works, upload/assign photos to galleries, set gallery covers, inline editors with AI enrichment
- **Images tab**: Browse all CF images, organize into folders, assign to galleries (under portfolio works), set as portfolio cover, mark as print, assign to legacy series, upload, delete, EXIF display on cards
- **Pages tab**: Page builder — select page (Home/Portfolio/About/Prints/Hope Hike/Contact), view/add/edit/reorder/duplicate/delete blocks with type-specific form editors, page title & meta description, image picker integration
- **Settings tab**: Site settings (name, tagline, footer quote/attribution, email), navigation editor, Cloudflare connection status

## Portfolio & Gallery Hierarchy System (Lightroom-style)
Galleries page supports 4-level Lightroom-style hierarchy via URL params:
- **Collection Sets grid** (default): 2×2 tile grid from portfolioWorks
- **Collection Set detail** (`?work=WORK_ID`): Hero + info bar + collection cards grid
- **Collection detail** (`?work=WORK_ID&gallery=GAL_ID`): If has folders → folder cards grid + unsorted photos; if no folders → photo grid + lightbox
- **Folder view** (`?work=WORK_ID&gallery=GAL_ID&folder=FLD_ID`): Hero + photo grid + lightbox

Portfolio page is a separate block-driven page showing artist statement, gear strip, work blocks with cover images, and print inquiry section.

Admin terminology: Collection Sets (works), Collections (galleries), Folders (new sub-level under collections). Folders support upload, library assignment, cover photos, reordering, and move-photo-to-folder from collection root.

## Environment Variables
- `CF_ACCOUNT_ID` — Cloudflare account ID
- `CF_IMAGES_TOKEN` — Cloudflare Images API token (secret)
- `CF_IMAGES_HASH` — Cloudflare Images delivery hash
- `SESSION_SECRET` — Session secret

## Deployment
- Target: autoscale
- Build: `node script/build.cjs`
- Run: `node dist/index.cjs`

## GitHub
- Repository: `Rla102277/mission-gallery`
- Integration connected via Replit GitHub connector
