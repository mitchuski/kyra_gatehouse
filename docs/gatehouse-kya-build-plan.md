# Gatehouse KY-A: Agent Coding Plan

**One core, three renders.** You are building a single application, a regulator-facing Know Your Agent (KY-A) verification system. The same data model then renders into your GDC 2026 session material and your Block 15 IKP case study. Every hour on the core pays into all three.

The north-star demo, and the only thing the 5-minute video needs to show:

> An agent approaches the gate. The supervisor challenges it. It proves understanding, not just possession of a key. A Verifiable Relationship Credential issues. A tamper-evident audit trail renders. The regulator can revoke.

Everything below serves that loop.

---

## 0. Ground rules for the agents

These are non-negotiable acceptance gates. Any work package that breaks one is not done.

- **The user is a supervisor, never an agent-owner.** The UI, the API, the language all assume a regulator is operating the system. This is the single most common way the concept loses points, so it is enforced in code review.
- **The four guardrails are architected in, not bolted on.** Each maps to a concrete mechanism (Section 4). No credential issues without them.
- **Contracts before code.** Shared schemas land first (WP0) so parallel agent sessions never collide on data shape.
- **Every state transition emits a content-addressed audit event.** Same bytes, same hash. This is your UOR content-addressing work doing real supervisory duty, and it is the auditability guardrail for free.
- **Standards-aligned vocabulary.** VRCs express as W3C Verifiable Credentials, DIDs as `did:key` or `did:web`. This is what lets you cite your BGIN and ISO/IEEE lineage in the note without hand-waving.

### Stack

| Layer | Choice | Why |
|---|---|---|
| Monorepo | pnpm workspaces + one Python service | Matches your React and Python history |
| Web (supervisor) | React + Vite + TypeScript | Lift from the Sovereign Agent Assessment Platform |
| Verify service | FastAPI (Python) | Assessment logic, issuance, ledger |
| Contracts | JSON Schema, mirrored to TS types and Pydantic | Single source of truth for both sides |
| Credentials | W3C VC data model, `did:key` for demo | Standards credibility |
| Audit ledger | Content-addressed append-only store | Tamper-evidence, UOR reuse |
| Auth | Understanding-as-Key challenge module | Your differentiator, and the human-in-the-loop hook |

### Repo layout

```
gatehouse/
  packages/
    contracts/        # WP0: schemas, shared types (TS + Pydantic)
    audit/            # WP4: content-addressed ledger
  services/
    verify/           # WP1,2,3: FastAPI - assessment, issuance, understanding-as-key
  apps/
    supervisor/       # WP5: React regulator dashboard
    agent-client/     # WP6: the thing an agent runs to approach the gate
  guardrails/         # WP7: the test harness that enforces the four gates
  render/             # WP8: GDC + Block 15 artifact generators
  CLAUDE.md           # context every agent session reads first
```

---

## 1. What you already have, and what is new

Roughly 60 percent is a reframe of existing assets, not greenfield.

- **Sovereign Agent Assessment Platform** (React, 32 criteria across 8 domains, 7-tier progression). This *is* the verification engine. The build is repointing it from agent self-assessment to supervisor-run attestation, and wiring its output into credential issuance.
- **VRC / bilateral trust A(τ) / Relationship Proverb Protocol.** The credential layer. VRC issuance and revocation is the audit story.
- **Understanding as Key.** The comprehension challenge. This is both the auth mechanism and the human-in-the-loop guardrail, which is a rare two-for-one you should lean on hard in the note.
- **UOR content-addressing.** The audit ledger.
- **Gatehouse ceremony at guide.agentprivacy.ai/gates.** The demo cold open and the onboarding entry point.

New work is mostly glue: the supervisor dashboard reframe, the issuance path, the audit ledger wiring, and the guardrail harness.

---

## 2. Work packages

Each package is written so one Claude Code session can own it end to end. Run WP0 first and alone. WP1 through WP4 parallelise once contracts land. WP5 and WP6 follow. WP7 runs continuously. WP8 is post-build, for the renders.

