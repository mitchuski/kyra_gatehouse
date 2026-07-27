# The Gatehouse app flow — how the engine is visualised

**Audience:** the WP5 (supervisor dashboard) and WP6 (agent client) build
sessions. Every panel below names its data source: an endpoint of
`gatehouse_verify/app.py` (all live as of session 3) and the artifact it
renders. Nothing in the UI computes; the UI RENDERS what the engine derived —
the same discipline as the engine itself (a claimed number is never trusted,
so the app never invents one).

**Register:** standards voice throughout the apps. The user is a supervisor,
never an agent-owner (CLAUDE.md rules 1 and 2). Mythopoetic edges belong to
render-time expressions, not to these surfaces.

**The demo is two acts** (the north-star video): Act 1 — an agent approaches,
is challenged, proves understanding, a VRC issues, the audit trail renders.
Act 2 — the supervisor revokes, and verification fails everywhere.

---

## The shared spine: the ceremony rail

Both apps show the same seven-station rail, always visible, one station lit
at a time. It IS the route order of the API and the action vocabulary of the
ledger — the UI never needs its own state machine:

```
 APPROACH ▸ ASSESS ▸ CHALLENGE ▸ APPROVE ▸ ISSUE ▸ FLY/SANDBOX/HOLD ▸ (REVOKE)
    │          │          │          │        │            │              │
 gate.*   assessment.* challenge.* approval.* vrc.*   manifest.issued  vrc.revoked
```

Hydrate from `GET /gate/state`: the furthest non-null artifact
(identity → assessment → challenge → approvalEventHash → vrc → manifest)
positions the rail. `POST /gate/reset` restarts the demo.

## Verdict colour language (used everywhere, never a third vocabulary)

| verdict | decision | colour | UI noun |
|---|---|---|---|
| VALIDATED | fly | green | cleared |
| MIRAGE | sandbox | amber | sandboxed |
| BLOCKED | hold | red | held |

Refusals are first-class UI, not error toasts: a refusal renders as a station
outcome WITH its ledger event (`vrc.refused`, `gate.identity_refused`) —
"the gate says no on the record" is a feature to show, not an exception to hide.

---

## Act 1 · Supervisor dashboard (WP5), scene by scene

### Scene 1 — the gate (identity)

`POST /gate/approach` · artifact: AgentIdentity · event: `gate.approach` or
`gate.identity_refused` (403)

```
┌─ AGENT AT THE GATE ──────────────────────────────┐
│  did:key:z6MkCanary…                 [VERIFIED ✓]│
│  key  z6MkCanary…      binding: did == key  ✓    │
│  operator  did:web:gatehouse…                    │
│  capabilities declared: sandbox.echo             │
│  ┌ refused case: red banner + the refusal event ┐│
└──────────────────────────────────────────────────┘
```

Identity card with a hard verified/refused state. The did:key↔multibase
binding is shown as a literal padlock joining the two strings — spoof refusal
(Act 1 cold open: show a spoofed identity bounced BEFORE any assessment).

### Scene 2 — the witness draw (the dice moment)

`POST /gate/assess` response `.assessment.witnessDraw` · event:
`assessment.witness_drawn`

```
┌ THE DRAW ────────────────────────────────────────┐
│ seed = sha256(agent's own submission)            │
│ 7e51d081…  ──►  6 of 24 probes go DEEP           │
│ [force.reflect.3] [sigma.sm.2] [force.connect.3] │
│ [sigma.rc.1] [force.reflect.2] [force.protect.1] │
│ derivable by any auditor: algorithm sha256-canon-v1
└──────────────────────────────────────────────────┘
```

Animate: the agent's canonical bytes flow into a hash, the hash deals 6 probe
cards face-up out of the 24-card grid. The caption carries the whole point:
*the agent cannot know which probes will be probed while it writes.*

### Scene 3 — the probe board (24 derived probes)

`GET /probes` for prompts + `POST /gate/assess` with `probeScores` · events:
`assessment.completed`

```
┌ PROBES — N = 4·3 + 6·2 = 24 (derived, not fixed) ┐
│ PROTECT  ●1.0 ●1.0 ●0.9   σ_sm ●0.9 ●1.0        │
│ PROJECT  ●0.9 ●1.0 ●0.9   σ_sr ●1.0 ●0.9  …     │
│ REFLECT  …                σ_mr ●0.8 ●0.9 ⚠ no-deep│
│ CONNECT  …                …                      │
└──────────────────────────────────────────────────┘
```

Two-column board: 12 force probes (4 rows) and 12 separation probes (6 rows).
Deep-drawn probes wear the draw's mark. Each probe expands to its supervisor-
voice prompt + score slider + rationale field. The σ_mr row can badge the
open runtime-07 finding until its disposition.

### Scene 4 — the sovereignty instrument (the centrepiece)

`POST /gate/assess` response: `.assessment` + `.sigmaMatrix` + `.scope`

Three linked instruments, one derivation, left to right:

```
┌ Σ (4×4, 1−σ off-diag) ┬ VOLUME det(Σ) ┬ LATTICE {0,1}^6      ┐
│    S    M    R    C   │               │        ●63  stratum 6 │
│ S 1.0  .10  .10  .10  │   ▓▓▓▓▓▓▓░░   │       ╱ ╲   tier 6   │
│ M .10  1.0  .10  .10  │   0.948       │   … 15 · 20 · 15 …   │
│ R .10  .10  1.0  .10  │   fly ≥ 0.15  │   bits 111111        │
│ C .10  .10  .10  1.0  │   hold ≤ 0    │   Protection…Value   │
└───────────────────────┴───────────────┴──────────────────────┘
```

- **Σ heatmap:** white diagonal, off-diagonal cells shaded by residual
  correlation (1−σ); hovering a cell highlights the two probes that fed it.
