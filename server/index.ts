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
