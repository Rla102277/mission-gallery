import express from "express";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(express.static(join(dirname(__dirname), "public")));

app.listen(port, "0.0.0.0", () => {
  console.log(`Static file server listening on port ${port}`);
});
