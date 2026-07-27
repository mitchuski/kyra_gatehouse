# Session 14 · The ToIP lane — trust tasks + credentials into Kyra Gate

**Date:** 2026-07-18 · **Status:** integration map, nothing built yet ·
**Depends on:** sessions 5 (8004 lane pattern), 8 (real ed25519 + did:key),
11 (Kyra Gate), 13 (e2e ceremony auto-run, 195 assertions)

---

## The recognition

Earlier today, in the DTG workbench (`~/dtgwg-trust-tasks-tf-mage`, a clone of
`trustoverip/dtgwg-trust-tasks-tf`), the Kyra Gate ceremony was rewritten as a
**Trust Task family** — six registry-conformant specs under `agent-admission/*`
(apply · respond · approve · issue · revoke · status), validating green in the
ToIP reference registry's own build (176 specs, was 166). Every named rejection
of our ceremony survived as a schema constraint or a namespaced error code:
two-gates-distinct-kinds is `minItems=maxItems=2` on the gates array, the closed
verdict lexicon is a three-value enum, `tierScopeMismatch` and
`supervisorIsAgent` and `blockedNoIssuance` are error codes.

Which means the integration question is **not** "how do we adopt a standard."
The standard-shaped description of our ceremony already exists, derived *from*
this repo's rules (CLAUDE.md rule 5, runtime 05's reject reasons, the 8004
lane's evidence-never-authority). The question is only: **does the running
Gatehouse emit and accept those documents on the wire?** That is a bridge, not
a rebuild.

Two ToIP surfaces are in play:

1. **Trust Tasks** — the envelope discipline (`id / type / payload / issuer /
   recipient / threadId / issuedAt / proof`, request↔response by `threadId`,
   errors always `trust-task-error`, payload schemas closed).
2. **Credentials** — the VRC already expresses as a W3C Verifiable Credential
   (rule 7) between two VIDs in TSP roles (`TSP_ROLE_SUPERVISOR` /
   `TSP_ROLE_AGENT`, session 1). The trust-task `issue` document simply
   *carries* that credential; the agent's counter-signature completes the
   bilateral pair. Nothing about the credential changes.

## Why the bridge is cheap — the correspondences are already exact

| Kyra Gate (built, green) | Trust Task member | Delta to bridge |
|---|---|---|
| Keyhole submission, canonical bytes persisted | `agent-admission/apply` payload (`submissionDigest`, `policyRef`) | envelope wrapper only |
| Gap witness-draw (sha256 of canonicalised submission) | `apply` response `witnessDraw` (`algorithm: sha256-canonical-json`) | field names |
| Understanding challenge, scored vs harness thresholds | `agent-admission/respond` + response `understandingGate` | envelope wrapper |
| Dashboard approve action (human gate) | `agent-admission/approve` (`supervisorIsAgent` refused) | envelope wrapper; supervisor key already real ed25519 |
| VALIDATED-only issuance, bilateral two-signature VRC | `agent-admission/issue` (5 ordered rules; VC in payload; counter-sign in response) | engine already enforces all 5; envelope + counter-sign beat |
| Audit ledger events, same-bytes-same-hash | `GateResult.evidenceDigest` + `ledgerHead` | direct: our event hashes ARE the digests |
| VALIDATED→fly / MIRAGE→sandbox / BLOCKED→hold | `Verdict` enum `validated / failedHeldOut / blocked` | vocabulary map, both closed |
| det(Σ)-derived scope, tier = stratum | `TierGrant` (`tier` int + `scopeFunction` URI) | scopeFunction = a :1337 page rendering `harness.lexon_policy(cfg)` — the same clauses the regulator reads |
| Revoke + 8004 revocation mirror (`registry.revocation_mirrored`) | `agent-admission/revoke` (`mirroredAnchors`, reason never mirrored) | envelope wrapper |
| Pool predicate: (VALIDATED VRC) ∧ (anchored entry), composed pool-side | `agent-admission/status` (authoritative read; anchors mirror it) + `AnchorRef` | new read endpoint, thin |
| Lexon clauses = the law the config prints | `policyRef` target | serve clauses at a stable URI |

