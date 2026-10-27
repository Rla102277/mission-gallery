---
name: Clerk standalone browser UI
description: Separate UI loading requirement for Clerk 6 in the static HTML admin.
---
Clerk 6's browser and ESM client bundles do not include mountable sign-in UI by themselves. A standalone HTML client must provide the separate UI constructor when loading Clerk.

**Why:** Switching from the ESM client to the browser bundle alone still produced “Clerk was not loaded with Ui components.” A successful session SDK load is not proof that sign-in can render.

**How to apply:** When changing Clerk versions or loading strategy, verify the rendered sign-in form, not only the auth configuration endpoint or build. Keep the UI and session packages compatible.
