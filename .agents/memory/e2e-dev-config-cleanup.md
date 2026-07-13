---
name: E2E test data cleanup in dev config
description: How to remove e2e test writes from the shared dev site_config when the API is auth-gated
---

The e2e testing subagent uses the SAME dev database/config as the user, so any admin-panel test that saves writes real values into `site_config` (id=1).

**Rule:** after e2e runs that save config, scrub the test values.

**Why:** POST /api/config requires an authenticated Replit admin session (returns 401 from scripts), so cleanup must go directly to Postgres: read `config` JSONB, delete the test fields (including propagated copies on embedded photo objects in portfolioWorks), UPDATE the row.

**How to apply:** after the SQL update, restart the workflow — the server caches config in memory and SQL edits are invisible until restart. Use unmistakable test values (e.g. "Test Meta Title E2E") so they are findable for scrubbing.
