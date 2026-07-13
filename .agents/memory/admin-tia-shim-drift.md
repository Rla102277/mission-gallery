---
name: Admin embedded TIA shim drift
description: admin/index.html embeds its own copy of the TIA data layer that can drift behind assets/js/tia-data.js
---

The admin panel does NOT load `assets/js/tia-data.js`; it embeds its own older inline copy of the `TIA` object. Helpers added to the real data layer (e.g. `cfUrl`) do not automatically exist in the admin.

**Why:** Calling `TIA.cfUrl` from admin code threw "TIA.cfUrl is not a function" in production, silently breaking the picker's Site Library (no try/catch at the time, so the grid just stayed blank).

**How to apply:**
- Before using any `TIA.*` helper in admin code, verify it exists in the admin's inline TIA object — not just in tia-data.js.
- When adding helpers to tia-data.js that admin code needs, mirror them into the admin's inline copy (or better, refactor admin to load the shared file).
- Wrap admin render paths in try/catch that surface errors in the UI; silent failures here look like "button does nothing".
