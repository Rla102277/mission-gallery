---
name: SmugMug API visibility
description: Site uses public SmugMug API (key only) — it can only see PUBLIC albums
---

The server (`server/smugmug.ts`) uses SmugMug's public API with just `?APIKey=` (no OAuth). This only exposes **public** albums of the `theinfinitearch` account.

**Why:** As of July 2026 the API returned only 1 album ("The Platform", 1 photo) even though the user believed their whole library was migrated — remaining albums are unlisted/private or not uploaded. Pagination was verified NOT to be the cause (Pages.Total = 1).

**How to apply:** If admin album browsing shows fewer albums than expected, first check album privacy on SmugMug (must be Public), before suspecting code. Full private access would require OAuth 1.0a implementation.
