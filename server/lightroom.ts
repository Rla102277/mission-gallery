import type { Express, Request, Response, NextFunction } from "express";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const LR_BASE = "https://lr.adobe.io";
const RENDITION_SIZE = "2048";
const POLL_MAX_MS = 90 * 1000; // per-asset cap; client pushes assets one at a time
const POLL_DELAYS_MS = [2000, 3000, 5000, 8000, 12000, 15000, 15000, 15000, 15000];

export interface ConfigStore {
  getConfig: () => Record<string, any>;
  saveConfig: (config: Record<string, any>) => Promise<void>;
}

function r2Config() {
  const endpoint = process.env.R2_ENDPOINT;
  const bucket = process.env.R2_BUCKET;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL;
  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey || !publicBaseUrl) return null;
  return { endpoint, bucket, accessKeyId, secretAccessKey, publicBaseUrl: publicBaseUrl.replace(/\/$/, "") };
}

let s3: S3Client | null = null;
function getS3(cfg: NonNullable<ReturnType<typeof r2Config>>): S3Client {
  if (!s3) {
    s3 = new S3Client({
      region: "auto",
      endpoint: cfg.endpoint,
      credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    });
  }
  return s3;
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

async function uploadToCdn(assetId: string, bytes: Buffer): Promise<string> {
  const cfg = r2Config();
  if (!cfg) throw new Error("CDN is not configured (R2_* environment variables missing)");
  const key = `lr/${assetId}.jpg`;
  await getS3(cfg).send(
    new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: bytes,
      ContentType: "image/jpeg",
      CacheControl: "public, max-age=31536000",
    })
  );
  return `${cfg.publicBaseUrl}/${key}`;
}

function makePhotoObject(assetId: string, cdnUrl: string, filename: string, caption: string) {
  return {
    imageKey: assetId,
    source: "lightroom",
    assetId,
    filename: filename || `${assetId}.jpg`,
    caption: caption || "",
    sizes: { medium: cdnUrl, large: cdnUrl, xlarge: cdnUrl, x2large: cdnUrl },
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

// Update every config occurrence of the asset with a fresh CDN URL. Returns count.
function updateAssetUrls(config: Record<string, any>, assetId: string, cdnUrl: string): number {
  let count = 0;
  const freshen = (p: any) => {
    if (!isSameAsset(p, assetId)) return;
    p.sizes = { medium: cdnUrl, large: cdnUrl, xlarge: cdnUrl, x2large: cdnUrl };
    count++;
  };
  for (const work of config.portfolioWorks || []) {
    if (!work) continue;
    freshen(work.coverAssetId);
    freshen(work.featuredImageId);
    for (const gallery of work.galleries || []) {
      if (!gallery) continue;
      freshen(gallery.coverAssetId);
      (gallery.photos || []).forEach(freshen);
      for (const folder of gallery.folders || []) {
        if (!folder) continue;
        freshen(folder.coverAssetId);
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
    res.json({ configured: !!r2Config() });
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
      const cdnUrl = await uploadToCdn(assetId, bytes);
      const photo = makePhotoObject(assetId, cdnUrl, filename, caption);

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
      console.log(`[Lightroom] Pushed ${assetId} → ${cdnUrl} (added: ${result.added.length}, skipped: ${result.skipped.length})`);
      res.json({ success: true, assetId, cdnUrl, ...result, coverSet });
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
      const baseUrl = await uploadToCdn(assetId, bytes);
      const cdnUrl = `${baseUrl}?v=${Date.now()}`; // cache-bust re-edited image

      const config = store.getConfig();
      const updated = updateAssetUrls(config, assetId, cdnUrl);
      if (updated > 0) await store.saveConfig(config);
      console.log(`[Lightroom] Resynced ${assetId} — ${updated} config reference(s) updated`);
      res.json({ success: true, assetId, cdnUrl, updated });
    } catch (err: any) {
      console.log("[Lightroom] Resync error:", err.message);
      res.status(500).json({ error: err.message || "Resync failed" });
    }
  });
}
