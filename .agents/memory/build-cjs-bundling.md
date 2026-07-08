---
name: Production build bundling
description: How dev vs production servers are built for this project, and the trap that caused prod/dev divergence.
---

# Production build (`script/build.cjs`) must bundle the real server

**Rule:** `script/build.cjs` produces `dist/index.cjs` (run in production via `node dist/index.cjs`). It MUST bundle the actual `server/index.ts` with esbuild. Do not hand-write a separate server implementation inside the build script.

**Why:** The build script originally contained a full, hand-written CommonJS copy of the server as a template string. Dev runs `tsx server/index.ts` (the real source); production ran that stale string copy. Any server change made to `server/index.ts` (e.g. swapping PIN auth for Replit Auth) silently never reached production — endpoints 404'd in prod while working in dev. This is invisible until you curl production.

**How to apply:**
- Server-side changes go in `server/index.ts` (and `server/replit_integrations/**`). Never duplicate logic into `build.cjs`.
- esbuild config: `format: "cjs"`, `platform: "node"`, `bundle: true`. Bundle ESM-only deps (e.g. `openid-client`) IN — do not mark them external, or `require()` fails at runtime under CJS.
- CJS bundle breaks `fileURLToPath(import.meta.url)` (import.meta.url is undefined). Fix via esbuild `banner` + `define`: `banner.js = "const import_meta_url = require('url').pathToFileURL(__filename).href;"` and `define["import.meta.url"] = "import_meta_url"`.
- Static file root differs dev vs prod: dev serves from project root (`__dirname/..`), prod serves from `dist/public`. `server/index.ts` picks the dir by checking if `__dirname/public` exists.
- After any server change: rebuild AND republish. Verify prod with `curl https://<app>.replit.app/api/<route>` — dev passing is not sufficient.
