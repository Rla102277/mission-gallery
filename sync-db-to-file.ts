import "dotenv/config";
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function syncDbToFile() {
  console.log("[Sync] Reading config from Postgres...");
  const res = await pool.query("SELECT config FROM site_config WHERE id = 1");
  if (res.rows.length === 0) {
    console.log("[Sync] No config found in DB");
    await pool.end();
    return;
  }

  const config = res.rows[0].config;
  const configPath = path.join(__dirname, "data", "tia-config.json");
  
  console.log("[Sync] Writing to file...");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("[Sync] Complete. File updated from DB.");
  
  await pool.end();
}

syncDbToFile().catch(console.error);
