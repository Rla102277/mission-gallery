import { cpSync, mkdirSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = dirname(__dirname);

const distDir = join(rootDir, "dist");
mkdirSync(distDir, { recursive: true });

cpSync(join(rootDir, "public"), join(distDir, "public"), { recursive: true });

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

writeFileSync(join(distDir, "index.cjs"), serverCode);
console.log("Build complete: dist/index.cjs + dist/public/");
