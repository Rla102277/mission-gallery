import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import multer from "multer";
import exifReader from "exif-reader";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 5000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
app.use(express.json({ limit: "10mb" }));

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

const CONFIG_PATH = path.join(__dirname, "..", "data", "tia-config.json");

app.get("/api/config", (_req, res) => {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = fs.readFileSync(CONFIG_PATH, "utf-8");
      res.type("application/json").send(data);
    } else {
      res.json({});
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/config", (req, res) => {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(req.body, null, 2));
    const seriesCount = Object.keys(req.body.series || {}).length;
    const worksCount = (req.body.portfolioWorks || []).length;
    let photoCount = 0;
    if (req.body.photos) Object.values(req.body.photos).forEach((arr: any) => { if (Array.isArray(arr)) photoCount += arr.length; });
    console.log(`[Config] Saved — ${seriesCount} series, ${worksCount} works, ${photoCount} photos`);
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err: any) {
    console.log(`[Config] Save error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

app.use(express.static(path.join(__dirname, "..")));

app.listen(port, "0.0.0.0", () => {
  console.log(`Static file server listening on port ${port}`);
  console.log(`[CF] Account: ${CF_ACCOUNT_ID ? "configured" : "MISSING"}`);
  console.log(`[CF] Token: ${CF_IMAGES_TOKEN ? "configured" : "MISSING"}`);
  console.log(`[CF] Hash: ${CF_IMAGES_HASH || "MISSING"}`);
});
