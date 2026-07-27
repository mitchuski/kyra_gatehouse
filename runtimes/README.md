# runtimes/ — lightweight dream-agent reference runtimes

Self-contained, zero-dependency Mage⊥Swordsman folds in the style of
`dtgwg-zkp-tf-mage/runtimes/` (runtime 07 trust-graph-formation is the pattern
parent) and `lexon_pvm/runtimes/` (the auditor-over-frozen-artifacts variant):
`src/<name>.mjs` exports the two seats and a `dreamCycleTurn`, the Swordsman's
last check is always an independent recompute across the Gap, `node test.mjs`
exits nonzero on any FAIL, and every runtime includes at least one adversarial
property.

These are **auditors over the repo's frozen artifacts**, not the live engine —
the live engine is `services/verify/gatehouse_verify/harness.py` plus the two
WP7 guardrail lanes (pytest, vitest). The runtimes are the **third lane**: no
Python, no ajv, no shared code with either — node:crypto and the bytes. They
mint nothing, write nothing, and take no door actions (commits, tags,
re-freezes, and registry amendments are Mitch's acts alone).

**Run all:** `pnpm runtimes` (also the final `pnpm verify` step, so the watch
is automatic). **Run one:** `cd runtimes/01-freeze-watch && node test.mjs`.
**Report:** `node runtimes/<nn>-<name>/src/<name>.mjs`.

Runtime 01 exports the shared canon (`canonicalJson`, `contentHash`,
harness-source parsers); later runtimes take it by one relative import, the
way dtgwg runtime 07 reuses runtime 01's `H`.

| # | Runtime | What it folds | Tests | State |
|---|---|---|---|---|
| 01 | `01-freeze-watch` | CONTRACTS_FROZEN.json against the schema/registry/harness-source bytes: every leaf re-derived, FD-1 read from harness.py itself, merkle root rebuilt — reproduces root `0c5df807…4908eb` | 10/10 | 🟢 standing watch |
| 02 | `02-lattice-canon` | the 64-vertex lattice from first principles (strata by popcount enumeration), FD-1 as a lattice basis, the canary's sovereignty pipeline, cross-checked live against the external `lattice_coherence_audit.py` canon | 16/16 | 🟢 standing watch |
| 03 | `03-canon-chain` | same-bytes-same-hash in a third language: golden chains verified from genesis, tampered twin caught, chain extension only across the Gap; the integer-float canon seam pinned as an explicit witness (G6) | 13/13 | 🟢 standing watch |
| 04 | `04-witness-draw` | `sha256-canon-v1` counter-mode re-derived: the golden draw reproduces byte-for-byte, a groomed (hand-picked) draw is refused, registry and canon bindings hold | 11/11 | 🟢 standing watch |
| 05 | `05-vrc-two-gates` | the bilateral VRC ceremony as a dream cycle (descendant of dtgwg runtime 07): both gates, exactly two proofs from two parties, evidence anchored in a verified ledger, closed verdict lexicon, det(Σ)≤0 ⇒ hold ⇒ no issuance | 14/14 | 🟢 standing watch |
| 06 | `06-lexon-policy-sync` | `gatehouse.lexon` ⇄ `harness.lexon_policy` ⇄ `harness_config.json`: emitted clauses ⊆ term, exact five-clause census, Variance number traced to config, magic numbers refused | 9/9 | 🟢 standing watch |
| 07 | `07-probe-coverage` | the probe registry's semantics: N derived from config, full force/pair coverage, taxonomy consistency, deep-verifiability surface — **1 signed finding: `deep-coverage-gap` on σ_mr** (see NOTES, queued for review gate 1) | 12/12 | 🟢 standing watch + 1 OPEN finding |
| 08 | `08-pooling-census` | Act II's minimisation law from `pooling.py` source: disjoint raw/allowed vocabularies, the transforms (thresholds, cardinalities, one digest), smuggled raw data refused, the R < 1 accounting recomputed — the census's auditor until (and after) its freeze | 13/13 | 🟢 standing watch |
| 09 | `09-site-coherence` | the site's own claims: nav resolves, KYRA GATE lockup everywhere, guide [[links]] land + all pages reachable, evidence sources exist, and the **check-count numbers recompute from the suites themselves** — drift fails verify | 14/14 | 🟢 standing watch |

**112 checks, all green** (plus the e2e ceremony auto-run: `scripts/e2e.mjs`
spawns its own engine and drives both acts over real HTTP, asserting the
dashboard's eleven walkthrough beats — the final `pnpm verify` step). The one open finding (runtime 07) belongs on the
review-gate-1 table: σ_mr (Delegation) has no deep-evidence probe, so the
witness draw can never deep-probe that separation. Amending `evidenceKind` on
one σ_mr probe pre-tag is a one-line edit + re-freeze; accepting the gap is
also a valid disposition. Either is Mitch's call at the gate.