Nothing in the left column moves. The bridge is envelopes, one read endpoint,
and one counter-signature beat.

## The integration map — five moves, in order

**TT-1 · Vendor the family as data.** Copy the six `payload.schema.json` files
+ `_shared/0.1/admission.schema.json` from the workbench into
`apps/agent-client/src/adapters/trust-tasks/schemas/` (or a sibling data dir).
They enter like `audit-actions.json` rows: **data, not frozen contracts** —
contracts-v1 stays untouched. Record the source commit + digests in a
`SCHEMAS_PROVENANCE.md` so drift against the workbench is detectable.

**TT-2 · The envelope module + `TrustTaskProvider` adapter.** Beside
`identity.ts` and `registry.ts` in the agent-client adapters lane (session 5's
pattern: late-bound, opt-in, zero imports in `packages/` or `services/`, leak
test extended to cover it). One module that (a) mints envelopes — `id`,
`type` URI, `issuer`/`recipient` from the existing did:key identities,
`threadId` chaining, `issuedAt`, ed25519 proof over JCS bytes (the signing and
canonicalisation discipline both already exist, session 8); (b) validates
inbound documents against the vendored schemas before the app logic sees them.
The supervisor dashboard gets the same module for `approve` and `revoke`
emission — its station rail actions already carry the semantics.

**TT-3 · The gateway beats.** The engine's demo-loop API stays as-is; a thin
translation at the app edge maps each existing beat to its task:
submit→`apply`, challenge-answers→`respond`, approve-click→`approve`,
issuance→`issue` (agent counter-signs in the response — the one genuinely new
beat, and it makes the bilaterality *wire-visible* instead of internal),
revoke→`revoke`. Plus one new read: `status`, served from the ledger, returning
verdict + tier + revoked + anchors — the endpoint the Act-3 pool predicate and
any external relying party actually consumes. Failures map to the family's
error codes inside `trust-task-error` documents; the closed refusal vocabulary
is a demo asset, not plumbing.

**TT-4 · Runtime 10 + e2e beat 12.** A zero-dep auditor in the `runtimes/`
lane, in the house style: given the e2e run's emitted envelope transcript,
prove — every document carries the required members · every response's
`threadId` resolves to its request · exactly two gates, distinct kinds, in the
issue document · every `evidenceDigest` and `ledgerHead` resolves into the
verified ledger · verdict in the closed lexicon · the issue payload's VC
carries two proofs from two distinct parties · a `status` read after revoke
shows `revoked: true`. The e2e ceremony auto-run (session 13, 11 beats) gains
**beat 12: the same ceremony, spoken as trust tasks**, and `pnpm verify` counts
grow accordingly — the site's check-counts recompute from the suites (runtime
09), so the surfacing is automatic and cannot drift.

**TT-5 · Surface it.** Dashboard: a "standards" chip per ceremony step showing
the task type URI it just spoke. Site Evidence table: one new tiered row —
"speaks ToIP Trust Tasks (agent-admission family, 6 types)". Guide tab: one
wiki-small page telling the correspondence. Act-3 pitch gains its sentence: the
gate's admission ceremony is expressed in the ToIP Trust Task envelope
discipline, the credential is a W3C VC between TSP-role VIDs, the chain anchor
is evidence never authority, and the pool predicate consumes the standard
`status` read.

## What this buys at the hackathon

1. **Interop story with receipts.** Not "compatible with standards" but: the
   family validates in the reference registry's build, and the running gate
   emits conformant documents that a zero-dep auditor re-verifies on every
   `pnpm verify`. Demo-able in one command.
2. **The two-implementation seed.** The registry's own promotion bar
   (draft→candidate) is two interoperable implementations. Kyra Gate is
   positioned as implementation #1 of `agent-admission/*` the day the bridge
   lands. That is a standards posture no other hack entry will have.
3. **The relying-party door.** `status` gives judges/partners a concrete
   integration point that isn't our UI: anything that can read a signed JSON
   document can gate on Kyra Gate's verdict — pools in, registries out,
   exactly the Act-3 shape.
4. **Composability forward.** The upstream registry already holds
   `task-consent/*` and `policy/*` (delegated-execution consent) — the natural
   post-hack composition: admission tier as an input to delegation policy.
   Named here so the demo can say "and this is where it goes next" honestly.

