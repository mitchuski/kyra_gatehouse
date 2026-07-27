# CLAUDE.md — Gatehouse KY-A

Every agent session reads this before touching code. It is the shared contract.

## What we are building

A regulator-facing Know Your Agent (KY-A) verification system. One core, three renders: the app, plus generators that emit the GDC 2026 session material and the Block 15 IKP case study from the same data model.

North-star demo (the only thing the video must show): an agent approaches the gate, the supervisor challenges it, it proves understanding rather than possession, a Verifiable Relationship Credential issues, a tamper-evident audit trail renders, the supervisor can revoke.

## Non-negotiable rules

1. **The user is a supervisor, never an agent-owner.** Every surface assumes a regulator operates it.
2. **The user is a supervisor, never an agent-owner.** Stated twice on purpose. It is the most common way the concept loses points.
3. **Contracts before code.** WP0 schemas in `packages/contracts` land first and freeze. Nothing else starts until they merge.
4. **Every state transition emits a content-addressed audit event.** Same bytes, same hash, chained to the prior event. Audit verification is the integrity fraction h(τ).
5. **No credential issues without both gates:** a supervisor approval action (human-in-the-loop) and a passed understanding challenge (h(τ) → 1).
6. **Config is derived, not hardcoded.** Thresholds, tiers, and deploy scope come from the harness (see below). Do not invent magic numbers in feature code.
7. **Standards vocabulary.** VRCs express as W3C Verifiable Credentials, DIDs as `did:key` or `did:web`.

## The harness binding

This app is a rendering of the 0xagentprivacy Privacy Value Model. Do not re-invent the sovereignty logic. It lives in `services/verify/gatehouse_verify/harness.py` and is the single source of config truth. The relevant skills are `agentprivacy-dragon` (root equation), `agentprivacy-tetrahedral-sovereignty` (the 4×4 Σ and four forces), `agentprivacy-vrc-identity` (the credential layer), and `agentprivacy-dragon-flight` (the deploy predicate).

### The mapping (this is load-bearing)

| KY-A concept | Harness term | Skill |
|---|---|---|
| Assessment axes | Four forces: Protect, Project, Reflect, Connect | tetrahedral-sovereignty |
| N derived probes (N = 4·probes_per_force + 6·probes_per_pair, from harness config; NOT a fixed 32) | Evidence feeding the four force scores and the six σ_ij | tetrahedral-sovereignty |
| 6 sovereignty checks | The 6 pairwise separations σ_ij | dragon (lattice) |
| Agent tier | Stratum (popcount of the 6 separation bits, 0..6) | dragon (7 strata: 1,6,15,20,15,6,1) |
| "Variance" that drives deploy | det(Σ), the sovereignty tetrahedron volume | tetrahedral-sovereignty |
| VRC issuance | A(τ) bilateral credential, two signatures | vrc-identity |
| Understanding-as-Key | The RPP bilateral proverb, h(τ) gate | vrc-identity |
| Audit ledger verifies | h(τ) integrity fraction → 1 | dragon |
| Self-deployment | Dragon Flight: Φ>0 across axes ∧ h(τ)→1 ∧ V>threshold | dragon-flight |

### The five anatomy components map to the five subsystems

| Anatomy (dragon-flight) | Subsystem | Work package |
|---|---|---|
| Boundary (∂M) | Guardrail policy layer | WP7 |
| Hide (mesh) | Content-addressed audit ledger | WP4 |
| Brain (L⊥R) | Verification / assessment engine | WP1 |
| Forge (blade) | VRC issuance | WP2 |
| Ceremony | Understanding-as-Key + Gatehouse | WP3, WP5 |

### TSP and Lexon bindings (via the harness)

Two standards seams enter through the harness, never through the frozen schemas:

- **Trust Spanning Protocol (ToIP TSP).** The VRC ceremony IS a TSP relationship formation between two VIDs: the supervisor authority and the agent. `AgentIdentity` DIDs serve as VIDs (did:web/did:key/did:cid are VID-compatible), and the bilateral two-signature proof is the spanning relationship made concrete. TSP transport adapters live beside the identity adapters in `apps/agent-client`; the harness names the two roles (`TSP_ROLE_SUPERVISOR`, `TSP_ROLE_AGENT`). Cite the ToIP lineage in standards-register renders.
- **Lexon.** The policy layer speaks Lexon: the four guardrails and the deploy predicate exist as controlled-natural-language clauses in `guardrails/lexon/gatehouse.lexon`, and `harness.lexon_policy(cfg)` emits the same clauses from live config — the same numbers that gate deployment print the law a regulator reads. WP7 tests the correspondence; renders may quote the clauses verbatim in any register.

