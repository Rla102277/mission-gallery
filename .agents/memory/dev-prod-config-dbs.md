---
name: Dev vs prod config databases
description: Development and production use separate Postgres databases for site_config — content diverges between environments
---

Dev and production run against SEPARATE Replit Postgres databases. The `site_config` row (id=1) therefore diverges: content edits or Lightroom pushes made in the live admin exist only in the production config, and dev-side config changes never appear in prod.

**Why:** A Lightroom photo pushed in production was "missing" in dev — confirmed by querying both DBs (prod config contained `lr-` refs, dev had zero). An older assumption that the DB was shared was wrong and has been corrected in replit.md.

**How to apply:**
- When verifying user-reported content state, query the right environment (`executeSql` with `environment: "production"` for read-only prod checks).
- Code/UI fixes only reach the live admin after a republish; content is NOT migrated by publishing.
- Don't "fix" missing prod content by editing the dev config — it won't propagate.