## Fences that hold (unchanged by this lane)

- **Contracts-v1 frozen.** No schema in `packages/contracts` moves; vendored
  trust-task schemas are adapter data with provenance.
- **No ecosystem imports in `packages/` or `services/`.** The bridge lives in
  the apps/adapters lane; the leak test grows a trust-tasks clause.
- **Git ruling.** No history until hack acceptance; this lane is files only.
- **Evidence, never authority.** The 8004 anchor rule extends verbatim to the
  new surface: `status` is the authority, anchors and envelopes carry digests
  and tier, no probe content leaves the gate.
- **Expressions registry.** If ToIP/trusttasks becomes a named submission
  target, it enters through `render/expressions.yaml` like every other
  ecosystem — never hardcoded in engine or apps.

## Decisions needed (Mitch)

| # | Decision | Default if unruled |
|---|---|---|
| D14-1 | Bridge home: agent-client adapters lane (mirror of 8004) vs a separate `apps/tt-bridge` | adapters lane — smallest new surface |
| D14-2 | Does beat 12 + runtime 10 land **before** the hack video, growing 195 → ~215 assertions? | yes — it is the interop receipt |
| D14-3 | Counter-signature beat: real second signature by the autonomous agent (AURORA has keys) vs recorded acceptance | real — bilaterality on the wire is the differentiator |
| D14-4 | `scopeFunction` URI target: :1337 Lexon clauses page vs a JSON rendering of harness config | Lexon page — the law a regulator reads IS the function's rendering |
| D14-5 | Name the lane in the expressions registry now (ToIP ecosystem entry) or after acceptance | after — registry discipline says submissions are named only when real |

## Addendum — decisions D14-1…D14-5 accepted at defaults (provisional)

**2026-07-18, First Person ruling: "accept defaults for now."** Recorded as a
provisional decision of record — any of the five may be re-ruled before hack
acceptance, and the build must keep each one cheap to reverse:

- **D14-1 = adapters lane.** The bridge lives beside `identity.ts` /
  `registry.ts` in `apps/agent-client/src/adapters/trust-tasks/`; no new app.
- **D14-2 = yes, before the video.** Runtime 10 + e2e beat 12 land in
  `pnpm verify`; the assertion count grows and the site recomputes it.
- **D14-3 = real counter-signature.** The autonomous agent signs the issuance
  acceptance with its own ed25519 key; bilaterality is wire-visible.
- **D14-4 = Lexon page.** `scopeFunction` resolves to the :1337 clauses page —
  the law a regulator reads is the function's rendering.
- **D14-5 = defer.** No expressions-registry entry until the submission is
  real; nothing ToIP-named enters engine or apps config.

## Pickup state

- Workbench specs: `~/dtgwg-trust-tasks-tf-mage/specs/agent-admission/` (6 + shared),
  validate green, uncommitted. Vendoring source for TT-1.
- Companion research: `~/dtgwg-cred-spec-main_mage/TRUST-TASKS-FIT-MAP-2026-07-18.md`,
  `agentprivacy-docs/papers/trust-tasks/RESEARCH_NOTE_trust-tasks-convergence_2026-07-18.md`,
  blog `trust-tasks-at-the-gate.md`.
- Nothing in this repo touched yet; TT-1 is the first move and is one copy +
  one provenance file.
- The `understanding/*` family (LAN ceremony) is deliberately **out of scope**
  for the hack lane — peer posture, different story; noted so nobody grafts it
  on under time pressure.

---

## Addendum — the gatehouse session's reflection (same day)

