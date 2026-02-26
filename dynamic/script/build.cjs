const { cpSync, mkdirSync, existsSync } = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");

mkdirSync(distDir, { recursive: true });

execSync("npx vite build", { cwd: rootDir, stdio: "inherit" });

const staticDirs = ["assets", "pages"];

staticDirs.forEach(function(dir) {
  const src = path.join(rootDir, dir);
  if (existsSync(src)) {
    cpSync(src, path.join(distDir, dir), { recursive: true });
  }
});

const legacyAdminSrc = path.join(rootDir, "admin");
const legacyAdminDest = path.join(distDir, "legacy-admin");
if (existsSync(legacyAdminSrc)) {
  cpSync(legacyAdminSrc, legacyAdminDest, { recursive: true });
}

console.log("Build complete: React app and static pages in dist");
