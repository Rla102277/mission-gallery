---
name: Stubbed server endpoints
description: Some legacy API endpoints in this project were stubbed during migrations and silently return empty data
---

During the SmugMug migration, `/api/images/list` was stubbed to return `{images: [], smugmug: true}` and `/api/images/config` stopped returning the Cloudflare delivery hash. The admin UI rendered "No images" with no error, which looked like a frontend bug.

**Why:** A "no data" symptom in the admin can be a server stub, not a client bug — the real Cloudflare listing had been removed, not broken.

**How to apply:** When an admin view shows empty data unexpectedly, curl the backing endpoint first and read its server route before debugging frontend code. Restored endpoints: CF Images listing is paginated (100/page) and admin-guarded; delivery hash comes from `CF_IMAGES_HASH`.
