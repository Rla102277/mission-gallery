import type { Express, Request, Response, NextFunction } from "express";

const LR_BASE = "https://lr.adobe.io";
const RENDITION_SIZE = "2048";
const POLL_MAX_MS = 90 * 1000; // per-asset cap; client pushes assets one at a time
const POLL_DELAYS_MS = [2000, 3000, 5000, 8000, 12000, 15000, 15000, 15000, 15000];

export interface ConfigStore {
  getConfig: () => Record<string, any>;
  saveConfig: (config: Record<string, any>) => Promise<void>;
}

function cfConfig() {
  const accountId = process.env.CF_ACCOUNT_ID;
  const token = process.env.CF_IMAGES_TOKEN;
  const hash = process.env.CF_IMAGES_HASH;
  if (!accountId || !token || !hash) return null;
  return { accountId, token, hash };
}

function lrHeaders(req: Request): Record<string, string> | null {
  const token = req.headers["x-lightroom-token"];
  const apiKey = process.env.ADOBE_CLIENT_ID;
  if (!token || typeof token !== "string" || !apiKey) return null;
  return { Authorization: `Bearer ${token}`, "X-API-Key": apiKey };
}

function safeId(v: any): string | null {
  return typeof v === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(v) ? v : null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Fetch the 2048 rendition, generating it if needed. Returns JPEG bytes.
async function fetchRendition(catalogId: string, assetId: string, headers: Record<string, string>): Promise<Buffer> {
  const url = `${LR_BASE}/v2/catalogs/${catalogId}/assets/${assetId}/renditions/${RENDITION_SIZE}`;
  let generated = false;
  const started = Date.now();
  let attempt = 0;

  while (true) {
    const res = await fetch(url, { headers });
    if (res.status === 200) {
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 100) throw new Error("Rendition response was empty");
      return buf;
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Lightroom auth failed (${res.status}) — reconnect Lightroom and try again`);
    }
    if (!generated && (res.status === 404 || res.status === 202)) {
      // Ask Lightroom to generate the rendition (async)
      const gen = await fetch(`${LR_BASE}/v2/catalogs/${catalogId}/assets/${assetId}/renditions`, {
        method: "POST",
        headers: { ...headers, "X-Generate-Renditions": RENDITION_SIZE },
      });
      if (gen.status === 401 || gen.status === 403) {
        throw new Error(`Lightroom auth failed (${gen.status}) during rendition generation`);
      }
      if (![200, 201, 202].includes(gen.status)) {
        throw new Error(`Rendition generation request failed (HTTP ${gen.status})`);
      }
      generated = true;
    } else if (![404, 202].includes(res.status)) {
      throw new Error(`Rendition fetch failed (HTTP ${res.status})`);
    }
    if (Date.now() - started > POLL_MAX_MS) {
      throw new Error("Timed out waiting for Lightroom to generate the rendition — try again in a minute");
    }
    await sleep(POLL_DELAYS_MS[Math.min(attempt, POLL_DELAYS_MS.length - 1)]);
    attempt++;
  }
}

// Upload to Cloudflare Images with deterministic id lr-{assetId}. On conflict
// (already uploaded / resync), delete the existing image and re-upload.
async function uploadToCdn(assetId: string, bytes: Buffer, filename: string): Promise<string> {
  const cfg = cfConfig();
  if (!cfg) throw new Error("Cloudflare Images is not configured (CF_ACCOUNT_ID / CF_IMAGES_TOKEN / CF_IMAGES_HASH missing)");
  const imageId = `lr-${assetId}`;
  const apiBase = `https://api.cloudflare.com/client/v4/accounts/${cfg.accountId}/images/v1`;

  const doUpload = async () => {
    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(bytes)], { type: "image/jpeg" }), filename || `${imageId}.jpg`);
    form.append("id", imageId);
    const res = await fetch(apiBase, {
      method: "POST",
      headers: { Authorization: `Bearer ${cfg.token}` },
      body: form,
    });
    const json: any = await res.json().catch(() => ({}));
    return { status: res.status, json };
  };

  let { status, json } = await doUpload();
  if (!json.success && (status === 409 || (json.errors || []).some((e: any) => e.code === 5409))) {
    // Image id already exists — delete and re-upload (resync path)
    const del = await fetch(`${apiBase}/${imageId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${cfg.token}` },
    });
    if (!del.ok) throw new Error(`Cloudflare Images delete before re-upload failed (HTTP ${del.status})`);
    ({ status, json } = await doUpload());
  }
  if (!json.success) {
    const msg = (json.errors || []).map((e: any) => e.message).join("; ") || `HTTP ${status}`;
    throw new Error(`Cloudflare Images upload failed: ${msg}`);
  }
  return imageId;
}

