---
name: Local desktop dev sync
description: How the user's local dev + GitHub sync affects the Replit workspace
---
The user develops locally and pushes to GitHub `Rla102277/mission-gallery` (default branch `replit-main`; old `main` holds an unrelated Feb 2026 history — never merge them).

**Why:** After pulling their local work into Replit, package.json may reference new deps (e.g. dotenv, smugmug) not yet installed here — the dev workflow crashes with ERR_MODULE_NOT_FOUND.

**How to apply:** If the workflow fails right after a pull/merge, install the missing packages via the package tools first; don't debug the code. Meta/OG tags live in static page `<head>`s — link scrapers don't run JS, so config-based overrides (pages.<slug>.title/metaDescription/ogImage) only affect in-browser titles.

**Remote synchronization:** Check the current remote and attempt ordinary `git fetch origin` first; fetching through Replit's GitHub proxy worked on 2026-10-27. Older assumptions that fetch is blocked are stale. Never extract credentials or embed tokens in Git URLs. Inspect both sides of divergent history and preserve local work; get user sign-off before any force push.
