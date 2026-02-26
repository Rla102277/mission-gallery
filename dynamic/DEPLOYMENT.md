# Mission Gallery — TIA Reskin — Deployment Guide

## What Changed
Only these files were touched — everything else is identical to the original repo:

**New / replaced (public-facing):**
- `src/index.css` — TIA design system (ink/cream/gold, Playfair + Cormorant fonts, film grain)
- `src/App.jsx` — routing wired up correctly
- `src/components/Navbar.jsx` — TIA wordmark, dark nav, mobile overlay
- `src/components/Footer.jsx` — minimal dark footer
- `src/components/Lightbox.jsx` — full-screen photo viewer with keyboard nav
- `src/pages/Home.jsx` — hero + 8-series grid
- `src/pages/PublicGalleries.jsx` — gallery grid with thumbnails
- `src/pages/PublicGallery.jsx` — **Lightroom images load via /api/adobe/image-proxy**
- `src/pages/Login.jsx` — TIA-styled Google OAuth
- `src/pages/AboutMe.jsx` — TIA layout
- `src/pages/MyGear.jsx` — TIA layout
- `src/pages/PortfolioView.jsx` — TIA layout
- `tailwind.config.js` — safelist for TIA classes
- `vite.config.js` — removed localhost SSL certs (broke builds)
- `firebase.json` — removed broken functions reference
- `.env.production` — points to Render backend

**Untouched (admin + backend):**
- Entire `/server` folder
- All admin pages (AdminDashboard, GalleryView, CreateGallery, etc.)
- All admin components (LightroomAlbumSelector, GearEditor, etc.)
- AuthContext, api.js, lightroomAuth.js

---

## How Lightroom Images Work

The public gallery page:
1. Fetches the gallery doc from MongoDB (slug → gallery metadata including `lightroomAlbum.id`, `visibleLightroomPhotos`)
2. Gets the Lightroom access token from localStorage (set when user logs into Lightroom via Admin → Lightroom Test)
3. Calls Adobe Lightroom API directly from the browser to get photo assets
4. Builds proxied thumbnail URLs: `/api/adobe/image-proxy?url=...&token=...`
5. The backend server fetches the image from Adobe with the token and streams it back (avoids CORS)

**This means for photos to appear publicly:** the user must have logged into Lightroom at least once via the Admin panel (the token refreshes automatically using the refresh token stored in localStorage).

---

## Deployment Steps

### 1. Render (Backend)
- Build Command: `npm install`
- Start Command: `node server/index.js`
- Add all env vars from `RENDER-ENV.txt`

### 2. Google OAuth
Add to your OAuth credentials in Google Cloud Console:
- Authorized JavaScript Origins: `https://mission-gallery-app.web.app`
- Authorized Redirect URIs: `https://mission-gallery.onrender.com/auth/google/callback`

### 3. Firebase (Frontend)
```bash
npm run build
firebase deploy
```

### 4. First-time Lightroom Setup
1. Go to `https://mission-gallery-app.web.app/login`
2. Sign in with Google → lands on `/admin`
3. In Admin, navigate to Lightroom Test
4. Authenticate with Adobe
5. Set up catalogs/albums
6. Create galleries linked to Lightroom albums
7. Select which photos are visible
8. Toggle gallery to `isPublic = true`
9. Photos now appear on the public gallery page
