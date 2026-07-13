---
name: Lightroom integration (Phase 0)
description: Adobe Lightroom OAuth + album browsing quirks, redirect URIs, and testing notes
---

## Adobe Lightroom API quirks
- Every lr.adobe.io JSON response is prefixed with `while (1) {}` — must strip before `JSON.parse` (helper: `LightroomAuth.stripWhile1` in `assets/js/lightroom-auth.js`). All requests need `Authorization: Bearer <token>` AND `X-API-Key: <ADOBE_CLIENT_ID>`.
- Album walk: `/v2/account` → `/v2/catalog` (store catalog.id) → `/v2/catalogs/{id}/albums` (`data.resources`).
- Basic Adobe tier caps renditions at 2048px; rendition generation is async (POST type, poll HEAD until 200).

## OAuth setup
- Redirect URI must be `<origin>/test/lightroom` and be registered in the Adobe developer console for BOTH the dev domain and https://the-infinite-arch.replit.app. Server computes it from CLIENT_URL || REPLIT_DEV_DOMAIN || REPLIT_DOMAINS. CLIENT_URL is set in production env only.
- OAuth state is HMAC-signed (SESSION_SECRET) + double-bound via HttpOnly `lr_oauth_state` cookie; `/api/adobe/token` rejects missing/mismatched/expired state. Don't remove — architect flagged login-CSRF without it.
- Tokens live in browser localStorage (`adobe_lightroom_auth`), auto-refresh ~60s early via `/api/adobe/refresh-token`. Client secret is server-side only.
- All /api/adobe/* routes are behind isAuthenticated+requireAdmin.

**Why:** live Lightroom image serving failed in the old prototype (renditions expire ~1 day); Lightroom is browse/push source only — public pages must serve CDN/config URLs. Push/Resync (Phase 1) not yet built.
