---
name: Server config cache staleness
description: Direct DB edits to site_config are not seen by the running server until a cache miss or restart
---
The Express server keeps the site config in an in-memory cache. Story-page lookups (`/work/:slug`) only reload from the database on a lookup MISS — a hit is served from cache without re-checking.

**Why:** After deleting a test entry directly via SQL, the route still returned 200 until the workflow was restarted; deletions/edits to existing cached entries are invisible to the running server.

**How to apply:** When seeding or cleaning up config via direct SQL in dev, restart the workflow (or trigger a config save through the admin, which refreshes the cache) before trusting route behavior. New slugs work without restart (miss → reload); removed/changed ones do not.
