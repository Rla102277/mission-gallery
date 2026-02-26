const { cpSync, mkdirSync, writeFileSync, existsSync } = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const publicDir = path.join(distDir, "public");

mkdirSync(publicDir, { recursive: true });

execSync("npx vite build", { cwd: rootDir, stdio: "inherit" });

const builtAppHtml = path.join(publicDir, "app.html");
const builtIndexHtml = path.join(publicDir, "index.html");
if (existsSync(builtAppHtml)) {
  cpSync(builtAppHtml, builtIndexHtml);
}

const staticDirs = ["assets", "pages"];

staticDirs.forEach(function(dir) {
  const src = path.join(rootDir, dir);
  if (existsSync(src)) {
    cpSync(src, path.join(publicDir, dir), { recursive: true });
  }
});

const legacyAdminSrc = path.join(rootDir, "admin");
const legacyAdminDest = path.join(publicDir, "legacy-admin");
if (existsSync(legacyAdminSrc)) {
  cpSync(legacyAdminSrc, legacyAdminDest, { recursive: true });
}

const serverCode = `
const express = require("express");
const path = require("path");

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(express.static(path.join(__dirname, "public")));

app.listen(port, "0.0.0.0", () => {
  console.log("Static file server listening on port " + port);
});
`;

writeFileSync(path.join(distDir, "index.cjs"), serverCode);
console.log("Build complete: React app in dist/public + dist/index.cjs");
