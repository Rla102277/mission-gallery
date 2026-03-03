const { cpSync, mkdirSync, writeFileSync, existsSync } = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const publicDir = path.join(distDir, "public");

mkdirSync(publicDir, { recursive: true });

const staticDirs = ["assets", "pages", "admin"];
const staticFiles = ["index.html"];

const dataDir = path.join(rootDir, "data");
const distDataDir = path.join(distDir, "data");
mkdirSync(distDataDir, { recursive: true });
const distConfig = path.join(distDataDir, "tia-config.json");
if (existsSync(path.join(dataDir, "tia-config.json"))) {
  cpSync(path.join(dataDir, "tia-config.json"), distConfig);
}

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
const fs = require("fs");
const multer = require("multer");
const exifReader = require("exif-reader");

const app = express();
const port = Number(process.env.PORT) || 5000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
app.use(express.json({ limit: "10mb" }));

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_IMAGES_TOKEN = process.env.CF_IMAGES_TOKEN;
const CF_IMAGES_HASH = process.env.CF_IMAGES_HASH;
var CF_HASH = CF_IMAGES_HASH;
var CONFIG_PATH = path.join(__dirname, "data", "tia-config.json");

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

app.get("/api/images/list", async function(req, res) {
  if (!CF_ACCOUNT_ID || !CF_IMAGES_TOKEN) {
    return res.status(500).json({ error: "Cloudflare Images not configured" });
  }
  try {
    var allImages = [];
    var cursor = null;
    do {
      var url = "https://api.cloudflare.com/client/v4/accounts/" + CF_ACCOUNT_ID + "/images/v2?per_page=100";
      if (cursor) url += "&continuation_token=" + encodeURIComponent(cursor);
      var cfRes = await fetch(url, { headers: { "Authorization": "Bearer " + CF_IMAGES_TOKEN } });
      var data = await cfRes.json();
      if (!data.success) break;
      (data.result.images || []).forEach(function(img) {
        allImages.push({ id: img.id, filename: img.filename, uploaded: img.uploaded, requireSignedURLs: img.requireSignedURLs, variants: img.variants });
      });
      cursor = data.result.continuation_token || null;
    } while (cursor);
    res.json({ images: allImages, hash: CF_HASH });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/images/config", function(req, res) {
  res.json({ hash: CF_HASH || "", accountId: CF_ACCOUNT_ID ? "configured" : "missing" });
});

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

var Anthropic = null;
try { Anthropic = require("@anthropic-ai/sdk"); } catch(e) {}

app.post("/api/ai/enrich", async function(req, res) {
  var pin = req.headers["x-admin-pin"];
  if (pin !== "tia2026") return res.status(401).json({ error: "Unauthorized" });
  if (!Anthropic) return res.status(500).json({ error: "Anthropic SDK not available" });
  var baseURL = process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL;
  var apiKey = process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY;
  if (!baseURL || !apiKey) return res.status(500).json({ error: "AI integration not configured" });
  var field = req.body.field || "";
  var current = req.body.current || "";
  var context = req.body.context || {};
  var mode = req.body.mode || "enrich";
  var systemPrompt = "You are a writing assistant for a fine-art photography portfolio website called The Infinite Arch. " +
    "The photographer specializes in landscape and expedition photography with a Fujifilm GFX system. " +
    "The tone is: literary, contemplative, precise — like a quiet essay. Avoid clichés, marketing speak, and exclamation marks. " +
    "Keep the voice grounded and authentic. Do not use em-dashes excessively.";
  var userPrompt = "";
  if (mode === "enrich") {
    userPrompt = "Enrich and improve the following " + field + " text for a photography portfolio work. " +
      "Make it more evocative and compelling while keeping the photographer\\'s authentic voice. " +
      "Context about this work: Title: " + (context.title || "") + ", Type: " + (context.type || "") +
      ", Location: " + (context.location || "") + ", Camera: " + (context.camera || "") + ". " +
      "Return ONLY the improved text, nothing else. Keep it roughly the same length unless the original is very short. " +
      "Current text: " + current;
  } else if (mode === "generate") {
    userPrompt = "Generate a " + field + " for a photography portfolio work. " +
      "Context: Title: " + (context.title || "") + ", Type: " + (context.type || "") +
      ", Location: " + (context.location || "") + ", Camera: " + (context.camera || "") +
      ", Subtitle: " + (context.subtitle || "") + ". " +
      "Return ONLY the text, nothing else. " +
      (field === "description" ? "Write 2-3 sentences that capture the essence and intent of this body of work." :
       field === "subtitle" ? "Write a short, evocative subtitle (under 10 words)." :
       "Write appropriate content for this field.");
  } else if (mode === "shorten") {
    userPrompt = "Make this " + field + " text more concise while preserving its meaning and tone: " + current +
      "\\nReturn ONLY the shortened text.";
  } else if (mode === "expand") {
    userPrompt = "Expand this " + field + " text with more detail and depth while maintaining its tone: " + current +
      "\\nContext: Title: " + (context.title || "") + ", Location: " + (context.location || "") +
      "\\nReturn ONLY the expanded text.";
  }
  try {
    var client = new Anthropic({ apiKey: apiKey, baseURL: baseURL });
    var message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      messages: [{ role: "user", content: userPrompt }],
      system: systemPrompt
    });
    var text = message.content[0] && message.content[0].type === "text" ? message.content[0].text : "";
    res.json({ text: text.trim() });
  } catch (err) {
    res.status(500).json({ error: err.message || "AI request failed" });
  }
});

app.get("/api/config", function(req, res) {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      var data = fs.readFileSync(CONFIG_PATH, "utf-8");
      res.type("application/json").send(data);
    } else {
      res.json({});
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/config", function(req, res) {
  try {
    var dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(req.body, null, 2));
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use(express.static(path.join(__dirname, "public")));

app.listen(port, "0.0.0.0", function() {
  console.log("Static file server listening on port " + port);
});
`;

writeFileSync(path.join(distDir, "index.cjs"), serverCode);
console.log("Build complete: dist/index.cjs + dist/public/");
