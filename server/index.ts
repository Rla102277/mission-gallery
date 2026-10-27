import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";
import pg from "pg";
import Anthropic from "@anthropic-ai/sdk";
import { setupAuth, registerAuthRoutes, requireAdmin, isAuthenticated, ensureAuthTables } from "./replit_integrations/auth";
import { getAlbums, getAlbumImages } from "./smugmug";
import { registerAdobeRoutes } from "./adobe";
import { registerLightroomRoutes } from "./lightroom";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 5000;
app.use(express.json({ limit: "10mb" }));

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

let configCache: Record<string, any> = {};

async function queryWithTimeout<T>(queryFn: () => Promise<T>, timeoutMs: number = 3000): Promise<T | null> {
  try {
    return await Promise.race([
      queryFn(),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error("Query timeout")), timeoutMs)
      )
    ]);
  } catch (err) {
    return null;
  }
}

async function loadConfigFromDB(): Promise<Record<string, any> | null> {
  const result = await queryWithTimeout(async () => {
    const res = await pool.query("SELECT config FROM site_config WHERE id = 1");
    return res.rows.length > 0 ? res.rows[0].config : null;
  }, 3000);
  return result;
}

function loadConfigFromFile(): Record<string, any> {
  try {
    const configPath = path.join(__dirname, "..", "data", "tia-config.json");
    const content = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    console.log("[Config] File fallback failed, using empty config");
    return {};
  }
}

async function initializeConfigCache() {
  console.log("[Config] Initializing cache...");
  const dbConfig = await loadConfigFromDB();
  if (dbConfig) {
    configCache = dbConfig;
    console.log("[Config] Loaded from Postgres");
  } else {
    configCache = loadConfigFromFile();
    console.log("[Config] Loaded from file fallback (DB unavailable or timeout)");
  }
  
  // Ensure smugmug config exists
  if (!configCache.smugmug) {
    configCache.smugmug = { nickname: process.env.SMUGMUG_NICKNAME || 'theinfinitearch' };
  }
}

function refreshConfigFromDB() {
  loadConfigFromDB().then(dbConfig => {
    if (dbConfig) {
      configCache = dbConfig;
      console.log("[Config] Background refresh from Postgres succeeded");
    }
  }).catch(() => {
    // Silently skip on DB errors
  });
}

function writeConfigToFile(config: Record<string, any>) {
  try {
    const configPath = path.join(__dirname, "..", "data", "tia-config.json");
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log("[Config] Written to file fallback");
  } catch (err) {
    console.log("[Config] File write failed:", err);
  }
}

async function persistConfig(config: Record<string, any>) {
  await pool.query(
    `INSERT INTO site_config (id, config, updated_at) VALUES (1, $1::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET config = EXCLUDED.config, updated_at = NOW()`,
    [JSON.stringify(config)]
  );
  configCache = config;
  writeConfigToFile(config);
}

async function ensureConfigTable() {
  await queryWithTimeout(async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS site_config (
        id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
        config JSONB NOT NULL DEFAULT '{}',
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
  }, 5000);
}


