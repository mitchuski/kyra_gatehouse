# Chronicle — Session 3: the engine (WP1–4) and the app-flow blueprint

**Date:** 2026-07-17 · **Scope:** WP1 verification engine + WP2 issuance/
revocation + WP3 understanding-as-key + WP4 live ledger, the demo-loop API,
and the visualisation blueprint · **Outcome:** `pnpm verify` ALL GREEN with
**zero xfails** — all eight contracts-v1 obligations flipped to hard
assertions (55 pytest + 8 vitest + 85 runtime checks); freeze intact at root
`0c5df807…4908eb` · **State:** NOTHING committed; gate 1 items unchanged
(FD-1 confirm, σ_mr disposition) plus one new decision of record to ratify.

## The headline discovery — the Σ inversion

Filling `det_sigma` for the canary xfail exposed that `sigma_matrix` (a
session-1 "trivial body") placed the pairwise SEPARATIONS directly as
off-diagonal entries. That reads σ as correlation: the canary's perfect
separations (all σ = 1) produced the all-ones matrix — det 0, canary BLOCKED,
gate broken. The model's intent (and make_testdata's own comment, "all sigma
= 1 → Sigma = I → det = 1") is that the matrix entry is the **residual
correlation 1 − σ**: full separation ⇒ identity ⇒ det 1, the full
tetrahedron; no separation ⇒ all-ones ⇒ det 0, total collapse. One-line
body fix, freeze untouched, and the strict xfail did exactly the job it was
pinned for. Spot values now: uniform σ 0.5 ⇒ det 0.3125 (flies); uniform
σ 0.3 ⇒ det ≈ 0.057 (the MIRAGE band); σ 0 ⇒ det 0 (held).

## Decisions of record (session 3)

1. **A VRC issues ONLY at verdict VALIDATED.** A MIRAGE agent (sub-threshold
   volume, or an unpassed gate) runs sandboxed WITHOUT a credential —
   sandbox scope comes from the DeploymentManifest, not from a weaker
   credential. One credential class, no asterisks. (Resolves the ambiguity in
   "below-threshold agent cannot be issued".)
2. **Verdict order** (closed lexicon, decided top-down): BLOCKED = collapsed
   or non-PSD Σ, or a broken audit chain (the Audit clause voids deployment);
   MIRAGE = failed understanding, withheld approval, or 0 < det < fly
   threshold (sandboxed by variance); VALIDATED otherwise.
3. **Force aggregation uses ALL tagged probes:** separation probes carry the
   two forces they hold apart, so their evidence feeds both force means (9
   contributions per force at the 3/2 config), not just the 3 force probes.
4. **Sandbox ceiling = rung 2:** below the fly threshold, scope is capped at
   `min(stratum, 2)` — the highest all-`sandbox.*` rung of the ladder.
5. **Manifest hTau wrapper:** frozen `derive_manifest(assessment, vrc_digest,
   cfg)` cannot see the ledger, so the harness records the ceremony's proven
   floor (`cfg.h_tau_gate`) and `issuance.deployment_manifest` overwrites
   `predicate.hTau` with the LIVE ledger reading before persisting. The
   harness states the law; the service supplies the reading.
6. **Understanding mimicry rules:** an echoed prompt scores 0 (a parrot holds
   the question, not the understanding); presenting the proverb commitment
   scores 0 (the static secret is possession). Score = anchor coverage; pass
   at `score ≥ visibilityRatio`. Every attempt is ledgered BEFORE judgment.
7. **Refusals are ledger events:** `vrc.refused` and `gate.identity_refused`
   (two new rows in audit-actions.json — data, not frozen). The gate says no
   on the record.
8. **The ledger holds no clock:** timestamps are caller-supplied; the service
   layer stamps live time, the engine stays deterministic.

## What now exists

- **`harness.py` bodies complete** (signatures untouched — freeze verified):
  `force_scores`, `sigma_from_probes`, corrected `sigma_matrix`, pure-python
  `det_sigma` (cofactor) and `is_psd` (ALL principal minors — Sylvester alone
  only certifies PD), full `verdict`, `deployment_scope`, `derive_manifest`
  (content-addressed manifestId), and `validate_assessment` grown to the FULL
  recompute set: every derived number in an assessment must re-derive.
- **`ledger.py` (WP4):** append-only chain over the tested canon primitives;
  h(τ) = the fraction of history that verifies; `trail()` full-trail
  reconstruction; rationale refused-empty.
- **`understanding.py` (WP3):** challenge lifecycle (open→passed/failed),
  proverb committed never stored, anchor-coverage scoring, ledgered attempts.
- **`issuance.py` (WP2):** `verify_identity` (Spoof Refusal: did:key must
  bind its own multibase), `RevocationRegistry` (revocation = ledger event,
  always), `issue_vrc` (the two-gates ceremony; refusals audited; VRC is
  schema-valid W3C VC 2.0, bilateral, TSP-role proofs), `verify_vrc` (a
  relying party's checks: revoked / gates / anchoring / bilaterality / chain),
  `deployment_manifest`.
- **`assessment.py` (WP1 service face):** raw probe scores → complete
  AssessmentResult; everything else derives; self-validates by construction.
- **`app.py` — the demo-loop API:** route order IS the ceremony:
  `/gate/approach → /gate/assess → /gate/challenge(+/attempt) → /gate/approve
  → /gate/issue → /gate/revoke`, plus `/gate/state` (the render model),
  `/gate/verify` (the relying-party view), `/policy` (the Lexon law from live
  config), `/probes`, `/gate/reset`. Exercised end-to-end in-process: spoof
  403 → … → issue (tier 6, fly) → revoke → fails everywhere; 11 chained
  events, h(τ) = 1.0.
- **Guardrails all live:** the four-guardrail table now maps to passing
  tests, including `test_issued_artifacts_validate_against_frozen_schemas`
  (the live ceremony's VRC, manifest, challenge, and every ledger event
  validate against contracts-v1). New `uniform_assessment` + `ceremony`
  fixtures generate fully-consistent assessments at any score level.

## The visualisation blueprint — `docs/app-flow.md`

The WP5/6 build spec, one panel per engine artifact: the seven-station
ceremony rail (hydrated from `/gate/state`, no client state machine); the
verdict colour language (green fly / amber sandbox / red hold — never a third
vocabulary, refusals rendered as first-class outcomes); the witness-draw
"dice moment"; the 24-probe board; the three-instrument sovereignty
centrepiece (Σ heatmap on 1−σ, det volume gauge with the config thresholds
drawn on the bar, the 64-vertex lattice as 7 strata with FD-1 labelled bits);
the two-gates issuance card with two signatures; the always-on audit rail
with the client-side tamper demo; Act 2 revocation flipping a relying-party
strip to ✗✗✗; and the agent client as the keyhole view (what the SUBJECT can
see — the demo's quiet privacy argument). Every screenshot doubles as a WP8
render asset.

## For the gate-1 table (running list)

1. FD-1 σ→bit confirmation (session 1).
2. σ_mr deep-coverage-gap disposition (session 2, runtime 07).
3. **NEW: ratify the Σ = 1−σ correction and the VALIDATED-only issuance
   policy** (this session, decisions 1–2 above).

## Next

WP5 supervisor dashboard + WP6 agent client, built scene-by-scene against
`docs/app-flow.md` over the live API (`uvicorn gatehouse_verify.app:app`),
including the `packages/audit` TS canon mirror for the tamper demo → the
two-act video → WP8/9 renders and the gatehouse.agentprivacy.ai skeleton
before the 31 July concept-note gate. Commits, tags, and every submission
remain Mitchell's acts alone.
