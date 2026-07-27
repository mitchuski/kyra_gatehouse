// The local host: the WHOLE Gatehouse at http://localhost:1337 — one origin.
//   /              the site (site/)
//   /supervisor/   the built regulator dashboard (apps/supervisor/dist)
//   /agent/        the built agent keyhole (apps/agent-client/dist)
//   /a /authorities /demo/ /reset /policy /probes /contracts /healthz
//                  proxied to the verify service, which this script also starts
// Local-only by design (binds 127.0.0.1): nothing deploys until Mitchell says so.
// Usage: pnpm host   (builds are expected to exist: pnpm -r build first)
import { createServer, request as httpRequest } from "node:http";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 1337;
const API = { host: "127.0.0.1", port: 8000 };
const MOUNTS = [
  ["/supervisor", path.join(repo, "apps", "supervisor", "dist")],
  ["/agent", path.join(repo, "apps", "agent-client", "dist")],
  ["", path.join(repo, "site")],
];
const PROXY_PREFIXES = ["/a/", "/authorities", "/demo/", "/reset", "/policy", "/probes", "/contracts", "/healthz"];
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml",
  ".png": "image/png", ".json": "application/json", ".ico": "image/x-icon",
};

// 1. The engine, as a child process.
const py = path.join(repo, ".venv", "Scripts", "python.exe");
const engine = spawn(py, ["-m", "uvicorn", "gatehouse_verify.app:app", "--port", String(API.port), "--app-dir", "services/verify"], {
  cwd: repo,
  stdio: ["ignore", "inherit", "inherit"],
});
engine.on("exit", (code) => {
  console.error(`engine exited (${code}) — host stays up; restart with pnpm host`);
});
process.on("exit", () => engine.kill());
process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

// 2. One origin for everything.
createServer(async (req, res) => {
  const url = (req.url ?? "/").split("?")[0];

  if (PROXY_PREFIXES.some((p) => url === p.replace(/\/$/, "") || url.startsWith(p))) {
    const upstream = httpRequest(
      { ...API, path: req.url, method: req.method, headers: { ...req.headers, host: `${API.host}:${API.port}` } },
      (up) => {
        res.writeHead(up.statusCode ?? 502, up.headers);
        up.pipe(res);
      },
    );
    upstream.on("error", () => {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ detail: "engine not reachable — is uvicorn up on :8000?" }));
    });
    req.pipe(upstream);
    return;
  }

  for (const [mount, root] of MOUNTS) {
    if (mount && !(url === mount || url.startsWith(mount + "/"))) continue;
    const rel = url.slice(mount.length) || "/";
    const file = path.normalize(path.join(root, rel === "/" ? "index.html" : rel));
    if (!file.startsWith(root)) break;
    try {
      const body = await readFile(file);
      res.writeHead(200, {
        "Content-Type": MIME[path.extname(file)] ?? "application/octet-stream",
        // Local dev host: never let a stale cache mask an edit.
        "Cache-Control": "no-store",
      });
      res.end(body);
      return;
    } catch {
      if (mount) {
        // SPA fallback inside an app mount
        try {
          const body = await readFile(path.join(root, "index.html"));
          res.writeHead(200, { "Content-Type": MIME[".html"] });
          res.end(body);
          return;
        } catch { /* fall through */ }
      }
    }
  }
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("not found");
}).listen(PORT, "127.0.0.1", () => {
  console.log(`GATEHOUSE hosted (local):
  site        http://localhost:${PORT}/
  supervisor  http://localhost:${PORT}/supervisor/
  agent       http://localhost:${PORT}/agent/
  engine      http://localhost:${PORT}/healthz (proxied from :${API.port})`);
});
