import "dotenv/config";
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function loadConfigFromDB() {
  const res = await pool.query("SELECT config FROM site_config WHERE id = 1");
  if (res.rows.length === 0) return null;
  const config = res.rows[0].config;
  if (!config.stories) config.stories = [];
  return config;
}

function loadConfigFromFile() {
  const configPath = path.join(__dirname, "data", "tia-config.json");
  const content = fs.readFileSync(configPath, "utf-8");
  const config = JSON.parse(content);
  if (!config.stories) config.stories = [];
  return config;
}

async function persistConfig(config) {
  await pool.query(
    `INSERT INTO site_config (id, config, updated_at) VALUES (1, $1::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET config = EXCLUDED.config, updated_at = NOW()`,
    [JSON.stringify(config)]
  );
  // Also write to file for fallback
  const configPath = path.join(__dirname, "data", "tia-config.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("[Migration] Written to file fallback");
}

async function migrateStories() {
  console.log("[Migration] Starting...");
  // Load from file directly to ensure we get the latest changes
  const config = loadConfigFromFile();
  console.log("[Migration] Loaded config from file");

  if (!config.stories) config.stories = [];
  if (!config.cf || !config.cf.assetMeta) {
    console.log("[Migration] No assetMeta found");
    return;
  }

  const assetMeta = config.cf.assetMeta;
  let migrated = 0;
  const report = [];

  console.log(`[Migration] Found ${Object.keys(assetMeta).length} images in assetMeta`);
  for (const [imageId, meta] of Object.entries(assetMeta)) {
    const m = meta as any;
    console.log(`[Migration] Checking ${imageId}: hasStoryPage=${m.hasStoryPage}`);
    if (meta && typeof meta === "object" && m.hasStoryPage === true) {
      const storyId = `story-${Date.now()}-${migrated}`;
      const slug = meta.slug || `story-${migrated}`;

      const story = {
        id: storyId,
        slug: slug,
        title: meta.storyTitle || meta.filename || "Untitled",
        heroImageId: imageId,
        blocks: [],
        shortCaption: "",
        saleRef: {
          imageId: imageId,
          saleType: meta.saleType || "none",
          editionSize: meta.editionSize,
          editionsSold: meta.editionsSold,
          printSizes: meta.printSizes,
          printMasterRef: meta.printMasterRef
        },
        location: meta.location || "",
        camera: meta.camera || "",
        year: meta.year || "",
        status: "published"
      };

      if (meta.storyBody) {
        story.blocks.push({ type: "text", html: meta.storyBody });
        story.shortCaption = String(meta.storyBody).replace(/\n+/g, " ").slice(0, 200);
      }

      story.blocks.push({ type: "image", imageIds: [imageId] });

      config.stories.push(story);

      delete meta.hasStoryPage;
      delete meta.storyTitle;
      delete meta.storyBody;
      delete meta.slug;
      meta.primaryStoryId = storyId;
      if (!meta.storyIds) meta.storyIds = [];
      meta.storyIds.push(storyId);

      migrated++;
      report.push(`Migrated image ${imageId} to story "${story.title}" (slug: ${slug})`);
    }
  }

  if (migrated > 0) {
    await persistConfig(config);
    console.log(`[Migration] Complete: ${migrated} stories migrated`);
    console.log(`[Migration] Report: ${report.join("; ")}`);
  } else {
    console.log("[Migration] No images with hasStoryPage=true found");
  }

  await pool.end();
}

migrateStories().catch(console.error);
