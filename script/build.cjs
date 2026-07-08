const { cpSync, mkdirSync, existsSync } = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const rootDir = path.resolve(__dirname, "..");
const distDir = path.join(rootDir, "dist");
const publicDir = path.join(distDir, "public");

mkdirSync(publicDir, { recursive: true });

const staticDirs = ["assets", "pages", "admin"];
const staticFiles = ["index.html"];

staticFiles.forEach(function (file) {
  const src = path.join(rootDir, file);
  if (existsSync(src)) {
    cpSync(src, path.join(publicDir, file));
  }
});

staticDirs.forEach(function (dir) {
  const src = path.join(rootDir, dir);
  if (existsSync(src)) {
    cpSync(src, path.join(publicDir, dir), { recursive: true });
  }
});

esbuild.buildSync({
  entryPoints: [path.join(rootDir, "server", "index.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  target: "node20",
  outfile: path.join(distDir, "index.cjs"),
  external: ["pg-native", "cloudflare:sockets"],
  banner: {
    js: "const import_meta_url = require('url').pathToFileURL(__filename).href;",
  },
  define: {
    "import.meta.url": "import_meta_url",
  },
  logLevel: "info",
});

console.log("Build complete: dist/index.cjs + dist/public/");