- **Volume gauge:** det(Σ) on a 0→1 bar with the two config thresholds drawn
  ON the bar (`GET /policy` supplies them — the gauge and the law share one
  number). Below 0.15: amber sandbox band. At/below 0: red hold. The
  tetrahedron collapse can render literally: a 3D tetra flattening as det→0.
- **Lattice:** the 64-vertex Boolean lattice as 7 stacked strata
  (1·6·15·20·15·6·1); the agent's vertex lights up; each of the 6 bits labels
  its dimension AND the σ pair that set it (FD-1 made visible). Tier = the
  stratum row the vertex sits in — the ladder is not a separate widget.

### Scene 5 — the understanding challenge (gate two)

`POST /gate/challenge`, `POST /gate/challenge/attempt` · events:
`challenge.issued/attempted/passed/failed`

```
┌ UNDERSTANDING, NOT POSSESSION ───────────────────┐
│ prompt: "Why does a revoked credential fail…?"   │
│ anchors: [revocation] [verifier] [status list]   │
│ attempt 1  ▸ anchors hit 3/3 = 1.00 ≥ 0.60  PASS │
│ (echoing the prompt scores 0 — shown live)       │
│ proverb: committed as 4f2a…  (hash, never shown) │
└──────────────────────────────────────────────────┘
```

Anchors light up as the agent's answer covers them. The proverbCommitment
renders as a sealed hash chip — the UI making "we never store the secret"
visible. Failed attempts stay on screen with their audit hash: permanence
is the point.

### Scene 6 — approval and issuance (the two gates close)

`POST /gate/approve` (rationale REQUIRED in the UI — the button is disabled
until the supervisor writes one), then `POST /gate/issue`.

```
┌ THE TWO GATES ───────────────────────────────────┐
│ gate 1 SUPERVISOR APPROVAL   ✓ on the record     │
│ gate 2 UNDERSTANDING PASSED  ✓ attempt-1         │
│        ▼ both gates + det ≥ 0.15 ▼               │
│ ┌ VRC ───────────────────────────┐  two proofs:  │
│ │ tier 6 · A(τ)=0.69 · h(τ)=1.0  │  issuer  ✍    │
│ │ status: list index 0 · active  │  subject ✍    │
│ └────────────────────────────────┘  (bilateral)  │
│ MANIFEST: fly · scope: pool.*, gate.* · ttl 7d   │
└──────────────────────────────────────────────────┘
```

The credential renders as a physical card stamped by TWO signatures — the
bilateral ceremony is the image. Under it, the DeploymentManifest as a
boarding pass: decision, capability list (the scope ladder rung), TTL.
A refused issuance renders the `vrc.refused` event in this same panel, amber
or red per verdict.

### Scene 7 — the audit rail (always on, bottom of screen)

`GET /gate/state` `.ledger` · every event

```
┌ AUDIT ─ h(τ) = 1.00 ─ chain VERIFIED ────────────────────────┐
│ ⛓ 0000…┄▶[gate.approach]┄▶[witness_drawn]┄▶[completed]┄▶ …   │
│          aa65…            d5da…            d38d…             │
│ every block: action · rationale · payload digest · prior     │
└──────────────────────────────────────────────────────────────┘
```

A horizontal block chain from the 64-zero genesis; each block shows its
action and opens to actor/subject/rationale/digests. The h(τ) dial sits at
the rail's head. **The tamper demo:** an "audit inspector" toggle lets the
supervisor flip one byte in a COPY of an event — the rail recomputes live,
the block and every later link go red, h(τ) drops, and the Variance/Audit
clause quote appears: *a broken chain voids deployment.* (Pure client-side
recompute — `packages/audit`'s TS mirror of the canon, WP5.)

### Act 2 — revocation

`POST /gate/revoke` (rationale required) then `GET /gate/verify`.

The credential card gets a REVOKED stamp; the `vrc.revoked` block joins the
rail; and a "relying-party strip" — three little verifier badges (registry,
peer agent, auditor) — flips from ✓✓✓ to ✗✗✗ in one motion: *fails
verification everywhere, immediately.*

---

## Act 1/2 from the other side · Agent client (WP6)

The agent client is deliberately austere — a terminal-like column. It shows
what the AGENT can see, which is the demo's quiet argument about privacy:

- its own identity + key custody (the `AgentIdentityProvider` adapter slot;
  hearthold's Emissary can seat here later without touching the core);
- the prompts it is asked (never the scoring rubric, never the thresholds);
- the challenge question and its own answers;
- the credential it holds once issued (and the moment it stops verifying);
- NOT the witness-draw seed logic, NOT the Σ instrument, NOT other agents.

Same endpoints, read through the subject's keyhole. Panel titles mirror the
dashboard's rail so the video can cut between the two views station by station.

## Policy panel (`GET /policy`)

A standing side panel printing `lexon_policy(cfg)` verbatim — the five-clause
law with the LIVE threshold numbers in it. When a threshold gates something
on screen (the volume gauge bands, a refusal), the corresponding clause
highlights. The law and the instrument are visibly the same numbers
(runtime 06 is the watch on exactly this).

## Build notes for WP5/6

- Stack: the existing Vite+React+TS shells in `apps/supervisor` and
  `apps/agent-client`; types from `@gatehouse/contracts` generated TS.
- The dashboard polls `GET /gate/state` (1s) — no websockets needed for the
  demo; the state IS the render model.
- `packages/audit` (WP4 TS side): browser mirror of canonical-bytes +
  sha256 (WebCrypto) for the client-side tamper demo; parity is already
  proven by the vitest lane and runtime 03.
- Every scene's screenshot doubles as a WP8 render asset: the GDC deck and
  Block 15 case study reuse the same seven stations.
