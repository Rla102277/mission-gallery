import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 5000;
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_IMAGES_TOKEN = process.env.CF_IMAGES_TOKEN;
const CF_IMAGES_HASH = process.env.CF_IMAGES_HASH;

app.post("/api/images/upload", upload.single("file"), async (req, res) => {
  if (!CF_ACCOUNT_ID || !CF_IMAGES_TOKEN) {
    return res.status(500).json({ error: "Cloudflare Images not configured" });
  }
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  try {
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

app.get("/api/images/config", (_req, res) => {
  res.json({ hash: CF_IMAGES_HASH || "" });
});

app.use(express.static(path.join(__dirname, "..")));

app.listen(port, "0.0.0.0", () => {
  console.log(`Static file server listening on port ${port}`);
});
