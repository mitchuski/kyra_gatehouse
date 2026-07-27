# The documentation suite

Every document has one job. Start from your role:

**A judge or reviewer with five minutes** →
[the review in plain words](chronicles/2026-07-17_session-4-review-and-apps.md)
(part one), then the [architecture overview](architecture.md), then the
[pitch narrative](pitch-narrative-rwa-gatehouse.md) for where it goes.

**Someone running the demo** → [demo-runbook.md](demo-runbook.md).

**A builder joining a session** → [`../CLAUDE.md`](../CLAUDE.md) FIRST (the
binding contract), then [architecture.md](architecture.md), then the newest
[chronicle](chronicles/README.md) for exactly where work stands, then
[app-flow.md](app-flow.md) if touching UI.

**An auditor** → [`../packages/contracts/CONTRACTS_FROZEN.md`](../packages/contracts/CONTRACTS_FROZEN.md)
(what is frozen and its hashes), then [`../runtimes/README.md`](../runtimes/README.md)
(the independent recompute lane), then [`../guardrails/`](../guardrails/)
(the four guardrails as tests).

## Inventory

| Document | One job |
|---|---|
| [BRIEF_kyra-gate_collaborators_2026-07-18.md](BRIEF_kyra-gate_collaborators_2026-07-18.md) | **The shareable brief**: the whole work presented for collaborators — story, standards receipts, assurance model, plug-in points |
| [`../README.md`](../README.md) | Front door: what, status, quickstart |
| [`../CLAUDE.md`](../CLAUDE.md) | The binding session contract (rules, mapping, fences) |
| [architecture.md](architecture.md) | The system on one page: layers, lanes, decisions, honest limits |
| [gatehouse-kya-build-plan.md](gatehouse-kya-build-plan.md) | The original WP0–WP9 plan (seed document; status lives in README) |
| [app-flow.md](app-flow.md) | WP5/6 visual blueprint: every panel, its data, its endpoint |
| [demo-runbook.md](demo-runbook.md) | The two-act demo, click by click |
| [pitch-narrative-rwa-gatehouse.md](pitch-narrative-rwa-gatehouse.md) | Act 3, speculative: RWA gatehouse, Lexon-compressed contracts, pools inside / ERC-8004 registries outside |
| [hack-readiness.md](hack-readiness.md) | What remains, against the real deadlines, and who holds each item |
| [chronicles/](chronicles/README.md) | Session-by-session record of decisions and discoveries |
| [`../render/expressions.yaml`](../render/expressions.yaml) | THE registry of submissions, ecosystems, deadlines (the only place they are named) |
| [`../apps/agent-client/ADAPTERS.md`](../apps/agent-client/ADAPTERS.md) | The late-bound lanes: identity (Emissary-shaped) + chain registry (ERC-8004-shaped) |
| [`../runtimes/README.md`](../runtimes/README.md) | The dream-fold auditor lane: 7 runtimes, 85 checks |
