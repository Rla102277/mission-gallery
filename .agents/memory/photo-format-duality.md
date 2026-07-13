---
name: Photo format duality
description: Photos in config are mixed SmugMug objects and legacy CF strings — all consumers must use TIA helpers
---

Photo entries in the site config are either SmugMug objects (`{imageKey, filename, webUri, caption, sizes:{medium,large,xlarge,x2large}}`) or legacy Cloudflare ID strings (dead — CF account gone).

**Rule:** Any frontend code that renders photos or covers must go through `TIA._mapPhotoIds()` / `TIA.photoUrl()` in `assets/js/tia-data.js`, which handle both formats. Never call string methods (`.substring`, `.split`) directly on a photo entry.

**Why:** The galleries page went completely blank because its inline photo mapping called `aid.substring(0,12)` on SmugMug objects — the TypeError killed the whole render silently.

**How to apply:** When adding a new page/view that shows photos, map through the TIA helpers and test with an object-format photo assigned.
