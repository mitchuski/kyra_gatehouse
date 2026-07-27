# Chronicle — Session 9: hosted, one origin, one command

**Date:** 2026-07-18 · **Trigger:** Mitch: *"okay host this for me and write a
chronicle."* · **Outcome:** the WHOLE Gatehouse runs at
**http://localhost:1337** behind one server and one command — and it is
running right now.

## The hosting ruling, applied

"Host" here means LOCAL hosting, per the standing ruling (no git, no deploys
until hack acceptance): the host binds 127.0.0.1 only. What changed is shape,
not exposure — the three-terminal demo became one origin:

| Path | Serves |
|---|---|
| `/` | the five-page site (Home · How-it-works · Mathematics · Live-demo · Evidence) |
| `/supervisor/` | the built regulator dashboard (queue, instruments, pool scene, audit rail) |
| `/agent/` | the built autonomous keyhole |
| `/a/* /authorities /demo/* /reset /policy /probes /contracts /healthz` | the verify engine, proxied — `scripts/host.mjs` starts uvicorn itself as a child process |

`pnpm host` is the one command. Same-origin proxying removes every CORS/port
seam; the site's Live-demo page now links straight to `/supervisor/` and
`/agent/`, and its start-it section is just the one line.

## What was touched

- **`scripts/host.mjs`** (new): zero-dep static server + API reverse-proxy +
  engine child-process supervisor, localhost-only, with an SPA fallback per
  app mount.
- **Vite `base`** set to `/supervisor/` and `/agent/` so the built bundles
  live under one origin (dev servers on :5173/:5174 still work unchanged for
  development).
- **`site/demo.html`** rewritten for the hosted URLs and the one-command
  start; `package.json` gained `"host"`.

## Verified live

All surfaces answer through :1337: the five site pages, both app shells and
their hashed JS bundles, `/healthz`, `/policy` (the Lexon law), and
`/demo/agents` returning the two real did:key identities. A POST piped
through the proxy end-to-end (AURORA admitted at Alpha's gate), then the
state was reset so Mitchell's first walk starts clean.

## How to walk it (right now)

1. Open **http://localhost:1337** — the site is the front door.
2. Live demo → `/supervisor/` in one tab, `/agent/` in another (autonomous ON).
3. Follow `docs/demo-runbook.md`: Act I ~3 min, Act II ~90 s.

If the host ever stops (reboot, session end): `pnpm host` from the repo root
brings the whole thing back. The engine restarts fresh (in-memory state; a
demo is always one `reset` from clean).

## State

Local-only, uncommitted, per the standing rulings. Doors unchanged: Mitch's
browser walk + video capture; note harvest; acceptance → public deploy +
first commit/tag.
