# The Infinite Arch

**Fine art landscape and expedition photography. Beyond the Daydream.**

This repo is the whole Infinite Arch website plus the CMS that runs it. It is not a static site anymore. It is a Node/Express app with a Postgres-backed config, a block-based page builder, a full admin panel, Lightroom and SmugMug photo pipelines, AI writing help, and server-rendered story pages for individual photographs.

In one breath: I edit everything (pages, portfolio, galleries, photos, stories, nav, settings) in `/admin`, hit **Save & Publish**, and the public site re-renders from that config. No code changes needed for content.

---

## What it does

### The public site

| Route | What it is |
|---|---|
| `/` | Homepage, rendered from blocks (hero wordmark, philosophy, collections, featured work, process, Hope Hike callout, services, newsletter, quote) |
| `/pages/portfolio.html` | Artist statement, gear strip, one work block per Collection Set, print inquiry |
| `/pages/galleries.html` | Lightroom-style drill-down: Collection Sets → Collections → Folders → Photos, with lightbox |
| `/pages/about.html` | Artist statement / about |
| `/pages/prints.html` | Print details and how to buy |
| `/pages/hope-hike.html` | The Hope Hike, Guadalupe Peak, May 29 to 31, 2026 |
| `/pages/contact.html` | Contact |
| `/pages/gallery.html` | Older standalone gallery viewer (not block-driven) |
| `/pages/{any-slug}.html` | Custom pages made in the admin page builder. No HTML file exists; the server builds the shell from config |
| `/work/{slug}` | Single-photo story page, server-rendered for SEO (see below) |
| `/sitemap.xml` | Auto-generated: core pages, custom pages, and every published story page |
| `/admin` | The CMS (sign-in required) |

**Galleries and lightbox**
- Four levels, all driven by URL params: `?work=` → `?work=&gallery=` → `?work=&gallery=&folder=`
- Collections with folders show folder cards plus any unsorted photos; collections without folders go straight to the photo grid
- Lightbox with prev/next, keyboard nav, counter, captions and alt text pulled from per-image metadata
- **Buy / Print** button deep-links to that photo's SmugMug page. There is no custom cart or checkout, on purpose
- **View Story →** link appears in the lightbox when the photo has a story page

**Story pages (`/work/{slug}`)**
- One page per photograph that has "Story Page" turned on in the admin
- Server-rendered `<title>`, meta description, `og:image`, and JSON-LD `VisualArtwork` so they index and share well
- Shows story title, story body, location, camera, year
- If sale data is set: open vs. limited edition, edition size and status, print sizes with prices, and an inquiry-only buy button (prefilled mailto). Payment is not wired up yet, and the page never changes `editionsSold`
- Unknown or disabled slugs get a designed "Not on view" 404

**Look and feel**
- Cream background (`#f5f0e8`), ink text (`#0d0d0d`), gold accents (`#b5922a`); heroes and collection tiles stay dark
- Playfair Display for headings, Cormorant Garamond for body
- Grain overlay, scroll reveal animations, page transitions, shared nav/footer injected on every page and driven by config

### The admin (`/admin`)

Sign in with Replit. Only emails in `ADMIN_EMAILS` get in (defaults to mine). Five tabs:

**Portfolio**
- Create, edit, reorder, delete Collection Sets (works): title, subtitle, type, description, camera, location, format, cover, featured image
- Collections (galleries) inside each set, and Folders inside each collection
- Add photos from SmugMug, set covers, reorder, move photos from a collection root into a folder
- Import the default galleries into a work

**Images**
- Browse the photo library, organize into virtual folders, assign to collections/folders, set portfolio covers, mark as prints, EXIF on cards
- **Lightroom source toggle:** browse my Lightroom albums and assets, multi-select, then **Push N to...** or **Push Entire Album to...** any mix of collections and folders. Each asset's 2048px rendition is pulled from Lightroom, uploaded to Cloudflare Images as `lr-{assetId}`, and written into config. **Resync** re-pulls fresh renditions and cache-busts every reference
- **Edit Metadata** on every card: one grouped modal for
  - Display: title, caption, alt text, location, camera, year
  - Story Page: on/off, story title, slug (auto-generated, collision-checked), story body
  - Sale: none / open / limited, edition size, print sizes as `Label | Price` lines (editions sold and print master are read-only)
  - Shows filename, image ID, and every gallery/folder the image appears in
  - Saving pushes title/caption/alt text into every place that photo is embedded and tells you how many places it updated