### WP0 — Contracts and scaffold `[blocking, do first]`
Define every schema before any logic exists.
- `AgentIdentity` (DID, public key, declared capabilities, provenance)
- `AssessmentResult` (32 criteria, 8 domains, scores, tier)
- `VRC` (W3C VC shape: issuer = supervisor authority, subject = agent, claims = tier + assessment digest)
- `AuditEvent` (actor, action, prior-hash, content-hash, timestamp, rationale)
- `UnderstandingChallenge` (prompt, expected comprehension signature, attempt record)

**Acceptance:** schemas validate, TS types and Pydantic models generate from the same source, repo builds empty.

### WP1 — Verification engine `[parallel]`
Port the 32-criteria assessment into `services/verify`. Reframe every criterion prompt to read as a supervisor evaluating an agent. Output an `AssessmentResult` and a tier.
**Acceptance:** given a synthetic agent profile, returns a deterministic scored result with per-criterion rationale.

### WP2 — Credential issuance `[parallel]`
Issue a VRC from an `AssessmentResult` once, and only once, human-in-the-loop and understanding challenge have both passed. Include a revocation endpoint. **Spike `issuance.vouch.finance` here**: if it accepts VC issuance, route through it to stack the $25k prize. Keep it behind an adapter so a failed spike does not block.
**Acceptance:** issuance blocked without the two gates; issued VRC verifies; revocation flips status and emits an audit event.

### WP3 — Understanding-as-Key `[parallel]`
The comprehension challenge. The agent must demonstrate understanding of a supervisor-set question, not present a static secret. Failed comprehension blocks issuance.
**Acceptance:** correct comprehension passes, mimicry fails, every attempt is audited.

### WP4 — Audit ledger `[parallel]`
Content-addressed, append-only. Each event carries the prior event's hash (a chain). Any tamper breaks verification.
**Acceptance:** full trail reconstructs and verifies; a mutated event is detected.

### WP5 — Supervisor dashboard `[after WP1-4 contracts]`
React app. Queue of agents at the gate, run assessment, issue the challenge, approve or deny (this click is the human-in-the-loop), view and export the audit trail, revoke. Open with the Gatehouse ceremony visual.
**Acceptance:** the full north-star loop is clickable start to finish.

### WP6 — Agent client `[after WP0]`
The minimal thing an agent runs to approach the gate: presents identity, answers the challenge, receives the VRC.
**Acceptance:** a scripted synthetic agent completes onboarding against the live service.

### WP7 — Guardrail harness `[continuous]`
Tests that *are* the guardrails (Section 4). CI fails if any gate is bypassable. This file is also your evidence exhibit for the judges.

### WP8 — Render pipelines `[post-build]`
From the same data model, generate the GDC session deck (pptx) and the Block 15 case study (docx), plus the timeline milestone entry. The audit trail from a real demo run becomes the case-study evidence.

---

## 3. The demo loop as the integration test

The anchor question (from the CDIR problem spaces): *how can authorities enable secure, dynamic data-sharing frameworks to rapidly pool intelligence on AI threats without violating privacy laws?* The demo answers it in two acts. Act I is single-authority KY-A; Act II is the pooling scenario that makes the answer visible. Together they double as the 5-minute video script.

**Act I — the gate (WP1-6):**
1. Agent client approaches (Gatehouse ceremony cold open).
2. Supervisor sees it in the queue, runs the 32-criterion assessment.
3. Supervisor sets an understanding challenge; agent answers; comprehension verified.
4. Supervisor approves (human-in-the-loop click).
5. VRC issues, optionally via Vouch.finance.
6. Audit trail renders and verifies live on screen.
7. Supervisor revokes to show the kill path.

**Act II — the pool (two authorities, same build):**
1. Authority A and Authority B each run a Gatehouse; each has a verified agent with a live DeploymentManifest (only KY-A-verified agents may carry intelligence into the pool).
2. Authority A's agent assembles a threat-intelligence attestation bundle, minimised against the frozen pooling census: predicate-coarsened (counts become thresholds, timestamps become windows, enumerations become cardinalities), no raw incident data, no customer data.
3. Every bundle carries the three parameters on its face: against whom it protects, for how long, alongside what it may lawfully be combined.
4. Authority B verifies the bundle offline, exactly as a relying party would: signature, window coverage, revocation checkable, issuer passes the trust registry, nothing disclosed outside scope.
5. The reconstruction-ceiling claim renders: no coalition of pooled bundles reconstructs any single institution's underlying data (R < 1).
6. Revocation propagates: Authority A revokes its agent, and Authority B's next verification refuses the stale bundle.