function cdnUrls(imageId: string, version?: number) {
  const cfg = cfConfig()!;
  const v = version ? `?v=${version}` : "";
  const u = (variant: string) => `https://imagedelivery.net/${cfg.hash}/${imageId}/${variant}${v}`;
  // Map site size slots to the account's existing variants
  return { medium: u("thumb"), large: u("cover"), xlarge: u("hero"), x2large: u("full") };
}

function makePhotoObject(assetId: string, imageId: string, filename: string, caption: string) {
  return {
    imageKey: imageId,
    source: "lightroom",
    assetId,
    filename: filename || `${imageId}.jpg`,
    caption: caption || "",
    sizes: cdnUrls(imageId),
  };
}

function isSameAsset(p: any, assetId: string): boolean {
  return !!(p && typeof p === "object" && (p.imageKey === assetId || p.assetId === assetId));
}

// Add the photo object to each destination in the config. Returns labels of destinations changed.
function addToDestinations(
  config: Record<string, any>,
  photo: any,
  destinations: Array<{ workId?: string; galleryId?: string; folderId?: string }>
): { added: string[]; skipped: string[]; errors: string[] } {
  const added: string[] = [];
  const skipped: string[] = [];
  const errors: string[] = [];
  const works: any[] = config.portfolioWorks || [];
  for (const dest of destinations) {
    const work = works.find((w) => w && w.id === dest.workId);
    if (!work) { errors.push(`Unknown collection set: ${dest.workId}`); continue; }
    const gallery = (work.galleries || []).find((g: any) => g && g.id === dest.galleryId);
    if (!gallery) { errors.push(`Unknown collection: ${dest.galleryId}`); continue; }
    let label = `${work.title || work.id} / ${gallery.title || gallery.id}`;
    let list: any[];
    if (dest.folderId) {
      const folder = (gallery.folders || []).find((f: any) => f && f.id === dest.folderId);
      if (!folder) { errors.push(`Unknown folder: ${dest.folderId}`); continue; }
      if (!Array.isArray(folder.photos)) folder.photos = [];
      list = folder.photos;
      label += ` / ${folder.title || folder.id}`;
    } else {
      if (!Array.isArray(gallery.photos)) gallery.photos = [];
      list = gallery.photos;
    }
    if (list.some((p) => isSameAsset(p, photo.assetId))) {
      skipped.push(label);
    } else {
      list.push(photo);
      added.push(label);
    }
  }
  return { added, skipped, errors };
}

// Update every config occurrence of the asset with fresh CDN URLs. Returns count.
// Handles both object photo refs and legacy string refs (assetId or lr-{assetId})
// on cover/featured fields by upgrading strings to full photo objects.
function updateAssetUrls(config: Record<string, any>, assetId: string, imageId: string, version: number): number {
  let count = 0;
  const sizes = cdnUrls(imageId, version);
  const freshen = (p: any) => {
    if (!isSameAsset(p, assetId)) return;
    p.sizes = { ...sizes };
    count++;
  };
  const isStringRef = (v: any) => typeof v === "string" && (v === assetId || v === imageId);
  const freshenField = (owner: any, key: string) => {
    if (!owner) return;
    const v = owner[key];
    if (isStringRef(v)) {
      const photo = makePhotoObject(assetId, imageId, "", "");
      photo.sizes = { ...sizes };
      owner[key] = photo;
      count++;
    } else {
      freshen(v);
    }
  };
  for (const work of config.portfolioWorks || []) {
    if (!work) continue;
    freshenField(work, "coverAssetId");
    freshenField(work, "featuredImageId");
    for (const gallery of work.galleries || []) {
      if (!gallery) continue;
      freshenField(gallery, "coverAssetId");
      (gallery.photos || []).forEach(freshen);
      for (const folder of gallery.folders || []) {
        if (!folder) continue;
        freshenField(folder, "coverAssetId");
        (folder.photos || []).forEach(freshen);
      }
    }
  }
  return count;
}

