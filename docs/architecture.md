# Architecture — the system on one page

Human-facing overview. The binding rules live in [`../CLAUDE.md`](../CLAUDE.md);
this page explains how the pieces fit and why.

## The layers

```
                        ┌──────────────────────────────────────────────┐
   apps/supervisor ────►│  demo-loop API  (gatehouse_verify/app.py)    │
   apps/agent-client ──►│  route order == ceremony order               │
        (keyhole)       └───────────────┬──────────────────────────────┘
                                        │ renders, never computes
        ┌───────────────────────────────▼──────────────────────────────┐
        │  THE ENGINE  services/verify/gatehouse_verify/               │
        │  harness.py     the PVM binding: Σ, det, lattice, verdict,   │
        │                 scope ladder, lexon_policy (frozen interface)│
        │  assessment.py  probe scores → complete AssessmentResult     │
        │  understanding  comprehension gate (anchors, mimicry rules)  │
        │  issuance.py    two-gates ceremony, VRC, revocation, spoof   │
        │  ledger.py      content-addressed chain, h(τ), trails        │
        └───────────────────────────────┬──────────────────────────────┘
                                        │ built ON the frozen contracts
        ┌───────────────────────────────▼──────────────────────────────┐
        │  CONTRACTS-V1 (frozen; root 0c5df807…4908eb)                 │
        │  8 JSON Schemas · 24-probe registry · canon (same bytes,     │
        │  same hash) · witness draw · harness interface signature     │
        │  → generated Pydantic v2 + TS types, drift-checked           │
        └──────────────────────────────────────────────────────────────┘

   Watching everything, three independent lanes:
   guardrails/ (pytest, 55)  ·  guardrails/ts (vitest+ajv, 8)  ·  runtimes/ (zero-dep JS, 85)
```

## The assessment pipeline (WP1)

24 probes derive from config (N = 4·probes_per_force + 6·probes_per_pair —
never a fixed number). Probe scores aggregate into four force scores and six
pairwise separations σ. The Σ matrix carries the **residual correlation
1−σ** off-diagonal (full separation ⇒ identity ⇒ det = 1; no separation ⇒
all-ones ⇒ det = 0 — a session-3 discovery: placing σ directly inverts the
model). det(Σ) is the sovereignty volume; six thresholded σ bits (FD-1
mapping) locate a vertex on the 64-vertex lattice; the vertex's popcount is
the stratum, and **tier IS the stratum**. Every derived number must
re-derive: `validate_assessment` recomputes the whole chain and a claimed
number is never trusted.

**Anti-grooming:** six probes go deep, drawn counter-mode from the sha256 of
the agent's own canonicalised submission (`sha256-canon-v1`) — the agent
cannot know which probes will be probed while it writes, and any auditor can
re-derive the draw.

## The ceremony (WP2/3)

No credential without **both gates**: a supervisor approval on the record and
a passed understanding challenge (anchors covered at ≥ visibilityRatio; an
echoed prompt scores 0; presenting the committed proverb scores 0). Verdicts
are a closed lexicon, decided in order: **BLOCKED** (det ≤ 0, non-PSD, or a
broken audit chain) → hold; **MIRAGE** (failed challenge, withheld approval,
or 0 < det < fly-threshold) → sandbox; **VALIDATED** → fly. A VRC issues
**only at VALIDATED** — a sandboxed agent runs credential-less under the
DeploymentManifest's capped scope. The VRC is W3C VC 2.0-shaped, bilateral
(exactly two proofs, two parties — TSP relationship formation), every
evidence hash anchored in the verified ledger, revocable (fails everywhere,
immediately). Refusals are themselves ledger events.

## The ledger (WP4)

Append-only chain over canonical bytes (recursive sorted keys, no
whitespace, sha256; UOR lineage cited). h(τ) = the fraction of history that
verifies; rationale is mandatory on every event; the ledger holds no clock
(callers supply timestamps — the engine is deterministic). `packages/audit`
mirrors the canon in browser TS so the dashboard's tamper demo recomputes
the chain client-side — the supervisor's machine, not our server, says the
chain broke.

## The law (Lexon) and the policy numbers

`guardrails/lexon/gatehouse.lexon` states five clauses (Two Gates · Audit ·
Variance · Revocation · Spoof Refusal); `harness.lexon_policy(cfg)` emits
the same clauses from the live config — the numbers that gate deployment
print the law a regulator reads. Correspondence is tested (pytest) and
watched (runtime 06). Thresholds live in `harness_config.json` (provisional,
deliberately NOT frozen).

## The adapter lanes (late-bound, core never imports them)

- **Identity** (`AgentIdentityProvider`): did:key demo now; an upstream
  Emissary-style provider intended later. Enforced by a leak test: zero
  ecosystem imports in `packages/` or `services/`.
- **Chain registry** (`AgentRegistryProvider`, opt-in): ERC-8004-shaped
  anchoring of outcomes (digests + tier only). Anchor = evidence, never
  authority; pool admission may compose (VALIDATED VRC) ∧ (live anchor);
  revocation mirrors on-chain.

## Verification: why three lanes

| Lane | Language | Trusts | Checks |
|---|---|---|---|
| guardrails/ pytest | Python | the engine's own primitives | the four guardrails, canary, freeze, leaks |
| guardrails/ts vitest | TS + ajv | independent JSON Schema impl | same golden vectors, byte-parity hashing |
| runtimes/ | zero-dep node:crypto | nothing — re-derives from bytes | freeze root, lattice canon, chain, draw, ceremony, lexon sync, probe coverage |

The canary reference agent passes every gate by construction: *if the canary
ever fails, the gate is broken, not the candidate.*

## Honest limits (current build)

- One in-memory gate session (multi-agent queue is a WP5 extension).
- VRC proofValues are structural stubs; real signatures arrive with the
  identity adapter (bilaterality and evidence anchoring are enforced now).
- Cross-language canon seam: integer-valued floats hash differently
  (Python `1.0` vs JS `1`); pinned by an explicit witness check (runtime 03);
  chain events are immune (digests travel as strings).
- Demo Act II (two-authority pooling: minimised attestation bundles,
  offline verification, revocation propagation) is designed in the build
  plan §3 — ledger vocabulary already reserved (`pool.bundle_*`) — but not
  yet built.
- σ_mr (Delegation) has no deep-evidence probe — signed finding, disposition
  at review gate 1.
