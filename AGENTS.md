# mission-gallery — The Infinite Arch
Full-stack app: Express 5 + Node 20 backend (server/index.ts), HTML pages,
Postgres site_config (JSONB) as the CMS store, Replit Auth, AI enrichment.
Follow REFACTOR_PLAN.md for the current work.

## Hard rules
- SMUGMUG_API_KEY is server-side only. Never in a client file or in config. Never commit .env.
- Do NOT build a custom cart/checkout. Buy = deep-link to each image's SmugMug webUri.
- Do NOT touch auth, AI enrichment, page design, or Replit deploy config.
- Only the image layer and the config read/write path change.
- Ask before installing packages. Show the plan before multi-file edits.
- After changes: npm run check, then npm run dev. Not done until they pass.
