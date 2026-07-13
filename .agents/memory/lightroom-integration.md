---
name: Lightroom integration
description: Adobe Lightroom OAuth, album browsing, and push-to-CDN quirks (Phase 0 + Phase 1)
---

## Adobe Lightroom API quirks
- Every lr.adobe.io JSON response is prefixed with `while (1) {}` — must strip before `JSON.parse` (helper: `LightroomAuth.stripWhile1` in `assets/js/lightroom-auth.js`). All requests need `Authorization: Bearer <token>` AND `X-API-Key: <ADOBE_CLIENT_ID>`.
- Album walk: `/v2/account` → `/v2/catalog` (store catalog.id) → `/v2/catalogs/{id}/albums` (`data.resources`).
- Basic Adobe tier caps renditions at 2048px; rendition generation is async: GET the rendition, on 404 POST with `X-Generate-Renditions` header, then poll GET with backoff.
- Thumbnails can't go in `<img src>` (need auth headers) — fetch the `thumbnail2x` rendition as a blob and use object URLs.

## OAuth setup
- Redirect URI must be `<origin>/test/lightroom` and be registered in the Adobe developer console for BOTH the dev domain and https://the-infinite-arch.replit.app. Server computes it from CLIENT_URL || REPLIT_DEV_DOMAIN || REPLIT_DOMAINS. CLIENT_URL is set in production env only.
- OAuth state is HMAC-signed (SESSION_SECRET) + double-bound via HttpOnly `lr_oauth_state` cookie; `/api/adobe/token` rejects missing/mismatched/expired state. Don't remove — architect flagged login-CSRF without it.
- Tokens live in browser localStorage (`adobe_lightroom_auth`), auto-refresh ~60s early via `/api/adobe/refresh-token`. Client secret is server-side only. Server push routes receive the client-held token via `X-Lightroom-Token` header.
- All /api/adobe/* and /api/lightroom/* routes are behind isAuthenticated+requireAdmin.

## Push/Resync design (Phase 1)
- CDN target is **Cloudflare Images** (existing CF_ACCOUNT_ID/CF_IMAGES_TOKEN/CF_IMAGES_HASH secrets), NOT R2 — user decision. Deterministic image id `lr-{assetId}`; upload conflict (409/5409) → delete + re-upload (that IS the resync path). Account variants: public, thumb, full, cover, hero.
- Photo objects written to config map size slots to variants: medium→thumb, large→cover, xlarge→hero, x2large→full. Objects need `.sizes` to hit the object branch of `TIA._mapPhotoIds`.
- One asset per push request; the admin client loops sequentially for batches (progress UI + avoids autoscale request timeouts).
- **Clobber trap:** server-side config writes make the admin's local STATE stale — after any server push/resync the admin must `STATE = await TIA.load()` or a later Save & Publish silently reverts the push.
- **Resync gotcha:** cover fields (`coverAssetId`, `featuredImageId`) may hold legacy string ids, not objects — resync URL rewriting must upgrade string refs too (architect caught this).

**Why:** live Lightroom image serving failed in the old prototype (renditions expire ~1 day); Lightroom is browse/push source only — public pages serve only CDN URLs from cached config.
