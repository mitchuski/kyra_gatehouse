# Kyra Gate — Gatehouse KY-A

**A "Know Your Agent" checkpoint for AI agents, operated by a human
supervisor.** An agent approaches the gate; the supervisor challenges it; it
proves *understanding*, not possession of a key; a bilateral Verifiable
Relationship Credential issues only if both gates pass (human approval + a
passed comprehension challenge); every step lands on a tamper-evident audit
chain; the supervisor can revoke, and the credential fails verification
everywhere, immediately. Deployment scope is granted **by the math**: the
assessment's sovereignty volume det(Σ) decides fly / sandbox / hold.

The gate is named for **Kyra** — the persona of balanced, sovereign AI:
the mage in whom protection and projection stand in equilibrium; *the
compass, not the captain*. KY-A — Know Your Agent — keeps her name.

One engine, many expressions: submissions, ecosystems, and deadlines are
named **only** in [`render/expressions.yaml`](render/expressions.yaml).
The engine is a rendering of the 0xagentprivacy Privacy Value Model —
[`CLAUDE.md`](CLAUDE.md) is the binding contract every session reads first.

## Team & collaboration

- **Mitchell (soulbis)** — engine, model, standards lane ·
  [DIF](https://identity.foundation/) member, Trusted Agents WG · chair,
  [ZKP Task Force](https://github.com/trustoverip/dtgwg-zkp-tf), Trust
  Graph WG, Trust over IP
  ([LF Decentralized Trust](https://www.lfdecentralizedtrust.org/)) ·
  co-chair, Identity, Key Management & Privacy (IKP) WG,
  [BGIN](https://bgin-global.org/)
- **Christian Saucier** — Hearthold / GenitriX (Archon ecosystem) —
  identity, custody, the hearth · [DIF](https://identity.foundation/)
  member, Trusted Agents WG · Trust over IP
  ([LF Decentralized Trust](https://www.lfdecentralizedtrust.org/))
- **Chloe White** — risk, regulatory & policy ·
  [Risk Mastery](https://riskmastery.xyz/) ·
  [chloewhite.info](https://chloewhite.info/index.html)

The collaboration is a braid: the City of Mages / 0xagentprivacy research
programme × the [Hearthold](https://github.com/Flaxscrip/hearthold)
project, with research carried through BGIN. It has already been
exercised: the Hearthold team ran this gate **unmodified**, end to end —
the full demo script (33/33) and the complete verification suite, green.
The CDIR Track 4 concept note lives at
[`render/cdir-track4-note/concept-note.md`](render/cdir-track4-note/concept-note.md).

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
| WP7 guardrails (pytest + vitest) + `runtimes/` auditors (10 lanes) | ✅ 64 + 8 + 128 checks green |
| Demo Act I (gate → credential → revoke) | ✅ runs end-to-end |
| Demo Act II (two-authority pooling, minimised bundles, revocation propagation) | ✅ runs end-to-end (14-beat e2e auto-run) |
| ToIP Trust Task bridge (`agent-admission/*`) + independent 2nd implementation | ✅ interop proven both directions on every verify |
| WP9 site + apps hosted at one origin | ✅ `pnpm host` → localhost:1337 (deploy = Mitchell's act) |
| **Total: one command, 214 automated assertions in independent lanes** | ✅ `pnpm verify` |

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

Or everything at one origin:

```
pnpm host                    # site + supervisor + agent + engine at localhost:1337
```

Then follow [`docs/demo-runbook.md`](docs/demo-runbook.md).

## Documentation

The suite index is [`docs/README.md`](docs/README.md). Fast paths:

- **Five minutes, what is this?** → [`docs/chronicles/2026-07-17_session-4-review-and-apps.md`](docs/chronicles/2026-07-17_session-4-review-and-apps.md) (part one) → [`docs/architecture.md`](docs/architecture.md)
- **Run the demo** → [`docs/demo-runbook.md`](docs/demo-runbook.md)
- **Build the UI** → [`docs/app-flow.md`](docs/app-flow.md)
- **The submission** → [`render/cdir-track4-note/concept-note.md`](render/cdir-track4-note/concept-note.md) (CDIR Track 4: the RWA-credit use case, the collaboration braid, the hearth horizon)
- **Where it's going** → [`docs/pitch-narrative-rwa-gatehouse.md`](docs/pitch-narrative-rwa-gatehouse.md)
- **What just happened** → [`docs/chronicles/2026-07-29_session-18-hearthold-report-rwa-concept.md`](docs/chronicles/2026-07-29_session-18-hearthold-report-rwa-concept.md)
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