The dragon flies (the deployment self-activates) only when all five are complete, det(Σ) > 0, and the audit chain verifies. This is why "self-deployable by its variance" is exact: `harness.py` reads the assessment, computes det(Σ), locates the stratum, and emits a `DeploymentManifest` whose granted scope is a function of the variance. High det(Σ) grants broad scope, low grants a sandbox, a collapsed pair (det ≤ 0) holds deployment entirely because multiplicative gating takes total value to zero.

## Repo layout

```
gatehouse/
  packages/contracts/   # WP0: schema.json (source), models.py, types.ts
  packages/audit/       # WP4: content-addressed ledger
  services/verify/      # WP1,2,3 + harness.py (the binding)
  apps/supervisor/      # WP5: React regulator dashboard
  apps/agent-client/    # WP6: the agent that approaches the gate
  guardrails/           # WP7: the four-guardrail test harness
  runtimes/             # dream-agent reference runtimes: zero-dep auditors over the frozen artifacts (third lane, runs in pnpm verify)
  render/               # WP8: GDC + Block 15 generators
  site/                 # WP9: static site, LOCAL at :1337 (pnpm site) until acceptance; deploy is Mitchell's act
```

## Sibling instances (context, not scope)

Distinguish two hearthold things. The upstream MIT repo `Flaxscrip/hearthold` (Warden/Emissary/Sovereign identities on Archon did:cid + DIDComm v2) is MERGEABLE, late-bound: a substantial merge is intended (Emissary as the agent at the gate, possible identity-core reuse) but style and core submission are undecided, so it enters only through the `AgentIdentityProvider` adapter in `apps/agent-client` and the expression registry — zero hearthold imports in `packages/` or `services/` (enforced by a WP7 leak test). The SEAT below stays fenced.

Gatehouse is one instance of the agentprivacy-harness pattern. A live sibling is `mitchuski/hearthold_mage`: a harness seat on the shipped Hearthold stack (Flaxscrip/hearthold v0.11.0), objective disclosure-debt, frozen census of 23 requirements, measured baseline 2049 canonical bytes, canary 23/23, 14 negative fixtures refused. It belongs to a separate acceptance between First Persons; do not build against it or reference it in code. But three of its mechanisms are adopted here:

1. **The canary (WP7, mandatory).** The guardrail harness MUST include a reference agent that passes every gate by construction. If the canary ever fails, the gate is broken, not the candidate. Without a canary you cannot distinguish a bad agent from an impossible gate.
2. **The Gap witness-draw (WP1/WP7).** Deep-verification criteria are sampled deterministically from the sha256 of the agent's own canonicalised submission (recursive sorted keys, no whitespace; persist the canon file so an auditor can re-derive the draw). The agent cannot know which criteria will be probed while it writes. This is the anti-grooming mechanism (defect D1 remediation) and it is itself an auditable artifact.
3. **Verdict lexicon alignment.** Harness verdicts map to deploy decisions: VALIDATED → fly, MIRAGE (failed held-out gate) → sandbox, BLOCKED (violated hard constraint) → hold. Use both vocabularies consistently; never invent a third.

Note also: `did:cid` is now an accepted DID method in `AgentIdentity`. A content-addressed identity document is a holon; resolving it is re-derivation; it binds natively to the audit ledger's same-bytes-same-hash discipline.

## Session discipline

One session per work package. WP0 alone first. WP1-4 parallel once contracts freeze. WP5-6 next. WP7 runs continuously and gates every merge. Review at three points: contracts frozen, demo loop green, guardrails passing.

## Expressions stay open

This engine will be expressed into an unknown number of submissions across four ecosystems (CDIR, BGIN, hearthold/Archon, hitchhikers). The registry at `render/expressions.yaml` is the only place submissions, deadlines, and ecosystems are named. If a task seems to require hardcoding any of those into `packages/` or `services/`, stop and route it through the registry. Register discipline (standards vs mythopoetic-edges) is enforced at render time by check scripts, never assumed in the engine. No session sends, submits, or publishes anything; renderers write drafts to `render/<id>/out/` and the final act is Mitchell's alone.