If both acts run green, you have a submittable prototype, and the pooling act is the differentiator: minimised, offline-verifiable, lawful-by-construction intelligence sharing between verified agents.

---

## 4. Guardrails as code

| Guardrail | Mechanism | Test in WP7 |
|---|---|---|
| Human-in-the-loop | Issuance requires an explicit supervisor approval action plus a passed understanding challenge | Issuance attempted without approval must fail |
| Auditability and traceability | Content-addressed append-only ledger, hash-chained, rationale on every decision | Full trail reconstructs; tamper detected |
| Safety and governance controls | Tier gates and criterion thresholds in a policy layer; revocation path | Below-threshold agent cannot be issued; revoke works |
| Cyber risk | Input validation, rate limiting, no secrets in repo, agent-spoofing tests | Spoofed identity rejected; secrets scan clean |

---

## 5. Running it with coding agents

**Write `CLAUDE.md` first.** Put Sections 0, the stack table, and the repo layout in it. Every session reads it before touching code. This is what keeps parallel agents coherent.

**One session per work package.** Give each session its WP spec, its acceptance criteria, and a standing instruction: emit an audit event on every state transition, never let issuance bypass the two gates.

**Sequence:**
1. Session A: WP0 alone. Merge before anything else starts.
2. Sessions B, C, D, E: WP1, WP2, WP3, WP4 in parallel against the frozen contracts.
3. Session F: WP5, then WP6.
4. WP7 runs from the start and gates every merge.
5. WP8 after the demo loop is green.

**Review gates.** You are the human-in-the-loop for the build too. Review at three points: contracts frozen, demo loop green, guardrail harness passing. Do not skip the middle one.

---

## 6. Timeline against the real dates

- **Now to 31 July.** Concept note plus schematic. You do not need the app built to submit, but building WP0 through WP3 now makes the schematic real and the note far stronger. Same fortnight, harvest overlapping sections into your GDC notes so the two deadlines feed each other rather than compete.
- **August, if shortlisted (about 30 teams).** NayaOne onboarding, team confirmation, repoint WP1 assessment inputs to the provided synthetic datasets.
- **1 to 8 September.** The build week. Run the agent sessions on the schedule above with the £300 compute. End on a green demo loop and the video.
- **15 to 18 September.** Demo, live regulator voting, judging, Summit.
- **October, Block 15.** Arrive with a regulator-tested prototype and voting feedback. WP8 turns it into the IKP case study.

---

## 6a. WP9 — the website `[one session, skeleton before 31 July]`

One property, three jobs: the public face the concept note links to, the shell the live demo embeds into, and the standards-register explainer that survives into GDC and Block 15.

- **Domain:** `gatehouse.agentprivacy.ai` (follows the `guide.` / `42.` subdomain pattern; standards artifact, so it lives on the formal property).
- **Register:** strict standards vocabulary. No City terms, no seal, confidence tiers on every conjectural claim, every number a citation of a frontier-style source file.
- **Pages (5):**
  1. **Home** — the CDIR pooling question verbatim, the one-line answer (verified agents carrying minimised, offline-verifiable attestations, with a proven ceiling on what pooling can reconstruct), the two-act loop in one diagram.
  2. **How it works** — approach, assess, challenge, issue, deploy, revoke, mapped to the four guardrails.
  3. **The mathematics** — R < 1, det(Σ), disclosure-debt, at companion-guide depth, linking out to the formal spec.
  4. **Live demo** — embeds the WP5 supervisor dashboard once built; scripted two-authority pooling run.
  5. **Evidence** — tiered claims table (PROVEN / DERIVED / OPEN, claims_register format) and a downloadable one-pager via the WeasyPrint pipeline.
