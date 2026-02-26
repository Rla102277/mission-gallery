# The Infinite Arch - Photography Portfolio

## Overview
Static HTML hosting for "The Infinite Arch" photography portfolio website with an admin management panel.

## Architecture
- **Frontend**: Static HTML/CSS/JS files served by Express
- **Admin Panel**: `admin/index.html` — single-page admin for managing photos, series, homepage slots, and portfolio covers
- **Config Storage**: Cloudinary raw JSON (`tia-config.json`) stores all site configuration
- **Photo Hosting**: Cloudinary (primary) with optional Adobe Lightroom integration
- **Build**: `script/build.cjs` copies static files to `dist/public/` and creates `dist/index.cjs` Express server

## Key Files
- `index.html` — Main site homepage
- `pages/` — Site pages (about, gallery, portfolio, prints, contact, hope-hike)
- `admin/index.html` — Admin panel (PIN-protected, case-insensitive "tia2026")
- `assets/js/tia-data.js` — TIA data layer (Cloudinary + Lightroom URL resolution)
- `assets/js/tia.js` — Frontend site logic
- `assets/js/components.js` — Reusable UI components
- `assets/css/tia.css` — Site styles
- `assets/svg/` — SVG brand assets (wordmarks, medallions)
- `server/index.ts` — Express static file server
- `script/build.cjs` — Production build script
- `netlify.toml` — Netlify configuration (if deploying there)

## Admin Panel Features
- **Upload tab** (primary): Direct Cloudinary image uploads with drag-and-drop, assigned to series
- **Galleries tab**: Browse series, set covers, remove photos
- **Homepage tab**: Assign photos to homepage slots (hero, carousel, etc.)
- **Portfolio tab**: Assign featured work covers
- **Lightroom tab** (optional): Adobe Creative Cloud integration for importing from Lightroom albums
- **Settings tab**: Edit series titles, subtitles, descriptions

## Cloudinary Config
- Cloud: `duxiir9lv`
- Folder: `tia`
- Preset: `tia_unsigned`
- Config URL: `https://res.cloudinary.com/duxiir9lv/raw/upload/tia/tia-config.json`

## Photo Resolution
Photos can come from two sources:
1. **Cloudinary uploads** — stored in `cl.assetMeta`, URLs derived from public_id with transformations
2. **Lightroom imports** — stored in `lr.assetMeta`, URLs from Adobe CDN
Resolution checks Cloudinary first, then falls back to Lightroom.

## Deployment
- Target: autoscale
- Build: `node script/build.cjs`
- Run: `node dist/index.cjs`

## GitHub
- Repository: `Rla102277/mission-gallery`
- Integration connected via Replit GitHub connector
