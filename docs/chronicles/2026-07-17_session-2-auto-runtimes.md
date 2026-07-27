# Chronicle — Session 2: the auto runtimes

**Date:** 2026-07-17 · **Scope:** the full dream-agent runtime lane ("all the
auto runtimes for this work") · **Outcome:** `runtimes/` LIVE — 7 runtimes,
85 checks, all green; wired into `pnpm verify` as the final step; full verify
green end-to-end (46 pytest + 8 xfails, 8 vitest, freeze ok, runtimes 7/7) ·
**State:** still NOTHING committed — the tree awaits Mitchell's gate-1 review,
now with one signed finding added to the gate-1 table.

## What was built

The runtime pattern was taken from its two parents — `dtgwg-zkp-tf-mage/
runtimes/07-trust-graph-formation` (the Mage⊥Swordsman dream-cycle shape) and
`lexon_pvm/runtimes/01-v6-soil-sync` (the auditor-over-frozen-artifacts
variant) — and seated in-repo as the THIRD verification lane: zero-dependency
node:crypto `.mjs`, no Python, no ajv, no shared code with either guardrail
lane. Each runtime: `src/<name>.mjs` exports the two seats + `dreamCycleTurn`,
the Swordsman's last check is an independent recompute across the Gap,
`node test.mjs` exits nonzero on FAIL, at least one adversarial property.
Runtime 01 exports the shared canon; the rest take it by one relative import.

| # | runtime | checks | headline |
|---|---|---|---|
| 01 | freeze-watch | 10 | JS recompute reproduces the contracts-v1 root `0c5df807…4908eb` from bytes; FD-1 authority = harness.py SOURCE, never the manifest |
| 02 | lattice-canon | 16 | strata (1,6,15,20,15,6,1) from first-principles enumeration; external `lattice_coherence_audit.py` cross-check LIVE and agreeing |
| 03 | canon-chain | 13 | third-language same-bytes-same-hash; tampered twin caught; **integer-float canon seam pinned as an explicit witness** (Python `1.0` ≠ JS `1`) |
| 04 | witness-draw | 11 | `sha256-canon-v1` golden draw reproduces byte-for-byte in JS; a groomed hand-picked draw is refused |
| 05 | vrc-two-gates | 14 | the bilateral ceremony proven: both gates, two distinct parties, ledger-anchored evidence, closed verdict lexicon, det≤0 ⇒ no issuance |
| 06 | lexon-policy-sync | 9 | term ⇄ emitter ⇄ config correspondence; five-clause census pinned; magic numbers refused |
| 07 | probe-coverage | 12 | registry semantics: N derived, coverage full, taxonomy consistent — **+1 signed finding** |

Wiring: `pnpm runtimes` (root script) and a final `"runtimes (dream folds)"`
step in `scripts/verify.mjs` (post-freeze-check, so the lane only arms once a
freeze manifest exists). CLAUDE.md repo layout gained the one-line entry.

## For the gate-1 table (new since session 1)

1. **`deep-coverage-gap: sigma.mr`** (runtime 07, OPEN). σ_mr — Delegation,
   the weight-16 bit — is the only force or pair with no `deep` probe, so the
   witness draw can never deep-probe the clean-mandate separation.
   Dispositions: flip one σ_mr probe's `evidenceKind` to `deep` pre-tag
   (one-line registry edit + re-freeze) or accept the gap as designed. Either
   is Mitchell's call; WP1's prompt-refinement pass is the natural moment.
2. **The float seam** (runtime 03, DECLARED). Integer-valued floats hash
   differently across Python and JS canonical bytes. The chain is immune
   (digests travel as strings) and the seam is pinned by a witness check;
   if WP4 ever hashes float-bearing payloads in both languages, the canon
   needs a number-normalization rule — a contracts decision.

## Unchanged

Everything from session 1: contracts-v1 frozen at the same root (the runtimes
touched nothing in `packages/` or `services/` — runtime 01's G8 proves the
watch is read-only), FD-1 still awaiting confirmation, no commits, no pushes,
no submissions. Per standing rule the tag, the registry amendment if any, and
every commit are Mitchell's acts alone.