function registerRoutes() {
  app.get("/api/smugmug/albums", isAuthenticated, requireAdmin, async (_req, res) => {
    try {
      const albums = await getAlbums();
      res.json(albums);
    } catch (err: any) {
      console.log("[SmugMug] Albums error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/smugmug/albums/:albumKey/images", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      const albumKey = Array.isArray(req.params.albumKey) ? req.params.albumKey[0] : req.params.albumKey;
      const images = await getAlbumImages(albumKey);
      res.json(images);
    } catch (err: any) {
      console.log("[SmugMug] Album images error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/images/list", isAuthenticated, requireAdmin, async (_req, res) => {
    const accountId = process.env.CF_ACCOUNT_ID;
    const token = process.env.CF_IMAGES_TOKEN;
    const hash = process.env.CF_IMAGES_HASH || null;
    if (!accountId || !token) {
      return res.status(500).json({ error: "Cloudflare Images is not configured (CF_ACCOUNT_ID / CF_IMAGES_TOKEN missing)" });
    }
    try {
      const images: Array<{ id: string; filename: string; uploaded?: string }> = [];
      let page = 1;
      while (page <= 100) {
        const r = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1?page=${page}&per_page=100`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data: any = await r.json().catch(() => ({}));
        if (!r.ok || !data.success) {
          throw new Error(`Cloudflare list failed (HTTP ${r.status})`);
        }
        const batch: any[] = data.result?.images || [];
        for (const img of batch) {
          images.push({ id: img.id, filename: img.filename || img.id, uploaded: img.uploaded });
        }
        if (batch.length < 100) break;
        page++;
      }
      res.json({ images, hash, smugmug: true });
    } catch (err: any) {
      console.log("[CF Images] List error:", err.message);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/images/config", (_req, res) => {
    res.json({ hash: process.env.CF_IMAGES_HASH || null, smugmug: true });
  });

  app.get("/api/config", async (_req, res) => {
    refreshConfigFromDB();
    res.type("application/json").send(JSON.stringify(configCache));
  });

  app.post("/api/config", isAuthenticated, requireAdmin, async (req, res) => {
    try {
      await persistConfig(req.body);
      const seriesCount = Object.keys(req.body.series || {}).length;
      const worksCount = (req.body.portfolioWorks || []).length;
      let photoCount = 0;
      if (req.body.photos) Object.values(req.body.photos).forEach((arr: any) => { if (Array.isArray(arr)) photoCount += arr.length; });
      console.log(`[Config] Saved to DB — ${seriesCount} series, ${worksCount} works, ${photoCount} photos`);
      res.json({ success: true, timestamp: new Date().toISOString() });
    } catch (err: any) {
      console.log(`[Config] DB save error: ${err.message}`);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/ai/enrich", isAuthenticated, requireAdmin, async (req, res) => {
    const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
    const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
    if (!baseURL || !apiKey) return res.status(500).json({ error: "AI integration not configured" });
    const { field = "", current = "", context = {}, mode: rawMode = "enrich" } = req.body;
    let mode = rawMode;
    const systemPrompt = "You are a writing assistant for a fine-art photography portfolio website called The Infinite Arch. " +
      "The photographer specializes in landscape and expedition photography with a Fujifilm GFX system. " +
      "The tone is: literary, contemplative, precise — like a quiet essay. Avoid clichés, marketing speak, and exclamation marks. " +
      "Keep the voice grounded and authentic. Do not use em-dashes excessively.";
    const isPhoto = context.entity === "photo";
    const fieldHints: Record<string, string> = {
      description: "Write 2-3 sentences that capture the essence and intent of this body of work.",
      subtitle: "Write a short, evocative subtitle (under 10 words).",
      caption: "Write one short caption line for this single photograph (under 15 words).",
      altText: "Write concise, factual alt text describing what is visible in this photograph, for accessibility and image SEO (under 125 characters). Plain description, no artistic flourish, no 'image of' prefix.",
      storyTitle: "Write a short, literary title for this photograph's story page (under 8 words). No quotes.",
      storyBody: "Write 2-4 short paragraphs telling the story behind this photograph — the place, the moment, the intent. Separate paragraphs with a blank line. Plain text only, no headings or markdown.",
    };
    if (isPhoto) {
      fieldHints.title = "Write a short, evocative display title for this single photograph (under 8 words). No quotes.";
    }
    const hint = fieldHints[field as string] || "Write appropriate content for this field.";
    const ctxParts = ["title", "subtitle", "type", "location", "camera", "year", "caption", "image", "appearsIn", "storyTitle", "storyExcerpt"]
      .filter((k) => context[k])
      .map((k) => `${k}: ${context[k]}`);
    const ctxStr = ctxParts.join(", ");
    let userPrompt = "";
    if (mode === "enrich") {
      userPrompt = `Enrich and improve the following ${field} text for a photography portfolio. Make it more evocative and compelling while keeping the photographer's authentic voice. ${hint} Context: ${ctxStr}. Return ONLY the improved text, nothing else. Keep it roughly the same length unless the original is very short. Current text: ${current}`;
    } else if (mode === "generate") {
      userPrompt = `Generate a ${field} for a photography portfolio. Context: ${ctxStr}. Return ONLY the text, nothing else. ${hint}`;
    } else if (mode === "shorten") {
      userPrompt = `Make this ${field} text more concise while preserving its meaning and tone: ${current}\nReturn ONLY the shortened text.`;
    } else if (mode === "expand") {
      userPrompt = `Expand this ${field} text with more detail and depth while maintaining its tone. ${hint}\nContext: ${ctxStr}\nCurrent text: ${current}\nReturn ONLY the expanded text.`;
    }
    try {
      const client = new Anthropic({ apiKey, baseURL });
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 8192,
        messages: [{ role: "user", content: userPrompt }],
        system: systemPrompt
      });
      const text = message.content[0] && message.content[0].type === "text" ? message.content[0].text : "";
      res.json({ text: text.trim() });
    } catch (err: any) {
      console.log(`[AI] Error: ${err.message}`);
      res.status(500).json({ error: err.message || "AI request failed" });
    }
  });

  registerAdobeRoutes(app, [isAuthenticated, requireAdmin]);
  registerLightroomRoutes(app, [isAuthenticated, requireAdmin], {
    getConfig: () => configCache,
    saveConfig: persistConfig,
  });

  const publicDir = fs.existsSync(path.join(__dirname, "public"))
    ? path.join(__dirname, "public")
    : path.join(__dirname, "..");
  app.get("/test/lightroom", (_req, res) => {
    res.sendFile(path.join(publicDir, "pages", "lightroom-connect.html"));
  });
  app.use(express.static(publicDir));

  // Pages created in the admin page builder have no physical HTML file.
  // Static files above win for the built-in pages; anything else under
  // /pages/{slug}.html is served as a generic block-driven thin shell when
  // config.pages[slug] exists.
  app.get("/pages/:page", async (req, res, next) => {
    const m = /^([a-z0-9]+(?:-[a-z0-9]+)*)\.html$/.exec(String(req.params.page || ""));
    if (!m) return next();
    const slug = m[1];
    if (!configCache?.pages?.[slug]) {
      // May be freshly created on another instance — check the DB once.
      try {
        const dbConfig = await loadConfigFromDB();
        if (dbConfig) configCache = dbConfig;
      } catch {}
      if (!configCache?.pages?.[slug]) return next();
    }
    res.type("html").send(dynamicPageShell(slug));
  });

  // Single-image story pages: /work/{slug} — served for images flagged
  // hasStoryPage in config.cf.assetMeta. Reads sale/edition data but does
  // NOT process payment or mutate editionsSold (back-half).
  app.get("/work/:slug", async (req, res) => {
    const m = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.exec(String(req.params.slug || ""));
    if (!m) return res.status(404).type("html").send(storyNotFoundShell());
    const slug = m[0];
    let entry = findStoryBySlug(slug);
    if (!entry) {
      // May be freshly marked on another instance — check the DB once.
      try {
        const dbConfig = await loadConfigFromDB();
        if (dbConfig) configCache = dbConfig;
      } catch {}
      entry = findStoryBySlug(slug);
    }
    if (!entry) return res.status(404).type("html").send(storyNotFoundShell());
    res.type("html").send(storyPageShell(entry.id, entry.meta));
  });

  app.get("/sitemap.xml", (req, res) => {
    const base = `https://${req.get("host") || "infinitearchphoto.com"}`;
    const urls: string[] = ["/", "/pages/portfolio.html", "/pages/galleries.html", "/pages/about.html", "/pages/prints.html", "/pages/hope-hike.html", "/pages/contact.html"];
    const builtIn = new Set(["home", "portfolio", "about", "prints", "hope-hike", "contact"]);
    Object.keys(configCache?.pages || {}).forEach(slug => {
      if (!builtIn.has(slug) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) urls.push(`/pages/${slug}.html`);
    });
    listStoryEntries().forEach(e => urls.push(`/work/${e.meta.slug}`));
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map(u => `  <url><loc>${base}${u}</loc></url>`).join("\n") + `\n</urlset>`;
    res.type("application/xml").send(xml);
  });
}

// JSON for safe embedding inside inline <script> blocks
function jsStr(v: any): string {
  return JSON.stringify(v).replace(/</g, "\\u003c").replace(/>/g, "\\u003e");
}

function escHtml(s: any): string {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function listStoryEntries(): Array<{ id: string; meta: any }> {
  const assetMeta = configCache?.cf?.assetMeta || {};
  const entries: Array<{ id: string; meta: any }> = [];
  for (const id of Object.keys(assetMeta).sort()) {
    const meta = assetMeta[id];
    if (meta && meta.hasStoryPage === true && typeof meta.slug === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.slug)) {
      entries.push({ id, meta });
    }
  }
  entries.sort((a, b) => a.meta.slug.localeCompare(b.meta.slug));
  // Duplicate slugs (possible via direct config edits) resolve deterministically:
  // the lowest image id wins; later duplicates are excluded from routing/sitemap.
  const seen = new Set<string>();
  return entries.filter(e => (seen.has(e.meta.slug) ? false : (seen.add(e.meta.slug), true)));
}

function findStoryBySlug(slug: string): { id: string; meta: any } | null {
  return listStoryEntries().find(e => e.meta.slug === slug) || null;
}

function cfDeliveryUrl(imageId: string, variant: string): string {
  const hash = configCache?.cf?.hash || process.env.CF_IMAGES_HASH || "";
  if (!hash) return "";
  return `https://imagedelivery.net/${hash}/${imageId}/${variant}`;
}

// Find the gallery that contains this image so the story page can link back.
function findGalleryForImage(imageId: string): { workId: string; galleryId: string; title: string } | null {
  const works = configCache?.portfolioWorks || [];
  const matches = (p: any) => p === imageId || (p && typeof p === "object" && (p.id === imageId || p.imageKey === imageId || p.assetId === imageId));
  for (const w of works) {
    for (const g of w.galleries || []) {
      if ((g.photos || []).some(matches)) return { workId: w.id, galleryId: g.id, title: g.title || w.title || "Gallery" };
      for (const f of g.folders || []) {
        if ((f.photos || []).some(matches)) return { workId: w.id, galleryId: g.id, title: g.title || w.title || "Gallery" };
      }
    }
  }
  return null;
}

// storyBody is rendered escape-first: ALL markup is HTML-escaped, then only a
// tiny allowlist of harmless attribute-free tags is restored. Everything else
// (scripts, iframes, event handlers, attributes) stays inert escaped text.
function sanitizeStoryBody(body: string): string {
  const raw = String(body || "");
  let out = escHtml(raw);
  // Restore only exact, attribute-free allowlisted tags
  const allowed = ["p", "em", "i", "strong", "b", "br"];
  for (const tag of allowed) {
    out = out.replace(new RegExp(`&lt;${tag}&gt;`, "gi"), `<${tag}>`);
    out = out.replace(new RegExp(`&lt;/${tag}&gt;`, "gi"), `</${tag}>`);
    out = out.replace(new RegExp(`&lt;${tag}\\s*/&gt;`, "gi"), `<${tag}>`);
  }
  // If there is no paragraph markup, treat blank lines as paragraph breaks
  if (!/<p>/i.test(out)) {
    out = out.split(/\n\s*\n/).map(p => `<p>${p.trim()}</p>`).join("\n");
  }
  return out;
}

function storyNotFoundShell(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Not on view &middot; The Infinite Arch</title>
  <meta name="robots" content="noindex">
  <link rel="stylesheet" href="/assets/css/tia.css">
  <link rel="stylesheet" href="/assets/css/blocks.css">
</head>
<body>
<div class="page-content">
  <section class="story-notfound" data-testid="story-notfound">
    <span class="story-eyebrow">The Infinite Arch</span>
    <h1>Not on view</h1>
    <p>This photograph is not currently on view.</p>
    <a class="story-back" href="/pages/galleries.html" data-testid="link-story-galleries">&#8592; Browse the galleries</a>
  </section>
</div>
<script src="/assets/js/tia-data.js"></script>
<script src="/assets/js/components.js"></script>
<script src="/assets/js/tia.js"></script>
</body>
</html>`;
}

function storyPageShell(imageId: string, meta: any): string {
  const title = meta.storyTitle || meta.filename || "Untitled";
  const bodyHtml = sanitizeStoryBody(meta.storyBody || "");
  const descSource = String(meta.storyBody || "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const metaDesc = descSource.length > 150 ? descSource.slice(0, 147).trimEnd() + "\u2026" : descSource;
  const imgFull = cfDeliveryUrl(imageId, "full");
  const imgHero = cfDeliveryUrl(imageId, "hero");
  const siteName = configCache?.siteSettings?.siteName || "The Infinite Arch";
  const email = configCache?.siteSettings?.email || "";

  const captionParts: string[] = [];
  if (meta.location) captionParts.push(escHtml(meta.location));
  if (meta.camera) captionParts.push(escHtml(meta.camera));
  if (meta.year) captionParts.push(escHtml(meta.year));
  const caption = captionParts.join(" &middot; ");

  // Edition status (read-only; never mutated here)
  const saleType = meta.saleType || "none";
  let editionHtml = "";
  if (saleType !== "none") {
    if (saleType === "limited") {
      const size = Number(meta.editionSize) || 0;
      const sold = Number(meta.editionsSold) || 0;
      const soldOut = size > 0 && sold >= size;
      editionHtml = `<div class="story-edition" data-testid="story-edition">` +
        (soldOut
          ? `<span class="story-edition-status sold-out">Sold out</span><span class="story-edition-detail">Edition of ${size}</span>`
          : `<span class="story-edition-status">Edition &mdash; of ${size}</span><span class="story-edition-detail">${sold} of ${size} sold</span>`) +
        `</div>`;
    } else {
      editionHtml = `<div class="story-edition" data-testid="story-edition"><span class="story-edition-status">Open edition</span></div>`;
    }
  }

  // Print options + inquire (inquiry-only for now)
  // TODO(back-half): Stripe checkout for open editions — for now every buy
  // path routes to the inquiry flow; this page never processes payment.
  const printSizes = Array.isArray(meta.printSizes) ? meta.printSizes : [];
  const sellable = saleType !== "none" && !!meta.printMasterRef && printSizes.length > 0;
  const size0 = printSizes[0] || {};
  const soldOutLimited = saleType === "limited" && Number(meta.editionSize) > 0 && Number(meta.editionsSold) >= Number(meta.editionSize);
  let buyHtml = "";
  if (sellable && !soldOutLimited) {
    const opts = printSizes.map((s: any, i: number) => {
      const label = escHtml(s.label || s.size || `Size ${i + 1}`);
      const price = s.price != null && s.price !== "" ? ` — $${escHtml(s.price)}` : "";
      return `<option value="${i}">${label}${price}</option>`;
    }).join("");
    buyHtml = `<div class="story-buy" data-testid="story-buy">
      <span class="story-buy-lbl">Print Options</span>
      <div class="story-buy-row">
        <select class="story-buy-select" id="storySize" data-testid="select-story-size">${opts}</select>
        <a class="story-buy-btn" id="storyInquire" href="#" data-testid="btn-story-inquire">Inquire to Purchase</a>
      </div>
    </div>
    <script>
    (function(){
      var sizes = ${jsStr(printSizes.map((s: any, i: number) => String(s.label || s.size || `Size ${i + 1}`)))};
      var email = ${jsStr(email)};
      var title = ${jsStr(String(title))};
      function upd(){
        var sel = document.getElementById('storySize');
        var sizeLabel = sizes[Number(sel.value)] || '';
        var subject = encodeURIComponent('Print inquiry: ' + title);
        var body = encodeURIComponent('I am interested in a print of "' + title + '"' + (sizeLabel ? ' in size ' + sizeLabel : '') + '.');
        document.getElementById('storyInquire').href = email
          ? 'mailto:' + email + '?subject=' + subject + '&body=' + body
          : '/pages/contact.html';
      }
      document.getElementById('storySize').addEventListener('change', upd);
      upd();
    })();
    </script>`;
  }

  // Quiet nav: back to its gallery + prev/next through story pages
  const backRef = findGalleryForImage(imageId);
  const backHref = backRef
    ? `/pages/galleries.html?work=${encodeURIComponent(backRef.workId)}&gallery=${encodeURIComponent(backRef.galleryId)}`
    : "/pages/galleries.html";
  const backLabel = backRef ? backRef.title : "Galleries";
  const entries = listStoryEntries();
  const idx = entries.findIndex(e => e.id === imageId);
  const prev = idx > 0 ? entries[idx - 1] : null;
  const next = idx >= 0 && idx < entries.length - 1 ? entries[idx + 1] : null;
  const navHtml = `<nav class="story-nav" data-testid="story-nav">
    <a class="story-back" href="${backHref}" data-testid="link-story-back">&#8592; ${escHtml(backLabel)}</a>
    <div class="story-nav-siblings">
      ${prev ? `<a href="/work/${prev.meta.slug}" data-testid="link-story-prev">&#8592; Previous</a>` : ""}
      ${next ? `<a href="/work/${next.meta.slug}" data-testid="link-story-next">Next &#8594;</a>` : ""}
    </div>
  </nav>`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: String(title),
    creator: { "@type": "Person", name: "Randy" },
    artMedium: "Photography",
    image: imgHero || imgFull,
    description: metaDesc,
    ...(saleType === "limited" && Number(meta.editionSize) > 0 ? { artEdition: Number(meta.editionSize) } : {})
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(title)} &middot; ${escHtml(siteName)}</title>
  <meta name="description" content="${escHtml(metaDesc)}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escHtml(title)} \u00b7 ${escHtml(siteName)}">
  <meta property="og:description" content="${escHtml(metaDesc)}">
  <meta property="og:image" content="${escHtml(imgHero || imgFull)}">
  <link rel="stylesheet" href="/assets/css/tia.css">
  <link rel="stylesheet" href="/assets/css/blocks.css">
  <script type="application/ld+json">${jsStr(jsonLd)}</script>
</head>
<body>
<div class="page-content">
  <article class="story-page" data-testid="story-page-${escHtml(meta.slug)}">
    <figure class="story-figure">
      ${imgFull ? `<img class="story-img" src="${escHtml(imgFull)}" alt="${escHtml(title)}" loading="lazy" data-testid="img-story">` : ""}
    </figure>
    <header class="story-header">
      <h1 class="story-title" data-testid="text-story-title">${escHtml(title)}</h1>
      ${caption ? `<p class="story-caption" data-testid="text-story-caption">${caption}</p>` : ""}
    </header>
    ${bodyHtml ? `<div class="story-body" data-testid="text-story-body">${bodyHtml}</div>` : ""}
    ${editionHtml}
    ${buyHtml}
    ${navHtml}
  </article>
</div>
<script>
document.addEventListener('DOMContentLoaded', function() {
  var ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.content = window.location.href;
});
</script>
<script src="/assets/js/tia-data.js"></script>
<script src="/assets/js/components.js"></script>
<script src="/assets/js/tia.js"></script>
</body>
</html>`;
}

function dynamicPageShell(slug: string): string {
  // slug is validated as [a-z0-9-]+ before this is called
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>The Infinite Arch</title>
  <meta name="description" content="">
  <meta property="og:type" content="website">
  <meta property="og:title" content="The Infinite Arch">
  <meta property="og:description" content="">
  <meta property="og:url" content="">
  <meta property="og:image" content="">
  <link rel="stylesheet" href="/assets/css/tia.css">
  <link rel="stylesheet" href="/assets/css/blocks.css">
</head>
<body>
<div class="page-content" id="pageBlocks" data-testid="page-content-${slug}"></div>
<script src="/assets/js/tia-data.js"></script>
<script src="/assets/js/block-renderer.js"></script>
<script>
document.addEventListener('DOMContentLoaded', async function() {
  try {
    var cfRes = await fetch('/api/images/config');
    if (cfRes.ok) { var cfg = await cfRes.json(); if (cfg.hash) TIA.CF_HASH = cfg.hash; }
  } catch(e) {}
  await TIA.load();
  var state = TIA.getState();
  var pageData = state.pages && state.pages['${slug}'];
  var blocks = (pageData && pageData.blocks) || [];
  document.getElementById('pageBlocks').innerHTML = BlockRenderer.render(blocks, state);
  if (pageData && pageData.title) {
    document.title = pageData.title;
    var ogt = document.querySelector('meta[property="og:title"]');
    if (ogt) ogt.content = pageData.title;
  }
  if (pageData && pageData.metaDescription) {
    var md = document.querySelector('meta[name="description"]');
    if (md) md.content = pageData.metaDescription;
    var ogd = document.querySelector('meta[property="og:description"]');
    if (ogd) ogd.content = pageData.metaDescription;
  }
  if (pageData && pageData.ogImage) {
    var ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg) ogImg.content = TIA.photoUrl(pageData.ogImage, 'hero');
  }
  var ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.content = window.location.href;
  BlockRenderer.initReveals();
});
</script>
<script src="/assets/js/components.js"></script>
<script src="/assets/js/tia.js"></script>
</body>
</html>`;
}

(async () => {
  try {
    await initializeConfigCache();
    await ensureConfigTable();
    await queryWithTimeout(async () => await ensureAuthTables(), 5000);
    if (process.env.REPL_ID) {
      await queryWithTimeout(async () => await setupAuth(app), 5000);
      registerAuthRoutes(app);
    } else {
      console.log("Local mode: Replit Auth disabled");
    }
    registerRoutes();
    app.listen(port, "0.0.0.0", () => {
      console.log(`Static file server listening on port ${port}`);
      console.log(`[SmugMug] Nickname: ${process.env.SMUGMUG_NICKNAME || "MISSING"}`);
      console.log(`[Auth] Replit Auth ${process.env.REPL_ID ? "enabled" : "disabled"}`);
    });
  } catch (err: any) {
    console.error("[Startup] Fatal error:", err);
    process.exit(1);
  }
})();
