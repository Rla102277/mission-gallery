---
name: Local desktop dev sync
description: How the user's local dev + GitHub sync affects the Replit workspace
---
The user develops locally and pushes to GitHub `Rla102277/mission-gallery` (default branch `replit-main`; old `main` holds an unrelated Feb 2026 history — never merge them).

**Why:** After pulling their local work into Replit, package.json may reference new deps (e.g. dotenv, smugmug) not yet installed here — the dev workflow crashes with ERR_MODULE_NOT_FOUND.

**How to apply:** If the workflow fails right after a pull/merge, install the missing packages via the package tools first; don't debug the code. Meta/OG tags live in static page `<head>`s — link scrapers don't run JS, so config-based overrides (pages.<slug>.title/metaDescription/ogImage) only affect in-browser titles.