- **Bulk edit** 2+ images with per-field Apply checkboxes (location, camera, year, sale type, print sizes add/replace). Unchecked fields are never touched
- Filter bar: search by filename/title/gallery, plus quick filters for Missing alt text, Missing story, Marked for sale. SALE badge on cards

**Stories**
- Long-form stories: title, slug, draft/published status, hero image, location/camera/year
- Body built from text blocks and image blocks (picked from the shared image picker)
- Note: the Stories tab manages `config.stories`. The public `/work/{slug}` pages currently come from per-image metadata, not this tab

**Pages** (page builder)
- Pick any page, then add, edit, reorder, duplicate, delete blocks with type-specific forms and the image picker
- Page title and meta description per page
- **+ Add Page:** name, auto slug (validated, unique, reserved slugs blocked), optional nav entry and position, start blank or clone an existing page. Custom pages get View and Delete (delete also removes the nav entry)

**Settings**
- Site name, tagline, footer quote and attribution, contact email
- Navigation editor (labels, links, visibility, order)
- Image service connection status

**AI writing help** (everywhere there's a gold sparkle)
- Four modes: **Enrich**, **Generate**, **Shorten**, **Expand**
- Works on portfolio works, galleries, pages, and per-photo fields (title, caption, alt text, story title, story body)
- Runs on Claude through Replit AI Integrations, prompted for a literary, contemplative, no-marketing-speak voice. Photo fields get photo-specific hints (alt text stays factual and under 125 characters)

### Block types (22)

`hero` (wordmark, standard, centered, masthead) · `text` (default, pull-quote, article) · `divider` · `collections-grid` · `featured-list` · `process-grid` · `callout` · `services-grid` · `newsletter` · `quote` · `stats-bar` · `image-text` · `photo-grid` · `details-list` · `badge` · `email-link` · `purpose-quote` · `back-link` · `portfolio-statement` · `gear-strip` · `work-block` (auto-builds from portfolio works) · `inquiry`

Every built-in page has default blocks in `BlockRenderer.PAGE_DEFAULTS`, so a page still renders if its config is empty.

---

## How it works

```
Browser ──► Express (server/index.ts)
              ├── static files (index.html, /pages, /assets, /admin)
              ├── /api/config  ◄──► Postgres site_config (one JSONB row)
              │                      └─ mirrored to data/tia-config.json as fallback
              ├── /pages/{slug}.html, /work/{slug}, /sitemap.xml  (rendered from config)
              ├── /api/smugmug/*   ──► SmugMug API (public albums, server-side key)
              ├── /api/adobe/*, /api/lightroom/*  ──► Adobe Lightroom ──► Cloudflare Images
              ├── /api/ai/enrich   ──► Claude (Replit AI Integrations)
              └── /api/login, /api/callback, /api/logout  ──► Replit Auth
```

- **Pages are thin HTML shells.** They load `tia-data.js` and `block-renderer.js`, fetch `/api/config`, and render `config.pages[slug].blocks` (or the defaults) into `#pageBlocks`
- **Config is the CMS.** Everything lives in one JSON document: `pages`, `portfolioWorks`, `siteSettings`, `navigation`, `stories`, `prints`, `home`, `imgFolders`, `cf.assetMeta` (per-image metadata), plus legacy `series`/`photos`
- **The server caches config in memory** and refreshes from Postgres in the background. If the DB is down or slow (3s timeout), it falls back to `data/tia-config.json`
- **Photos come in two shapes:** SmugMug objects (`{ imageKey, webUri, sizes: {...} }`) and Cloudflare/Lightroom image IDs. Always render through `TIA.photoUrl()` / `TIA._mapPhotoIds()`, never by string-munging a photo entry
- **Lightroom is never served live.** Public pages only use SmugMug or `imagedelivery.net` URLs stored in config

### API

| Method | Route | Auth | Does |
|---|---|---|---|
| GET | `/api/config` | public | Read site config |
| POST | `/api/config` | admin | Save the whole config (Save & Publish) |
| GET | `/api/smugmug/albums` | admin | List SmugMug albums |
| GET | `/api/smugmug/albums/:albumKey/images` | admin | List images in an album |
| GET | `/api/images/list` | admin | List Cloudflare Images (paged) |
| GET | `/api/images/config` | public | Cloudflare delivery hash |
| POST | `/api/ai/enrich` | admin | AI text: enrich / generate / shorten / expand |
| GET | `/api/adobe/client-id` | admin | Adobe client ID for OAuth |
| POST | `/api/adobe/token`, `/api/adobe/refresh-token` | admin | Exchange / refresh Lightroom tokens |
| GET | `/api/adobe/test-token` | admin | Check a Lightroom token |
| GET | `/api/lightroom/cdn-status` | admin | Is Cloudflare Images configured? |
| POST | `/api/lightroom/push` | admin | Lightroom asset → Cloudflare → config destinations |
| POST | `/api/lightroom/resync` | admin | Re-pull and cache-bust a pushed asset |
| GET | `/api/auth/user` | signed in | Current user + admin flag |
| GET | `/api/login`, `/api/callback`, `/api/logout` | | Replit Auth flow |
| GET | `/test/lightroom` | | Lightroom connect page |

---

## Running it

```bash
npm install
npm run dev        # tsx server/index.ts on :5000
npm run check      # TypeScript check
node script/build.cjs   # bundles server to dist/index.cjs + copies site to dist/public
npm start          # production: node dist/index.cjs
```

When `REPL_ID` isn't set (local dev), the admin email check is skipped so you can work without Replit Auth.

### Environment

| Variable | For |
|---|---|
| `DATABASE_URL` | Postgres (config store + sessions) |
| `SESSION_SECRET` | Sessions |
| `ADMIN_EMAILS` | Comma-separated admin emails |
| `SMUGMUG_API_KEY` | SmugMug API. **Server-side only, never in client code or config** |
| `SMUGMUG_NICKNAME` | SmugMug account (defaults to `theinfinitearch`) |
| `CF_ACCOUNT_ID`, `CF_IMAGES_TOKEN`, `CF_IMAGES_HASH` | Cloudflare Images (Lightroom push target) |
| `ADOBE_CLIENT_ID`, `ADOBE_CLIENT_SECRET` | Lightroom OAuth |
| `CLIENT_URL` | Public base URL (OAuth redirects) |
| `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`, `AI_INTEGRATIONS_ANTHROPIC_API_KEY` | AI enrichment (set by Replit) |
| `ISSUER_URL`, `REPL_ID` | Replit Auth (set by Replit) |

Never commit `.env`.

### Deploying

Production runs on **Replit autoscale**: build `node script/build.cjs`, run `node dist/index.cjs` (see `.replit`).

- **Dev and production have separate databases.** Edits in the live admin only exist in prod, and code fixes need a republish to reach prod
- Direct SQL edits to `site_config` aren't picked up until the server restarts
- Every domain used for Lightroom connect has to be registered as a redirect URI in the Adobe developer console
- SmugMug's public key only sees **public** albums. If an album is missing, check its privacy first
- `netlify.toml` is left over from the original static-site version. Netlify can't run the API, so it isn't the live host

### Helper scripts

| Script | Does |
|---|---|
| `sync-db-to-file.ts` | Copy the Postgres config down to `data/tia-config.json` |
| `migrate-stories.ts` | Initialize / migrate `config.stories` |
| `migrate-where-dragons-fly.ts` | One-off: build the "Where Dragons Fly" story from its Lightroom image |

Run with `npx tsx <script>.ts`.

---

## Repo map

```
index.html                 Homepage shell
pages/                     Page shells + galleries.html, gallery.html, lightroom-connect.html
admin/index.html           The whole admin SPA
assets/js/
  block-renderer.js        22 block types, page defaults, scroll reveals
  tia-data.js              Data layer: photo URL helpers, page/work/gallery lookups, story links
  components.js            Shared nav + footer from config
  tia.js                   Scroll effects, mobile menu, page transitions
  lightroom-auth.js        Browser-side Lightroom token handling
assets/css/                tia.css (base/nav/footer) + blocks.css (every block)
server/
  index.ts                 Express app, config store, dynamic pages, story pages, sitemap, AI
  smugmug.ts               SmugMug API client
  adobe.ts                 Lightroom OAuth
  lightroom.ts             Lightroom → Cloudflare push / resync
  replit_integrations/     Replit Auth + admin gate
data/tia-config.json       Config file fallback / backup
script/build.cjs           Production build
.agents/memory/            Hard-won gotchas for anyone (human or AI) working on this
AGENTS.md, replit.md       Rules and architecture notes for coding agents
```

---

## Ground rules

- No custom cart or checkout. Buying always deep-links to SmugMug (or inquiry for editions)
- SmugMug key stays on the server
- Photos render through the TIA helpers, both formats, every time
- After changes: `npm run check`, then `npm run dev`. Not done until both pass

---

## Brand

- **Tagline:** Beyond the Daydream
- **Type:** Playfair Display · Cormorant Garamond
- **Color:** ink `#0d0d0d` · cream `#f5f0e8` · gold `#b5922a`
- **Voice:** Sean O'Connell. Quiet certainty, earned wisdom
- *"Beautiful things don't ask for attention."* (Sean O'Connell)
