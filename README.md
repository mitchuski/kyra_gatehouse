# Gatehouse KY-A

**A "Know Your Agent" checkpoint for AI agents, operated by a human
supervisor.** An agent approaches the gate; the supervisor challenges it; it
proves *understanding*, not possession of a key; a bilateral Verifiable
Relationship Credential issues only if both gates pass (human approval + a
passed comprehension challenge); every step lands on a tamper-evident audit
chain; the supervisor can revoke, and the credential fails verification
everywhere, immediately. Deployment scope is granted **by the math**: the
assessment's sovereignty volume det(Σ) decides fly / sandbox / hold.

One engine, many expressions: submissions, ecosystems, and deadlines are
named **only** in [`render/expressions.yaml`](render/expressions.yaml).
The engine is a rendering of the 0xagentprivacy Privacy Value Model —
[`CLAUDE.md`](CLAUDE.md) is the binding contract every session reads first.

## Status

| Layer | State |
|---|---|
| WP0 contracts (8 schemas, probe registry, canon) | ✅ frozen — `contracts-v1`, root `0c5df807…4908eb` |
| WP1 verification engine (probes → Σ → det → lattice → verdict) | ✅ live, zero xfails |
| WP2 issuance + revocation (two-gates ceremony, W3C VC 2.0 bilateral VRC) | ✅ live |
| WP3 understanding-as-key (comprehension, mimicry rules) | ✅ live |
| WP4 audit ledger (content-addressed chain, h(τ)) — Python + browser TS | ✅ live |
| WP5 supervisor dashboard (7 scenes + tamper demo) | ✅ builds & runs |
| WP6 agent client (keyhole view) + adapter lanes (identity · chain-registry) | ✅ builds & runs (providers late-bound) |
| WP7 guardrails (pytest + vitest) + `runtimes/` dream-fold auditors | ✅ 55 + 8 + 85 checks green |
| Demo Act I (gate → credential → revoke) | ✅ runs end-to-end |
| Demo Act II (two-authority pooling) · WP8/9 renders + site | ⬜ next |

## Quickstart

```
scripts/bootstrap.ps1        # or bootstrap.sh — pnpm install + venv + editable installs
pnpm verify                  # build → codegen drift → pytest → vitest → freeze → runtimes
```

Run the demo (three terminals):

```
.venv/Scripts/python -m uvicorn gatehouse_verify.app:app --port 8000 --app-dir services/verify
pnpm --dir apps/supervisor dev      # :5173 — the regulator's view
pnpm --dir apps/agent-client dev    # :5174 — the agent's keyhole
```

Then follow [`docs/demo-runbook.md`](docs/demo-runbook.md).

## Documentation

The suite index is [`docs/README.md`](docs/README.md). Fast paths:

- **Five minutes, what is this?** → [`docs/chronicles/2026-07-17_session-4-review-and-apps.md`](docs/chronicles/2026-07-17_session-4-review-and-apps.md) (part one) → [`docs/architecture.md`](docs/architecture.md)
- **Run the demo** → [`docs/demo-runbook.md`](docs/demo-runbook.md)
- **Build the UI** → [`docs/app-flow.md`](docs/app-flow.md)
- **Where it's going** → [`docs/pitch-narrative-rwa-gatehouse.md`](docs/pitch-narrative-rwa-gatehouse.md)
- **Audit it** → [`runtimes/README.md`](runtimes/README.md) + [`packages/contracts/CONTRACTS_FROZEN.md`](packages/contracts/CONTRACTS_FROZEN.md)

## Repo layout

```
packages/contracts/   frozen schemas + canon + probe registry (TS + Pydantic generated)
packages/audit/       browser mirror of the canon (the dashboard's tamper demo)
services/verify/      the engine: harness.py + assessment/understanding/issuance/ledger + FastAPI
apps/supervisor/      WP5 regulator dashboard
apps/agent-client/    WP6 keyhole app + late-bound adapter lanes
guardrails/           WP7: the four guardrails as tests (pytest + vitest parity)
runtimes/             zero-dep dream-fold auditors over the frozen artifacts (third lane)
render/               expression registry + (WP8) submission generators
docs/                 the documentation suite + chronicles
```

Verdicts are a closed lexicon — VALIDATED→fly, MIRAGE→sandbox, BLOCKED→hold —
and every refusal is itself an audit event: the gate says no on the record.

All commits, tags, and submissions are Mitchell's acts alone.
