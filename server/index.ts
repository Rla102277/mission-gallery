import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import exifReader from "exif-reader";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 5000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

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
    return res.status(500).json({ error: "Cloudflare Images not configured" });
  }
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  try {
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
      return res.status(400).json({ error: data.errors?.[0]?.message || "Upload failed" });
    }

    res.json({
      id: data.result.id,
      filename: data.result.filename,
      variants: data.result.variants,
      exif,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/images/:id", async (req, res) => {
  if (!CF_ACCOUNT_ID || !CF_IMAGES_TOKEN) {
    return res.status(500).json({ error: "Cloudflare Images not configured" });
  }

  try {
    const cfRes = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1/${req.params.id}`,
      {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${CF_IMAGES_TOKEN}` },
      }
    );

    const data = await cfRes.json() as any;
    if (!data.success) {
      return res.status(400).json({ error: data.errors?.[0]?.message || "Delete failed" });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/images/list", async (req, res) => {
  if (!CF_ACCOUNT_ID || !CF_IMAGES_TOKEN) {
    return res.status(500).json({ error: "Cloudflare Images not configured" });
  }
  try {
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
        return res.status(400).json({ error: data.errors?.[0]?.message || "List failed" });
      }
      const images = data.result.images || [];
      allImages.push(...images);
      hasMore = images.length === 100;
      page++;
    }
    res.json({ images: allImages, hash: CF_IMAGES_HASH || "" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/images/config", (_req, res) => {
  res.json({ hash: CF_IMAGES_HASH || "" });
});

app.use(express.static(path.join(__dirname, "..")));

app.listen(port, "0.0.0.0", () => {
  console.log(`Static file server listening on port ${port}`);
});
