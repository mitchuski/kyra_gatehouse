# Chronicle — Session 4: the review in plain words, then the apps

**Date:** 2026-07-17 · **Part one:** the mid-build review, kept verbatim as
the plain-language statement of what Gatehouse IS (Mitch: "its a good review
here, lets write this as a chronicle"). **Part two** (appended at session
end): the WP5/6 build record.

---

## Part one — what the app is, in plain words

**Gatehouse KY-A is a "Know Your Agent" checkpoint for AI agents, operated by
a human regulator.** Think KYC, but the thing being vetted is an autonomous
agent, and the person at the controls is always a supervisor — never the
agent's owner.

It is two apps sharing one engine (live since session 3):

**1. The supervisor dashboard** — the main app. A regulator sits at a gate
and an AI agent approaches asking to be allowed to operate. On screen, the
supervisor:

- **Checks its identity** — a spoofed identity bounces before anything else
  happens.
- **Assesses it** with 24 probes derived from the Privacy Value Model — six
  of which are picked by a dice-roll seeded from the agent's OWN submission,
  so the agent cannot rehearse for the ones that will be checked deeply.
- **Watches the sovereignty instrument** — the probe scores become a 4×4
  matrix, its determinant is the "volume" of the agent's independence, and
  that lands the agent on one vertex of a 64-position lattice giving its
  tier (0–6).
- **Challenges it to prove understanding** — the agent must explain a concept
  in its own words; parroting the question back scores zero. Authentication
  by comprehension, not by holding a secret.
- **Approves, with a written reason** — the human-in-the-loop gate.
- **Issues a credential** — a Verifiable Relationship Credential signed by
  BOTH parties, which only exists if both gates passed.
- **Sees everything on a tamper-evident audit rail** — every step is a
  hash-chained event with a rationale; flip one byte and the chain visibly
  breaks.
- **Can revoke** — and the credential instantly fails verification
  everywhere.

The verdict is always one of three words: **VALIDATED → fly** (full scope),
**MIRAGE → sandbox** (runs supervised, no credential), **BLOCKED → hold**
(a collapsed assessment or broken audit trail — no deployment at all). Scope
is granted BY THE MATH: high volume gets broad capabilities, low volume gets
a sandbox.

**2. The agent client** — the same ceremony seen through the agent's keyhole:
it sees the questions and its credential, but never the scoring rubric, the
draw logic, or the instruments. That asymmetry is the privacy argument made
visible.

**Why it exists:** the hackathon deliverable for CDIR Track 4 (concept note
31 July, build week 8 Sept), with the same core later rendering the GDC
session material and the Block 15 case study. The demo video is one two-act
story: agent approaches → earns a credential through the two gates →
supervisor revokes and the whole network sees it die.

---

## Part two — the build record (WP5/6 + the Act-3 pitch narrative)

**Outcome:** both apps BUILD GREEN inside `pnpm verify` (55 pytest + 8 vitest
+ 85 runtime checks + workspace build all green; freeze root unchanged);
live-server smoke passed (uvicorn on :8000, HTTP routes answering).

### WP5 — the supervisor dashboard (`apps/supervisor`)

Built scene-by-scene against `docs/app-flow.md`:

- `src/api.ts` — typed client over the demo-loop API (types from
  `@gatehouse/contracts` generated TS); refusals surface as `ApiRefusal` and
  render as first-class outcomes ("on the record: see the rail"), never
  toasts. Ships the canary as the demo agent plus a SPOOFED twin for the
  cold open.
- `src/App.tsx` — the seven-station ceremony rail (station = furthest
  non-null artifact in `/gate/state`; no client state machine), scenes 1–6 +
  Act 2 as progressive disclosure, 1s polling, presets (canary 1.0 /
  sovereign 0.9 / mirage 0.3) on the 24-probe board, echo-the-prompt demo
  button on the challenge, rationale-required approve/revoke inputs, VRC
  card with the two signatures, decision-coloured manifest, relying-party
  strip flipping ✓✓✓→✗✗✗.
- `src/instruments.tsx` — the triptych: Σ heatmap shaded by residual
  correlation 1−σ, det(Σ) volume gauge with the LIVE fly threshold drawn on
  the bar (from `/policy` — the gauge and the law share one number), and the
  64-vertex lattice as seven strata with the vertex lit and FD-1-labelled
  bits.
- `src/AuditRail.tsx` — the always-on rail: chain from the 64-zero genesis,
  every block openable, h(τ) dial, and the TAMPER DEMO — recomputed in the
  browser by `@gatehouse/audit`, editing a client-side COPY; the supervisor's
  own machine, not our server, says the chain broke.
- `src/styles.css` — dark instrument-panel look; the verdict colours
  (green fly / amber sandbox / red hold) are the only accent language.
- `vite.config.ts` proxies `/gate /policy /probes /contracts /healthz` to
  `uvicorn gatehouse_verify.app:app --port 8000`.

### WP4 TS side — `@gatehouse/audit` filled

The browser mirror of the canon: `canonicalJson`, WebCrypto `sha256Hex`,
`auditEventHash`, `checkChain` (per-link results for rendering),
`verifyChain`, `hTau`. Parity with canon.py already proven by the vitest
lane and runtime 03; this package exists so the dashboard can distrust the
server.

### WP6 — the agent client (`apps/agent-client`)

Converted from a types-only package to a Vite app (port 5174, same service)
WITHOUT touching the adapter lane — `AgentIdentityProvider` still exports,
ADAPTERS.md untouched, hearthold still late-bound. The app is a deliberately
austere terminal column: who I am (key custody = the adapter slot), what I
am asked (never the rubric or the draw), what I hold (and the moment it
stops verifying), what happened to me (action names only — the full rail
with rationales belongs to the supervisor). The keyhole asymmetry is the
privacy argument, rendered.

### The Act-3 pitch narrative (mid-session ask)

Mitch: an RWA compliance challenge system as ANOTHER TYPE of gatehouse —
compliance docs as a delegated-agent soulbound token carrying proof of
broker agreement, the Lexon harness compressing documents into executable
contracts run as gatehouse runtimes, privacy pools inside, trust-graph
registries outside — then reframed: *"make this statement more of the
narrative speculative part of the pitch."* Landed as
`docs/pitch-narrative-rwa-gatehouse.md`: Act 3 of the pitch, explicitly
speculative, anchored point-by-point to running machinery (the scope
ladder's `pool.*` rungs, the Lexon correspondence, the runtimes fold, VRC
edges, revocation) with the mapping table proving "one engine, not two
products." No code, no schedule; expressions.yaml stays Mitchell's door.

### Run the demo

```
uvicorn gatehouse_verify.app:app --port 8000 --app-dir services/verify
pnpm --dir apps/supervisor dev      # :5173 — the regulator's view
pnpm --dir apps/agent-client dev    # :5174 — the keyhole
```

### State

Nothing committed. Gate-1 items stand (FD-1 · σ_mr disposition · Σ=1−σ +
VALIDATED-only ratification). Remaining before 31 July: demo video capture,
WP8/9 renders + site skeleton.
