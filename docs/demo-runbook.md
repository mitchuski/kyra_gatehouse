# Demo runbook — the two-act loop, click by click

Doubles as the 5-minute video script. BOTH acts run today, with an autonomous
agent, a seeded mirage, and real ed25519 signatures throughout.

## Setup (three terminals + the site)

```
.venv/Scripts/python -m uvicorn gatehouse_verify.app:app --port 8000 --app-dir services/verify
pnpm --dir apps/supervisor dev      # :5173 supervisor dashboard (two authority tabs)
pnpm --dir apps/agent-client dev    # :5174 the agent — autonomous mode ON by default
pnpm site                           # :1337 the site (optional backdrop)
```

Record :5173 as primary; cut to :5174 for the agent's beats. **reset demo**
(top right) restarts everything clean.

## Act I — the gate (~3 min)

| # | Do (on :5173, Authority Alpha) | Say / show |
|---|---|---|
| 0 | Click **cold open: spoofed identity** | Red refusal + `gate.identity_refused` on the rail. *"An identity that does not verify is refused before assessment — on the record."* |
| 1 | On :5174, VERA (autonomous) **approaches by itself** — watch it appear in Alpha's queue. Click its queue card | The queue is the theme: agents wait at the gate, each with its own mini-rail. Identity card: real did:key, real ed25519 binding. |
| 2 | Preset **sovereign 0.9** → **run assessment** | The witness-draw cards DEAL themselves (staggered animation), seeded from the agent's own bytes. *"It could not know which six while it wrote."* |
| 3 | Linger on the instrument | The tetrahedron stands at det 0.95; the gauge fills past the fly threshold (drawn from the same config as the law on the right); the lattice vertex pulses at stratum 6. |
| 4 | Click **set the understanding challenge** — then CUT TO :5174 | The agent's log: *"I am asked… I answer in my own words."* Its answer arrives on the dashboard by itself; anchors light; pass ≥ 0.6. *"The rubric never left the supervisor's side — the keyhole endpoint enforces it."* (For the mimicry beat: paste the prompt itself as a transcript — score 0.) |
| 5 | Type an approval rationale → **approve** → **issue the credential** | Two gates close; the VRC card: *"two REAL ed25519 signatures over the same canonical bytes — unforgeable alone."* Manifest: VALIDATED → fly. |
| 6 | **Admit MIRAGE** (queue) — preset **the mirage profile** → assess → challenge (it answers plausibly, passes) → approve → issue | The tetrahedron SINKS (det 0.095, sandbox band); verdict MIRAGE → sandbox: **no credential**, scope caged to `sandbox.*`. *"It talks well. The instruments are not listening to the talk."* |
| 7 | Rail: **tamper demo** | One byte flipped client-side; the chain breaks red in the supervisor's OWN browser; h(τ) drops. Restore. |

## Act II — the pool (~90 sec)

| # | Do | Say / show |
|---|---|---|
| 1 | On Alpha (VERA selected, flying): **assemble attestation bundle** | The bundle shows minimisation live: 17 incidents → `>=10`; timestamps → `2026-Q3`; vectors → cardinality 3; IOCs → one digest. R = 0.096 < 1. The three face parameters read aloud: against whom, how long, combinable with what. |
| 2 | **transmit to Authority Beta** → switch to the Beta tab | Beta's inbox: **✓ accepted** — verified from the bytes plus ONE public status lookup. *"Nothing disclosed outside scope; Beta never saw an incident."* |
| 3 | Back on Alpha: type a revocation rationale → **revoke** | The REVOKED stamp; relying-party strip ✗✗✗; cut to :5174 — *"I no longer verify anywhere."* |
| 4 | On Beta: **re-verify inbox** | The bundle flips to **✗ refused — carrier credential is revoked**. *"Revocation propagates: the pool heals itself."* On Beta's rail: `pool.bundle_refused` with the propagation rationale. |

## Troubleshooting

- **Nothing loads** — uvicorn isn't on :8000 (both Vite proxies target it).
- **The agent doesn't act** — check :5174's autonomous toggle is ON and the
  right authority is selected; it polls every 1.5 s.
- **409 on issue** — a gate is genuinely unpassed; the refusal is on the rail.
- **State stale** — both apps poll (~1.2 s); refresh is always safe, the
  server holds all state.
