import "dotenv/config";
import pg from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Octokit } from "@octokit/rest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const IMAGE_ID = "lr-944ab9a178d04ccb98149136b9ef8498";
const STORY_ID = "story-where-dragons-fly";
const STORY_SLUG = "where-dragons-fly";

async function loadConfigFromDB(): Promise<Record<string, any>> {
  const res = await pool.query("SELECT config FROM site_config WHERE id = 1");
  if (res.rows.length === 0) throw new Error("No config row found in DB");
  const config = res.rows[0].config;
  if (!config.stories) config.stories = [];
  return config;
}

async function persistConfig(config: Record<string, any>): Promise<void> {
  await pool.query(
    `INSERT INTO site_config (id, config, updated_at) VALUES (1, $1::jsonb, NOW())
     ON CONFLICT (id) DO UPDATE SET config = EXCLUDED.config, updated_at = NOW()`,
    [JSON.stringify(config)]
  );
  const configPath = path.join(__dirname, "data", "tia-config.json");
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log("[Migration] Written to DB and file.");
}

async function commitToGitHub(config: Record<string, any>): Promise<void> {
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken || githubToken === "YOUR_PAT_HERE") {
    console.log("[Migration] No GITHUB_TOKEN — skipping auto-commit.");
    return;
  }
  const octokit = new Octokit({ auth: githubToken });
  const owner = process.env.GITHUB_OWNER || "Rla102277";
  const repo = process.env.GITHUB_REPO || "mission-gallery";
  const branch = "replit-main";
  const filePath = "data/tia-config.json";

  try {
    const { data: refData } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
    const currentCommitSha = refData.object.sha;

    const { data: commitData } = await octokit.git.getCommit({ owner, repo, commit_sha: currentCommitSha });
    const currentTreeSha = commitData.tree.sha;

    const fileContent = JSON.stringify(config, null, 2);
    const { data: blobData } = await octokit.git.createBlob({
      owner, repo,
      content: Buffer.from(fileContent).toString("base64"),
      encoding: "base64"
    });

    const { data: treeData } = await octokit.git.createTree({
      owner, repo,
      base_tree: currentTreeSha,
      tree: [{ path: filePath, mode: "100644", type: "blob", sha: blobData.sha }]
    });

    const { data: newCommit } = await octokit.git.createCommit({
      owner, repo,
      message: "Auto-commit: Config save from admin",
      tree: treeData.sha,
      parents: [currentCommitSha]
    });

    await octokit.git.updateRef({ owner, repo, ref: `heads/${branch}`, sha: newCommit.sha });
    console.log("[Migration] Auto-committed to GitHub:", newCommit.sha);
  } catch (err: any) {
    console.log("[Migration] GitHub commit failed:", err.message);
  }
}

async function run(): Promise<void> {
  console.log("[Migration] Loading config from DB...");
  const config = await loadConfigFromDB();

  // 1. Check GITHUB_TOKEN
  const token = process.env.GITHUB_TOKEN || "";
  console.log(`[Migration] GITHUB_TOKEN: ${token && token !== "YOUR_PAT_HERE" ? `SET (${token.length} chars)` : "NOT SET / placeholder"}`);

  // 2. Check existing stories
  const stories: any[] = config.stories || [];
  console.log(`[Migration] Existing stories: ${stories.length}`);
  stories.forEach((s: any) => console.log(`  - ${s.slug} | ${s.title}`));

  // 3. Check if already migrated
  if (stories.find((s: any) => s.slug === STORY_SLUG)) {
    console.log(`[Migration] Story '${STORY_SLUG}' already exists — nothing to do.`);
    await pool.end();
    return;
  }

  // 4. Check image current state in assetMeta
  const meta = (config.cf?.assetMeta || {})[IMAGE_ID] as any;
  console.log(`\n[Migration] Image ${IMAGE_ID} assetMeta state:`);
  if (meta) {
    ["hasStoryPage","storyTitle","storyBody","slug","primaryStoryId","storyIds"].forEach(k => {
      if (k in meta) console.log(`  ${k}:`, meta[k]);
    });
  } else {
    console.log("  (no assetMeta entry)");
  }

  // 5. Build story matching The Depth's structure exactly
  const story: Record<string, any> = {
    id: STORY_ID,
    slug: STORY_SLUG,
    title: "Where Dragons Fly",
    heroImageId: IMAGE_ID,
    shortCaption: "The road to Landmannalaugar — a track so raw it felt less like a path than a dare.",
    location: "Iceland",
    camera: "GFX 100S II",
    year: 2025,
    status: "published",
    blocks: [
      {
        type: "text",
        html: "The road to Landmannalaugar — a track so raw it felt less like a path than a dare. Volcanic gravel, river crossings, the kind of grade that makes you wonder whether the vehicle will hold or the mountain will win. I drove it alone, in early September, when the summer crowds had thinned and the highland felt properly abandoned. The light came in low and amber, the way it does when Iceland decides to be generous. I pulled over where the road bent through a field of obsidian and rhyolite, the colours absurd — rust, chartreuse, violet — and waited. Nothing happened for a long time. Then the wind shifted, a gap opened in the overcast, and for about forty seconds the entire valley was lit from below the clouds. I made the frame. The dragons, if they were ever here, had long since moved on. But the ground still looked like theirs."
      },
      {
        type: "image",
        imageIds: [IMAGE_ID]
      }
    ]
  };

  config.stories.push(story);
  console.log(`\n[Migration] Built story: ${STORY_SLUG}`);

  // 6. Update assetMeta entry — clear old fields, set story refs
  if (meta) {
    delete meta.hasStoryPage;
    delete meta.storyTitle;
    delete meta.storyBody;
    delete meta.slug;
    meta.primaryStoryId = STORY_ID;
    if (!meta.storyIds) meta.storyIds = [];
    meta.storyIds.push(STORY_ID);
    console.log("[Migration] Updated assetMeta for image.");
  }

  // 7. Also update photo entries in portfolioWorks galleries
  let photosUpdated = 0;
  function walkPhotos(obj: any): void {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj)) { obj.forEach(walkPhotos); return; }
    if (obj.imageKey === IMAGE_ID || obj.assetId === IMAGE_ID) {
      delete obj.hasStoryPage;
      delete obj.storyTitle;
      delete obj.storyBody;
      delete obj.slug;
      obj.primaryStoryId = STORY_ID;
      obj.storyIds = [STORY_ID];
      photosUpdated++;
    }
    Object.values(obj).forEach(walkPhotos);
  }
  walkPhotos(config.portfolioWorks);
  console.log(`[Migration] Updated ${photosUpdated} photo entries in portfolioWorks.`);

  // 8. Persist to DB + file
  await persistConfig(config);

  // 9. Auto-commit to GitHub
  await commitToGitHub(config);

  // 10. Final summary
  console.log("\n=== MIGRATION COMPLETE ===");
  console.log(`Story slug:    ${story.slug}`);
  console.log(`Story title:   ${story.title}`);
  console.log(`heroImageId:   ${story.heroImageId}`);
  console.log(`Blocks:        ${story.blocks.length} (text + image)`);
  console.log(`Status:        ${story.status}`);
  console.log(`Stories total: ${config.stories.length}`);

  await pool.end();
}

run().catch(async (err) => {
  console.error("[Migration] Fatal:", err);
  await pool.end();
  process.exit(1);
});
