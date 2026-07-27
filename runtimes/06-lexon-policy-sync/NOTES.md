# Runtime 06 · lexon-policy-sync

**Status: 🟢 standing watch (9/9).**

The law and the code held to one voice. Three corpora:
`guardrails/lexon/gatehouse.lexon` (the term a regulator reads), the
`lexon_policy` emitter inside `harness.py` (parsed from SOURCE — the same
numbers that gate deployment print the law), and `harness_config.json` (the
live numbers, provisional, explicitly not frozen).

The fold proves the CORRESPONDENCE, not the prose: the **Mage** derives a
claim (term clause census, emitter clause census, whether the Variance number
traces to `cfg.det_fly_threshold`); the **Swordsman** re-derives all three
views from the bytes and refuses drift in either direction — an emitted clause
missing from the term, a term that quietly widened beyond the emitter + the
schema-level Spoof Refusal gate, or a threshold that stopped tracing to config
(CLAUDE.md rule 6: no magic numbers). The exact five-clause census is pinned:
Two Gates · Audit · Variance · Revocation · Spoof Refusal.

Reject reasons: `emitter-unparseable-from-source`, `evidence-digest-mismatch`,
`clause-missing-from-term`, `term-clause-census-drift`,
`threshold-not-config-derived`, `magic-number-in-emitter`,
`threshold-absent-from-config`.

Properties: G1 the live correspondence signs (four emitted guardrails, Spoof
Refusal added by the term, threshold = 0.15 from config) · G2 a dropped
Revocation clause caught · G3 a quietly widened term caught (a "Grace Period"
clause nobody's harness prints) · G4 a forged claim refused across the Gap ·
G5 a hardcoded 0.15 in the emitter refused · G6 the clause parser is
register-neutral.

Door: prose changes to either the term or the emitter are Mitch-reviewed;
this runtime intentionally does not diff prose, only clause sets and the
config trace, so wording can breathe without breaking the watch. Byte-level
freeze of the emitter is runtime 01's interface hash.
