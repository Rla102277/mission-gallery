---
name: Admin Images tab has two card renderers
description: Per-card UI in the admin Images tab must be added to BOTH grid renderers or it silently misses the default view
---
The admin Images tab renders image cards through two different functions depending on the source toggle:
- "Site Library" (the DEFAULT source) renders via the SmugMug-style renderer (`renderSmugMugImagesInTab`, fed by `smugmugImages` mapped from library photos)
- The legacy CF grid renders via `renderImgGrid`

Both emit `data-testid="img-card-{id}"`, which makes a missing feature look like a rendering bug.

**Why:** A per-card Story button added only to `renderImgGrid` never appeared in e2e tests because the default library view uses the other renderer.

**How to apply:** Any per-card badge/button/menu in the Images tab must be added to both renderers, and post-save re-rendering must pick the right one based on `imgSource`.
