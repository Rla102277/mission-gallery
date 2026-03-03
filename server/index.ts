import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";
import exifReader from "exif-reader";
import pg from "pg";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 5000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
app.use(express.json({ limit: "10mb" }));

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function ensureConfigTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_config (
      id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      config JSONB NOT NULL DEFAULT '{}',
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
}
ensureConfigTable().catch(err => console.log("[DB] Table init error:", err.message));

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_IMAGES_TOKEN = process.env.CF_IMAGES_TOKEN;
const CF_IMAGES_HASH = process.env.CF_IMAGES_HASH;

function extractExif(buffer: Buffer): Record<string, any> {
  try {
    if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) return {};
    let offset = 2;
    while (offset < buffer.length - 4) {
      if (buffer[offset] !== 0xFF) break;
      const marker = buffer[offset + 1];
      if (marker === 0xE1) {
        const len = buffer.readUInt16BE(offset + 2);
        const exifHeader = buffer.slice(offset + 4, offset + 10).toString("ascii");
        if (exifHeader === "Exif\0\0") {
          const exifData = buffer.slice(offset + 10, offset + 2 + len);
          const parsed = exifReader(exifData);
          const result: Record<string, any> = {};
          const img = parsed.Image || parsed.image || {};
          const exif = parsed.Exif || parsed.exif || {};
          const gps = parsed.GPSInfo || parsed.gps || {};
          if (img.Make) result.make = String(img.Make).trim();
          if (img.Model) result.model = String(img.Model).trim();
          if (exif.FocalLength) result.focalLength = typeof exif.FocalLength === 'number' ? exif.FocalLength : Number(exif.FocalLength);
          if (exif.FNumber) result.fNumber = typeof exif.FNumber === 'number' ? exif.FNumber : Number(exif.FNumber);
          if (exif.ExposureTime) result.exposureTime = typeof exif.ExposureTime === 'number' ? exif.ExposureTime : Number(exif.ExposureTime);
          if (exif.ISOSpeedRatings) result.iso = Number(Array.isArray(exif.ISOSpeedRatings) ? exif.ISOSpeedRatings[0] : exif.ISOSpeedRatings);
          if (exif.ISO) result.iso = Number(exif.ISO);
          if (exif.PhotographicSensitivity) result.iso = Number(exif.PhotographicSensitivity);
          if (exif.DateTimeOriginal) {
            const d = exif.DateTimeOriginal;
            result.dateTime = d instanceof Date ? d.toISOString() : String(d);
          }
          if (exif.LensModel) result.lens = String(exif.LensModel).trim();
          if (img.ImageWidth) result.width = Number(img.ImageWidth);
          if (img.ImageLength) result.height = Number(img.ImageLength);
          if (exif.PixelXDimension) result.width = Number(exif.PixelXDimension);
          if (exif.PixelYDimension) result.height = Number(exif.PixelYDimension);
          if (gps.GPSLatitude && gps.GPSLongitude) {
            result.gps = { lat: gps.GPSLatitude, lon: gps.GPSLongitude, latRef: gps.GPSLatitudeRef, lonRef: gps.GPSLongitudeRef };
          }
          return result;
        }
      }
      const segLen = buffer.readUInt16BE(offset + 2);
      offset += 2 + segLen;
    }
  } catch (e) {}
  return {};
}