Read against the running engine, the map holds: every correspondence row is
exact (the reject reasons ARE runtime 05's, the digests ARE the ledger's,
the counter-sign beat is mechanically ready because AURORA's keys are real).
Three additions from this side before the lane runs:

**W-1 · The float seam reaches envelopes.** "ed25519 proof over JCS bytes"
inherits the cross-language canon seam runtime 03 pins: Python renders
integer-valued floats `1.0`, JS renders `1`. The clean guard is a RULE, not
a fix: **envelope payloads carry digests, strings, integers, and booleans —
never bare floats** (tier is an int; det travels as a digest'd assessment,
not a number). The vendored payload schemas appear to satisfy this already;
runtime 10 should assert it so it cannot regress.

**W-2 · Runtime 10's corpus must be deterministic.** The runtimes lane is
offline; "audit the e2e run's transcript" would make runtime 10 depend on
e2e ordering inside verify. Resolution in the house style: the bridge module
ships a deterministic fixture generator (envelopes minted from the golden
vectors, fixed timestamps), runtime 10 audits THOSE bytes; e2e beat 12
asserts the live gate emits conformantly. Same split as canon: golden
vectors for the auditor, live flow for the ceremony.

**R-1 · Two lanes for conformance, as always.** App-side validation should
stay structural + signature-verify (no ajv in the browser bundle); FULL
schema conformance of emitted documents belongs in the vitest lane, which
already owns ajv — vendored schemas join `guardrails/ts` the way the frozen
schemas did. Runtime 10 then re-derives zero-dep. Three independent lanes on
the new surface, matching the rest of the house.

**On the decisions:** this side concurs with every default — D14-1 adapters
lane (the 8004 pattern is proven), D14-2 yes before the video (the interop
receipt IS the demo line), D14-3 real counter-signature (with the session-8
custody caveat carried honestly: real signature, demo custody), D14-4 the
Lexon page (note `/policy` already serves the clauses on the hosted origin —
the scopeFunction URI can be that route, which becomes the real URL at
deploy), D14-5 after acceptance. One sequencing note: TT-1 is data-only and
safe under the D14-1 default; TT-2→TT-5 in one session once the decisions
are blessed. Estimated cost: one build session for the bridge + beat 12 +
runtime 10, growing verify from 195 to roughly 215 assertions — with
runtime 09's count-watch forcing the site numbers to follow automatically.

---

## Addendum — the lane BUILT (same day, defaults ruling executed)

TT-1…TT-5 landed; `pnpm verify` is **all green: 200 checks** (64 pytest ·
8 vitest · 128 zero-dep) **+ 14 e2e beats**. What exists now:

- **TT-1** — 8 schemas vendored byte-identical at
  `apps/agent-client/src/adapters/trust-tasks/schemas/` with
  `SCHEMAS_PROVENANCE.md` (upstream base `894fcc6…`, per-file sha256, drift
  rule stated in the file).
- **TT-2** — `envelope.mjs`: zero-dep envelope mint/verify (node:crypto
  ed25519, canon-parity canonicalJson, base58, did:key) + a structural
  validator resolving the flattened refs via REF_MAP. **Key parity proven**:
  Node derives the identical did:key the engine's Python derives from the same
  demo seeds. Honest custody note carried from keys.py.
- **TT-3** — `bridge.mjs`: one full Act-I ceremony driven over the live HTTP
  surface, spoken as six envelope pairs; evidence digests are REAL ledger
  contentHashes; `canonParity` recomputes every ledger event's hash byte-exact
  in JS; the agent counter-signs issuance with its own key (D14-3); a signed
  relying-party `status` read closes the loop. Engine untouched.
- **TT-4** — runtime 10 `trust-task-canon` (16 checks: byte-honesty vs
  provenance, refs, closure, verdict/two-gates/anchors/$ids, **W-1 float-seam
  quarantine**) + e2e beats 12–14. W-2 satisfied by construction (the fold
  audits frozen bytes, the wire lives in e2e). R-1 (ajv lane) stays at the
  door.
- **TT-5** — dashboard VRC card carries the second-tongue line; Evidence page
  gains the DERIVED row (4 sources, all resolving); Guide gains
  `speaks-trust-tasks` (linked from The Evidence); all counts recomputed and
  runtime 09 signs.
- **Fence hardened** — `test_no_ecosystem_leaks.py` FORBIDDEN now includes
  `trusttasks` / `trust-task`: the envelope vocabulary cannot enter
  `packages/` or `services/`.

Reversal notes (the ruling was "for now"): the lane is one directory + one
runtime + three e2e beats + four small surface edits; deleting
`adapters/trust-tasks/`, `runtimes/10-*`, the beats block, and the four edits
restores session 13's tree exactly.
