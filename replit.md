# The Infinite Arch - Photography Portfolio

## Overview
Static HTML hosting for "The Infinite Arch" photography portfolio website with an admin management panel.

## Architecture
- **Frontend**: Static HTML/CSS/JS files served by Express
- **Admin Panel**: `admin/index.html` — single-page admin for managing photos, series, homepage slots, and portfolio covers
- **Config Storage**: Server-side JSON (`/api/config` → `data/tia-config.json`)
- **Photo Hosting**: Cloudflare Images (sole image server)
- **Server**: Express with multer — proxies uploads to Cloudflare Images API (protects API token)
- **Build**: `script/build.cjs` copies static files to `dist/public/` and creates `dist/index.cjs` Express server

## Design System
- **Color Palette**: Cream (#f5f0e8) background, dark ink (#0d0d0d) text, gold (#b5922a) accents — light editorial theme matching the about page
- **Typography**: Playfair Display (headings), Cormorant Garamond (body)
- **Visual Effects**: Grain overlay via body::before, radial gradient backgrounds, gold accent lines
- **CSS Loading Order**: tia.css FIRST, then page-specific inline `<style>` blocks (so page-specific rules override base)
- **CSS Variables**: `--rule: rgba(13,13,13,0.12)` for borders on light pages, `--gold: #b5922a`

## Key Files
- `index.html` — Homepage: full-bleed hero with animated wordmark, philosophy, 2×2 collections grid, featured projects, process cards, Hope Hike callout, services, newsletter, quote strip. Dynamic content from portfolioWorks.
- `pages/portfolio.html` — Portfolio: dark hero + section intro + 2×2 tile grid from portfolioWorks data, hover reveal animations
- `pages/about.html` — Artist Statement: cream/warm background (intentionally different from dark pages)
- `pages/gallery.html` — Interactive gallery viewer: self-contained with its own nav, sage-light background, series navigation, lightbox, dynamic photo loading from TIA data layer
- `pages/contact.html` — Contact page: dark hero with email link, polished layout
- `pages/prints.html` — Prints page: dark "coming soon" with archival print details
- `pages/hope-hike.html` — Hope Hike expedition page: dark hero with Guadalupe Peak stats, date, purpose quote
- `admin/index.html` — Admin panel (PIN-protected, case-insensitive "tia2026")
- `assets/js/tia-data.js` — TIA data layer v7 (CF Images only, server-side config via /api/config)
- `assets/js/tia.js` — Frontend site logic (scroll effects, mobile menu, page transitions)
- `assets/js/components.js` — Injects shared nav and footer across all pages (except gallery which has its own)
- `assets/css/tia.css` — Global styles: dark theme tokens, nav, footer, page-content wrapper, grain overlay
- `assets/svg/` — SVG brand assets (wordmarks, medallions)
- `server/index.ts` — Express server with Cloudflare Images API proxy + config endpoints + static files + [CF] server-side logging for all CF API calls and config saves
- `script/build.cjs` — Production build script (includes CF API endpoints)
- `script/push-to-github.ts` — GitHub push script

## Server API Endpoints
- `POST /api/images/upload` — Upload image via multer → Cloudflare Images API
- `DELETE /api/images/:id` — Delete image from Cloudflare Images
- `GET /api/images/list` — List all Cloudflare Images with pagination
- `GET /api/images/config` — Returns CF delivery hash for URL building
- `GET /api/config` — Read site configuration JSON
- `POST /api/config` — Write site configuration JSON

## Admin Panel Features
- **Galleries tab**: Browse/create/delete series, set covers, upload photos, edit metadata (title, subtitle, type, number, camera, location, description)
  - Default galleries (s1-s8) cannot be deleted
  - Custom galleries can be created/deleted freely
  - "+ New Gallery" button at bottom of sidebar
- **Images tab**: Browse all CF images, organize into virtual folders, assign to series, upload, delete
- **Homepage tab**: Assign photos to homepage slots (hero background only — homepage uses CSS gradients + portfolioWorks covers for tiles)
- **Portfolio tab**: Create/edit/remove/reorder featured work blocks — each with cover photo, title, subtitle, type, description, camera, location, format
  - `STATE.portfolioWorks` array stores work objects with {id, title, subtitle, type, description, camera, location, format, coverAssetId}
  - Both homepage and portfolio page dynamically render from this data
- **Settings tab**: Shows CF connectivity status (delivery hash, image count, test connection) and server-side config storage info (storage method, last save, counts)

## Data Model (STATE object)
- `series` — Gallery metadata keyed by series ID (s1-s8 for defaults, g-{timestamp} for custom)
- `photos` — Photo arrays keyed by series ID (Cloudflare Image IDs)
- `home` — Homepage slot assignments (slot ID → CF image ID)
- `portfolioWorks` — Array of featured work objects for portfolio page (title, subtitle, type, description, camera, location, format, coverAssetId)
- `imgFolders` — Virtual folder organization for Images tab
- `cf.assetMeta` — Cloudflare Images metadata (including EXIF data)
- `cf.hash` — Cloudflare Images delivery hash

## Environment Variables
- `CF_ACCOUNT_ID` — Cloudflare account ID
- `CF_IMAGES_TOKEN` — Cloudflare Images API token (secret)
- `CF_IMAGES_HASH` — Cloudflare Images delivery hash
- `SESSION_SECRET` — Session secret

## Photo Resolution (TIA-DATA v7)
Photos served exclusively via Cloudflare Images:
- URLs: `imagedelivery.net/{hash}/{id}/{variant}`
- Variants: thumb, cover, hero, full, public
- Config loaded from `/api/config`, falls back to localStorage

## Series (Galleries)
- `TIA.getSeries()` merges DEFAULT_SERIES (s1-s8) with custom series from STATE
- Custom series IDs are prefixed with `g-` followed by timestamp
- Gallery page (`pages/gallery.html`) renders dynamically from `TIA.getSeries()`

## Deployment
- Target: autoscale
- Build: `node script/build.cjs`
- Run: `node dist/index.cjs`

## GitHub
- Repository: `Rla102277/mission-gallery`
- Integration connected via Replit GitHub connector
