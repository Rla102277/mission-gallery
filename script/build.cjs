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

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(express.static(path.join(__dirname, "public")));

app.listen(port, "0.0.0.0", () => {
  console.log("Static file server listening on port " + port);
});
`;

writeFileSync(path.join(distDir, "index.cjs"), serverCode);
console.log("Build complete: dist/index.cjs + dist/public/");
