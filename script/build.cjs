const { cpSync, mkdirSync, writeFileSync, existsSync } = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const publicDir = path.join(distDir, "public");

mkdirSync(publicDir, { recursive: true });

const staticDirs = ["assets", "pages", "admin"];
const staticFiles = ["index.html"];

staticFiles.forEach(function(file) {
  const src = path.join(rootDir, file);
  if (existsSync(src)) {
    cpSync(src, path.join(publicDir, file));
  }
});

staticDirs.forEach(function(dir) {
  const src = path.join(rootDir, dir);
  if (existsSync(src)) {
    cpSync(src, path.join(publicDir, dir), { recursive: true });
  }
});

const serverCode = `
const express = require("express");
const path = require("path");
const multer = require("multer");
const exifReader = require("exif-reader");

const app = express();
const port = Number(process.env.PORT) || 5000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_IMAGES_TOKEN = process.env.CF_IMAGES_TOKEN;
const CF_IMAGES_HASH = process.env.CF_IMAGES_HASH;

function extractExif(buffer) {
  try {
    if (buffer[0] !== 0xFF || buffer[1] !== 0xD8) return {};
    var offset = 2;
    while (offset < buffer.length - 4) {
      if (buffer[offset] !== 0xFF) break;
      var marker = buffer[offset + 1];
      if (marker === 0xE1) {
        var len = buffer.readUInt16BE(offset + 2);
        var exifHeader = buffer.slice(offset + 4, offset + 10).toString("ascii");
        if (exifHeader === "Exif\\0\\0") {
          var exifData = buffer.slice(offset + 10, offset + 2 + len);
          var parsed = exifReader(exifData);
          var result = {};
          var img = parsed.Image || parsed.image || {};
          var exif = parsed.Exif || parsed.exif || {};
          if (img.Make) result.make = String(img.Make).trim();
          if (img.Model) result.model = String(img.Model).trim();
          if (exif.FocalLength) result.focalLength = Number(exif.FocalLength);
          if (exif.FNumber) result.fNumber = Number(exif.FNumber);
          if (exif.ExposureTime) result.exposureTime = Number(exif.ExposureTime);
          if (exif.ISOSpeedRatings) result.iso = Number(Array.isArray(exif.ISOSpeedRatings) ? exif.ISOSpeedRatings[0] : exif.ISOSpeedRatings);
          if (exif.ISO) result.iso = Number(exif.ISO);
          if (exif.PhotographicSensitivity) result.iso = Number(exif.PhotographicSensitivity);
          if (exif.DateTimeOriginal) {
            var d = exif.DateTimeOriginal;
            result.dateTime = d instanceof Date ? d.toISOString() : String(d);
          }
          if (exif.LensModel) result.lens = String(exif.LensModel).trim();
          if (exif.PixelXDimension) result.width = Number(exif.PixelXDimension);
          if (exif.PixelYDimension) result.height = Number(exif.PixelYDimension);
          return result;
        }
      }
      var segLen = buffer.readUInt16BE(offset + 2);
      offset += 2 + segLen;
    }
  } catch (e) {}
  return {};
}

app.post("/api/images/upload", upload.single("file"), async function(req, res) {
  if (!CF_ACCOUNT_ID || !CF_IMAGES_TOKEN) {
    return res.status(500).json({ error: "Cloudflare Images not configured" });
  }
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }
  try {
    var exif = extractExif(req.file.buffer);
    var formData = new FormData();
    formData.append("file", new Blob([req.file.buffer], { type: req.file.mimetype }), req.file.originalname);
    var cfRes = await fetch(
      "https://api.cloudflare.com/client/v4/accounts/" + CF_ACCOUNT_ID + "/images/v1",
      { method: "POST", headers: { "Authorization": "Bearer " + CF_IMAGES_TOKEN }, body: formData }
    );
    var data = await cfRes.json();
    if (!data.success) {
      return res.status(400).json({ error: (data.errors && data.errors[0] && data.errors[0].message) || "Upload failed" });
    }
    res.json({ id: data.result.id, filename: data.result.filename, variants: data.result.variants, exif: exif });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/images/:id", async function(req, res) {
  if (!CF_ACCOUNT_ID || !CF_IMAGES_TOKEN) {
    return res.status(500).json({ error: "Cloudflare Images not configured" });
  }
  try {
    var cfRes = await fetch(
      "https://api.cloudflare.com/client/v4/accounts/" + CF_ACCOUNT_ID + "/images/v1/" + req.params.id,
      { method: "DELETE", headers: { "Authorization": "Bearer " + CF_IMAGES_TOKEN } }
    );
    var data = await cfRes.json();
    if (!data.success) {
      return res.status(400).json({ error: (data.errors && data.errors[0] && data.errors[0].message) || "Delete failed" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/images/config", function(req, res) {
  res.json({ hash: CF_IMAGES_HASH || "" });
});

app.use(express.static(path.join(__dirname, "public")));

app.listen(port, "0.0.0.0", function() {
  console.log("Static file server listening on port " + port);
});
`;

writeFileSync(path.join(distDir, "index.cjs"), serverCode);
console.log("Build complete: dist/index.cjs + dist/public/");