- **Build:** static site (plain HTML or Astro) wrapping the React demo; style through the frontend-design skill, not default templates.
- **Sequence:** skeleton + Home + How-it-works live before 31 July so the concept note cites a real URL; demo embed during the September build week; Evidence populated the moment the first baseline run lands.
- **Acceptance:** deployed at the subdomain, all five routes render, no register violations, claims table resolves every number to a source file.

## 6b. Open expression — this plan MUST stay adaptive `[standing instruction, read by every session]`

This plan is deliberately not finalised against a single submission. The core (WP0-WP4: contracts, verification, issuance, understanding, audit) is ONE engine that will be expressed into an unknown number of submissions across four ecosystems. Which expressions actually ship, and how many, is Mitchell's decision, made over time, and this repo must never foreclose it.

**The rule: core is frozen, expressions are late-bound.** Nothing ecosystem-specific may leak into `packages/` or `services/`. All ecosystem-facing material lives in `render/` and `apps/`, behind an expression registry.

**The four ecosystems and their current (provisional) expressions:**

| Ecosystem | Provisional expression | Register | Status |
|---|---|---|---|
| **CDIR / regulators** | Track 4 concept note + pooling demo + gatehouse website | standards, sober | active, 31 July gate |
| **BGIN** | Block 15 IKP case study; GDC wallet-assurance and vulnerability-handling material | standards, co-chair voice | active, harvest continuously |
| **hearthold / Archon** | sibling-instance adoption (canary, Gap-draw, verdict lexicon); possible future joint round on the identity gaps (did:cid, sword⊥mage) | technical, plurality-over-precedence | out of scope until the First Persons agree; adopt mechanisms, never build against the seat |
| **hitchhikers / Game of 42** | Gatehouse ceremony as demo cold open; timeline milestone; framing and video edges only | mythopoetic, edges only | active, never in engine or standards prose |

**Mechanics that keep it open:**

1. **Expression registry.** `render/expressions.yaml` lists every planned or shipped expression with fields: `id`, `ecosystem`, `artifact` (note / deck / case-study / site / video / letter), `register` (standards / technical / mythopoetic-edges), `deadline`, `status` (idea / drafting / submitted / shipped / withdrawn). Adding, forking, or withdrawing an expression is a one-line edit; it never touches core.
2. **One renderer per expression.** Each entry gets a generator under `render/<id>/` that consumes ONLY the shared data model and the audit trail of real runs. New submission = new renderer, zero core changes.
3. **Register enforcement at render time.** The two-register discipline is a render/ check, not an engine concern: a check script fails any standards-register output containing City vocabulary, and strips the seal from anything not tagged public-essay. The engine itself is register-neutral.
4. **Deadlines are data, not structure.** The 31 July / September / October dates live in expressions.yaml, not in code paths. If Mitchell adds a submission (a ToIP contribution, a PoPETs artifact, a second CDIR track) or drops one, the plan absorbs it as a registry edit.
5. **Claims flow one way.** Expressions cite the frontier/claims register; they never introduce numbers. Any claim needed by a new expression that doesn't yet exist in the register is a build task, not a prose task.
6. **Nothing here commits externally.** Per T6/G4: every expression's final send, submit, or publish is Mitchell's act alone. Renderers produce drafts to `render/<id>/out/`; no session pushes, posts, or submits.

**For agent sessions:** if a task seems to require hardcoding an ecosystem, a deadline, or a submission count into core, stop and route it through the expression registry instead. When in doubt, the core stays smaller and the registry grows.

## 7. BGIN and Hitchhiker seams

Kept at the edges, sober in the engine.

- **BGIN.** KY-A is IKP made concrete: identity, key management, privacy for agents. Cite the co-chair role and the standards lineage in the note as the credibility anchor no RegTech vendor has. WP8 emits the Block 15 session directly from the demo run.
- **Hitchhiker.** "Know Your Agent" is already the beat: the agent must know itself and prove it, and the proof only unlocks if it understands the question, which is Understanding-as-Key. The Gatehouse ceremony is the video's cold open, the threshold the agent crosses to be known. On the timeline, agent verification becomes the next milestone node beside Privacy Pools, MyTerms, and the Trust Graph.
