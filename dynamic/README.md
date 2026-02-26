# The Infinite Arch
## theinfinitearch.com

Fine Art Landscape Photography — Beyond the Daydream

---

## Site Structure

```
/                          → Homepage
/pages/portfolio.html      → Portfolio hub (4 collections)
/pages/about.html          → Artist statement
/pages/prints.html         → Print store (Squarespace embed)
/pages/hope-hike.html      → Hope Hike — Guadalupe Peak 2026
/pages/contact.html        → Contact
/gallery/iceland.html      → Iceland gallery (coming soon)
/gallery/texas.html        → Texas gallery (coming soon)
/assets/css/tia.css        → Global styles
/assets/js/tia.js          → Global JavaScript
/assets/js/components.js   → Shared nav + footer
/assets/svg/               → Logo SVGs
```

---

## Setup: Step by Step

### Step 1 — Replit (your workshop)

1. Go to [replit.com](https://replit.com) and create a free account
2. Click **Create Repl** → choose **HTML, CSS, JS** template
3. Name it `the-infinite-arch`
4. Delete the default files (index.html, style.css, script.js)
5. Upload this entire folder by dragging it into the Replit file panel
6. Click **Run** — you'll see a live preview URL like `https://the-infinite-arch.yourusername.repl.co`

> Your site is now live on Replit. Any change you make and save shows instantly.

---

### Step 2 — GitHub (the bridge, invisible to you)

1. Go to [github.com](https://github.com) and create a free account
2. Click **New Repository** → name it `the-infinite-arch` → set to **Private** → Create
3. In Replit: click the **Git** tab (branch icon in sidebar)
4. Connect to your GitHub repo — Replit walks you through this with one button
5. Every time you want to publish changes: click **Commit & Push** in the Git tab

> GitHub is just a save point. You don't need to understand it — just connect it once.

---

### Step 3 — Netlify (your production site)

1. Go to [netlify.com](https://netlify.com) and create a free account
2. Click **Add new site** → **Import an existing project** → **GitHub**
3. Authorize Netlify to access your GitHub → select `the-infinite-arch` repo
4. Build settings: leave everything blank (it's a static site, no build needed)
5. Click **Deploy site**
6. Netlify gives you a URL like `https://infinite-arch-xyz.netlify.app`
7. Go to **Site settings → Domain management** → Add custom domain → `theinfinitearch.com`

> Every time you push from Replit → GitHub, Netlify auto-deploys in ~30 seconds.

---

### Step 4 — Domain (optional but recommended)

1. Buy `theinfinitearch.com` at [Namecheap](https://namecheap.com) (~$12/yr) or [Cloudflare](https://cloudflare.com) (~$10/yr)
2. In Netlify: **Domain settings** → copy the Netlify nameservers
3. In your domain registrar: update nameservers to Netlify's
4. Wait 24 hours → your domain is live

---

### Step 5 — Adding Photos (Cloudinary)

Photos are served from Cloudinary, not stored in this repo. To add images:

1. Log into your Cloudinary account
2. Upload images to the appropriate folder:
   - `tia/iceland/` — Iceland series
   - `tia/texas/` — Texas landscape
   - `tia/people/` — Figures in the threshold
   - `tia/film/` — Konica Hexar work
3. Copy the Cloudinary URL for each image
4. Use the URL format: `https://res.cloudinary.com/YOUR_CLOUD/image/upload/tia/iceland/filename.jpg`

---

## Making Changes

**To edit text:** Open the HTML file in Replit → find the text → change it → save → the preview updates instantly → commit and push to go live.

**To add a new expedition:** Duplicate `/gallery/iceland.html` (once built) → rename it → update the title and images → add a tile to `/pages/portfolio.html`.

**To change the logo:** Replace the SVG files in `/assets/svg/`.

---

## Tech Stack

| Layer | Tool | Cost |
|-------|------|------|
| Workshop | Replit | Free |
| Version control | GitHub | Free |
| Hosting | Netlify | Free |
| Images | Cloudinary | Free (25GB) |
| Domain | Namecheap | ~$12/yr |
| Print store | Squarespace + Lumaprints | TBD |

**Total: ~$12/year**

---

## Brand

- **Typefaces:** Playfair Display (display) · Cormorant Garamond (body)
- **Colors:** `#0d0d0d` ink · `#f5f0e8` cream · `#c9a227` gold
- **Voice:** Sean O'Connell — quiet certainty, earned wisdom
- **Tagline:** Beyond the Daydream
- **Quote:** "Beautiful things don't ask for attention." — Sean O'Connell