export function registerLightroomRoutes(
  app: Express,
  guards: Array<(req: Request, res: Response, next: NextFunction) => any>,
  store: ConfigStore
) {
  // Reports whether the CDN env vars are configured (no secrets returned)
  app.get("/api/lightroom/cdn-status", ...guards, (_req, res) => {
    res.json({ configured: !!cfConfig() });
  });

  // Push one asset: pull 2048 rendition → upload to CDN → write CDN URL into destinations
  app.post("/api/lightroom/push", ...guards, async (req, res) => {
    try {
      const headers = lrHeaders(req);
      if (!headers) return res.status(400).json({ error: "Missing Lightroom token (X-Lightroom-Token header)" });
      const catalogId = safeId(req.body?.catalogId);
      const assetId = safeId(req.body?.assetId);
      if (!catalogId || !assetId) return res.status(400).json({ error: "catalogId and assetId are required" });
      const destinations = Array.isArray(req.body?.destinations) ? req.body.destinations : [];
      const setCover = req.body?.setCover; // optional {workId, galleryId?, folderId?}
      if (!destinations.length && !setCover) {
        return res.status(400).json({ error: "At least one destination (or setCover) is required" });
      }
      const filename = typeof req.body?.filename === "string" ? req.body.filename.slice(0, 200) : "";
      const caption = typeof req.body?.caption === "string" ? req.body.caption.slice(0, 500) : "";

      const bytes = await fetchRendition(catalogId, assetId, headers);
      const imageId = await uploadToCdn(assetId, bytes, filename);
      const photo = makePhotoObject(assetId, imageId, filename, caption);

      const config = store.getConfig();
      const result = addToDestinations(config, photo, destinations);

      let coverSet: string | null = null;
      if (setCover && typeof setCover === "object") {
        const works: any[] = config.portfolioWorks || [];
        const work = works.find((w) => w && w.id === setCover.workId);
        if (work) {
          if (setCover.folderId) {
            const gal = (work.galleries || []).find((g: any) => g?.id === setCover.galleryId);
            const folder = gal ? (gal.folders || []).find((f: any) => f?.id === setCover.folderId) : null;
            if (folder) { folder.coverAssetId = photo; coverSet = folder.title || folder.id; }
          } else if (setCover.galleryId) {
            const gal = (work.galleries || []).find((g: any) => g?.id === setCover.galleryId);
            if (gal) { gal.coverAssetId = photo; coverSet = gal.title || gal.id; }
          } else {
            work.coverAssetId = photo;
            coverSet = work.title || work.id;
          }
        }
      }

      if (result.added.length || coverSet) {
        await store.saveConfig(config);
      }
      console.log(`[Lightroom] Pushed ${assetId} → ${imageId} (added: ${result.added.length}, skipped: ${result.skipped.length})`);
      res.json({ success: true, assetId, imageId, cdnUrl: photo.sizes.x2large, ...result, coverSet });
    } catch (err: any) {
      console.log("[Lightroom] Push error:", err.message);
      res.status(500).json({ error: err.message || "Push failed" });
    }
  });

  // Resync one asset: regenerate + re-upload (same key) + refresh URLs everywhere in config
  app.post("/api/lightroom/resync", ...guards, async (req, res) => {
    try {
      const headers = lrHeaders(req);
      if (!headers) return res.status(400).json({ error: "Missing Lightroom token (X-Lightroom-Token header)" });
      const catalogId = safeId(req.body?.catalogId);
      const assetId = safeId(req.body?.assetId);
      if (!catalogId || !assetId) return res.status(400).json({ error: "catalogId and assetId are required" });

      // Force regeneration so a re-edited photo gets a fresh rendition
      const genHeaders = { ...headers, "X-Generate-Renditions": RENDITION_SIZE };
      await fetch(`${LR_BASE}/v2/catalogs/${catalogId}/assets/${assetId}/renditions`, {
        method: "POST",
        headers: genHeaders,
      }).catch(() => null);

      const bytes = await fetchRendition(catalogId, assetId, headers);
      const imageId = await uploadToCdn(assetId, bytes, "");
      const version = Date.now(); // cache-bust re-edited image

      const config = store.getConfig();
      const updated = updateAssetUrls(config, assetId, imageId, version);
      if (updated > 0) await store.saveConfig(config);
      console.log(`[Lightroom] Resynced ${assetId} — ${updated} config reference(s) updated`);
      res.json({ success: true, assetId, imageId, updated });
    } catch (err: any) {
      console.log("[Lightroom] Resync error:", err.message);
      res.status(500).json({ error: err.message || "Resync failed" });
    }
  });
}