app.post("/api/images/upload", upload.single("file"), async (req, res) => {
  if (!CF_ACCOUNT_ID || !CF_IMAGES_TOKEN) {
    console.log("[CF] Upload blocked — CF not configured");
    return res.status(500).json({ error: "Cloudflare Images not configured" });
  }
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  try {
    console.log(`[CF] Uploading: ${req.file.originalname} (${(req.file.size / 1024).toFixed(0)}KB)`);
    const exif = extractExif(req.file.buffer);

    const formData = new FormData();
    formData.append("file", new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname);

    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`,
      {
        method: "POST",
        headers: { "Authorization": `Bearer ${CF_IMAGES_TOKEN}` },
        body: formData,
      }
    );

    const data = await cfRes.json() as any;
    if (!data.success) {
      console.log(`[CF] Upload failed: ${data.errors?.[0]?.message || "Unknown error"}`);
      return res.status(400).json({ error: data.errors?.[0]?.message || "Upload failed" });
    }

    console.log(`[CF] Upload OK: ${data.result.id} (${req.file.originalname})`);
    res.json({
      id: data.result.id,
      filename: data.result.filename,
      variants: data.result.variants,
      exif,
    });
  } catch (err: any) {
    console.log(`[CF] Upload error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/images/:id", async (req, res) => {
  if (!CF_ACCOUNT_ID || !CF_IMAGES_TOKEN) {
    console.log("[CF] Delete blocked — CF not configured");
    return res.status(500).json({ error: "Cloudflare Images not configured" });
  }

  try {
    console.log(`[CF] Deleting: ${req.params.id}`);
    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1/${req.params.id}`,
      {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${CF_IMAGES_TOKEN}` },
      }
    );

    const data = await cfRes.json() as any;
    if (!data.success) {
      console.log(`[CF] Delete failed: ${data.errors?.[0]?.message || "Unknown error"}`);
      return res.status(400).json({ error: data.errors?.[0]?.message || "Delete failed" });
    }

    console.log(`[CF] Delete OK: ${req.params.id}`);
    res.json({ success: true });
  } catch (err: any) {
    console.log(`[CF] Delete error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/images/list", async (req, res) => {
  if (!CF_ACCOUNT_ID || !CF_IMAGES_TOKEN) {
    console.log("[CF] List blocked — CF not configured");
    return res.status(500).json({ error: "Cloudflare Images not configured" });
  }
  try {
    console.log("[CF] Fetching image list...");
    const allImages: any[] = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const cfRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1?per_page=100&page=${page}`,
        { headers: { "Authorization": `Bearer ${CF_IMAGES_TOKEN}` } }
      );
      const data = await cfRes.json() as any;
      if (!data.success) {
        console.log(`[CF] List failed: ${data.errors?.[0]?.message || "Unknown error"}`);
        return res.status(400).json({ error: data.errors?.[0]?.message || "List failed" });
      }
      const images = data.result.images || [];
      allImages.push(...images);
      hasMore = images.length === 100;
      page++;
    }
    console.log(`[CF] List OK: ${allImages.length} images found`);
    res.json({ images: allImages, hash: CF_IMAGES_HASH || "" });
  } catch (err: any) {
    console.log(`[CF] List error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/images/config", (_req, res) => {
  console.log(`[CF] Config requested — hash: ${CF_IMAGES_HASH ? "present" : "missing"}`);
  res.json({ hash: CF_IMAGES_HASH || "" });
});

app.get("/api/config", async (_req, res) => {
  try {
    const result = await pool.query("SELECT config FROM site_config WHERE id = 1");
    if (result.rows.length > 0) {
      res.type("application/json").send(JSON.stringify(result.rows[0].config));
    } else {
      res.json({});
    }
  } catch (err: any) {
    console.log(`[Config] DB read error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/config", async (req, res) => {
  try {
    await pool.query(
      `INSERT INTO site_config (id, config, updated_at) VALUES (1, $1::jsonb, NOW())
       ON CONFLICT (id) DO UPDATE SET config = EXCLUDED.config, updated_at = NOW()`,
      [JSON.stringify(req.body)]
    );
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

import Anthropic from "@anthropic-ai/sdk";

app.post("/api/ai/enrich", async (req, res) => {
  const pin = req.headers["x-admin-pin"] as string;
  if (pin !== "tia2026") return res.status(401).json({ error: "Unauthorized" });
  const baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!baseURL || !apiKey) return res.status(500).json({ error: "AI integration not configured" });
  const { field = "", current = "", context = {}, mode: rawMode = "enrich" } = req.body;
  let mode = rawMode;
  const systemPrompt = "You are a writing assistant for a fine-art photography portfolio website called The Infinite Arch. " +
    "The photographer specializes in landscape and expedition photography with a Fujifilm GFX system. " +
    "The tone is: literary, contemplative, precise — like a quiet essay. Avoid clichés, marketing speak, and exclamation marks. " +
    "Keep the voice grounded and authentic. Do not use em-dashes excessively.";
  let userPrompt = "";
  if (mode === "enrich") {
    userPrompt = `Enrich and improve the following ${field} text for a photography portfolio work. Make it more evocative and compelling while keeping the photographer's authentic voice. Context about this work: Title: ${context.title || ""}, Type: ${context.type || ""}, Location: ${context.location || ""}, Camera: ${context.camera || ""}. Return ONLY the improved text, nothing else. Keep it roughly the same length unless the original is very short. Current text: ${current}`;
  } else if (mode === "generate") {
    userPrompt = `Generate a ${field} for a photography portfolio work. Context: Title: ${context.title || ""}, Type: ${context.type || ""}, Location: ${context.location || ""}, Camera: ${context.camera || ""}, Subtitle: ${context.subtitle || ""}. Return ONLY the text, nothing else. ${field === "description" ? "Write 2-3 sentences that capture the essence and intent of this body of work." : field === "subtitle" ? "Write a short, evocative subtitle (under 10 words)." : "Write appropriate content for this field."}`;
  } else if (mode === "shorten") {
    userPrompt = `Make this ${field} text more concise while preserving its meaning and tone: ${current}\nReturn ONLY the shortened text.`;
  } else if (mode === "expand") {
    userPrompt = `Expand this ${field} text with more detail and depth while maintaining its tone: ${current}\nContext: Title: ${context.title || ""}, Location: ${context.location || ""}\nReturn ONLY the expanded text.`;
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

app.use(express.static(path.join(__dirname, "..")));

app.listen(port, "0.0.0.0", () => {
  console.log(`Static file server listening on port ${port}`);
  console.log(`[CF] Account: ${CF_ACCOUNT_ID ? "configured" : "MISSING"}`);
  console.log(`[CF] Token: ${CF_IMAGES_TOKEN ? "configured" : "MISSING"}`);
  console.log(`[CF] Hash: ${CF_IMAGES_HASH || "MISSING"}`);
});
