// Zero-dep static server for site/ at http://localhost:1337 (pnpm site).
// Local-only by design: the site deploys nowhere until Mitchell says so.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "site");
const PORT = 1337;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
};

createServer(async (req, res) => {
  const url = (req.url ?? "/").split("?")[0];
  const rel = url === "/" ? "index.html" : url.slice(1);
  const file = path.normalize(path.join(root, rel));
  if (!file.startsWith(root)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": MIME[path.extname(file)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("not found");
  }
}).listen(PORT, "127.0.0.1", () => {
  console.log(`gatehouse site: http://localhost:${PORT}`);
});
