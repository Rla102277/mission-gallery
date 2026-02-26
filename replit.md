# The Infinite Arch - Photography Portfolio

## Overview
Static HTML hosting for "The Infinite Arch" photography portfolio website with an admin management panel.

## Architecture
- **Frontend**: Static HTML/CSS/JS files served by Express
- **Admin Panel**: `admin/index.html` — single-page admin for managing photos, series, homepage slots, and portfolio covers
- **Config Storage**: Cloudinary raw JSON (`tia-config.json`) stores all site configuration
- **Photo Hosting**: Cloudflare Images (primary), with legacy Cloudinary and optional Adobe Lightroom fallback
- **Server**: Express with multer — proxies uploads to Cloudflare Images API (protects API token)
- **Build**: `script/build.cjs` copies static files to `dist/public/` and creates `dist/index.cjs` Express server

## Key Files
- `index.html` — Main site homepage
- `pages/` — Site pages (about, gallery, portfolio, prints, contact, hope-hike)
- `admin/index.html` — Admin panel (PIN-protected, case-insensitive "tia2026")
- `assets/js/tia-data.js` — TIA data layer v6 (CF Images + Cloudinary + Lightroom URL resolution)
- `assets/js/tia.js` — Frontend site logic
- `assets/js/components.js` — Reusable UI components
- `assets/css/tia.css` — Site styles
- `assets/svg/` — SVG brand assets (wordmarks, medallions)
- `server/index.ts` — Express server with Cloudflare Images API proxy + static files
- `script/build.cjs` — Production build script (includes CF API endpoints)
- `script/push-to-github.ts` — GitHub push script

## Server API Endpoints
- `POST /api/images/upload` — Upload image via multer → Cloudflare Images API
- `DELETE /api/images/:id` — Delete image from Cloudflare Images
- `GET /api/images/config` — Returns CF delivery hash for URL building

## Admin Panel Features
- **Upload tab** (primary): Drag-and-drop image uploads via server to Cloudflare Images, assigned to series
- **Galleries tab**: Browse series, set covers, remove photos
- **Homepage tab**: Assign photos to homepage slots (hero, carousel, etc.)
- **Portfolio tab**: Assign featured work covers
- **Lightroom tab** (optional): Adobe Creative Cloud integration for importing from Lightroom albums
- **Settings tab**: Edit series titles, subtitles, descriptions

## Environment Variables
- `CF_ACCOUNT_ID` — Cloudflare account ID
- `CF_IMAGES_TOKEN` — Cloudflare Images API token (secret)
- `CF_IMAGES_HASH` — Cloudflare Images delivery hash
- `SESSION_SECRET` — Session secret

## Photo Resolution (TIA-DATA v6)
Photos can come from three sources (checked in order):
1. **Cloudflare Images** — stored in `cf.assetMeta`, URLs via `imagedelivery.net/{hash}/{id}/{variant}`
   - Variants: thumb, cover, hero, full, public
2. **Cloudinary uploads** (legacy) — stored in `cl.assetMeta`, URLs derived from public_id
3. **Lightroom imports** — stored in `lr.assetMeta`, URLs from Adobe CDN

## Cloudinary Config (for config storage + legacy photos)
- Cloud: `duxiir9lv`
- Folder: `tia`
- Preset: `tia_unsigned`
- Config URL: `https://res.cloudinary.com/duxiir9lv/raw/upload/tia/tia-config.json`

## Deployment
- Target: autoscale
- Build: `node script/build.cjs`
- Run: `node dist/index.cjs`

## GitHub
- Repository: `Rla102277/mission-gallery`
- Integration connected via Replit GitHub connector
