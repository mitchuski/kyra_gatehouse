# Runtime 07 · probe-coverage

**Status: 🟢 standing watch (12/12) + 1 OPEN signed finding for review gate 1.**

The PVM-native probe registry under semantic audit. Runtime 01 watches the
registry's BYTES (freeze leaf); this runtime watches what the bytes MEAN:
N derived from config (24 = 4·probes_per_force + 6·probes_per_pair — never a
fixed number, CLAUDE.md's "NOT a fixed 32"), full coverage of the four forces
and six σ pairs, taxonomy consistency (a separation probe carries exactly its
pair's two forces), id-pattern conformance, and the deep-verifiability surface
the witness draw needs.

Two lanes inside the fold (the lexon_pvm runtime-01 pattern): **structural
rules** reject the registry outright — a broken registry means the gate is
broken, not the candidate — while **findings** are signed observations that
do not break the gate but belong on the review table. The **Swordsman**
re-derives every finding from the registry bytes and refuses forged digests
and hallucinated findings (no invented drift).

## The one OPEN finding — `deep-coverage-gap: sigma.mr`

σ_mr (Delegation: project ⊥ reflect, "clean mandate") has only `declared` +
`witnessed` probes — the ONLY force or pair with no `deep` probe. Consequence:
the Gap witness-draw can never deep-probe the Delegation separation; an agent
that grooms its declared mandate story has no held-out deep check on exactly
the bit FD-1 maps to weight 16. Dispositions, both valid, both Mitch's at
gate 1: (a) flip one σ_mr probe's `evidenceKind` to `deep` pre-tag — a
one-line registry edit + re-freeze (runtime 01 root moves); (b) accept the gap
as designed (mr is argued verifiable from instruments alone) and this finding
stands as documentation. WP1's prompt-refinement pass is the natural moment.

Reject reasons: `violations-not-derivable`, `registry-structurally-broken`,
`evidence-digest-mismatch`, `finding-not-derivable-from-corpus`,
`findings-census-short`.

Properties: G1 zero structural violations, N=24 derived · G2 the fold signs
WITH exactly the σ_mr finding · G3 a dropped probe rejects the registry ·
G4 mislabeled pair forces caught · G5 duplicate id caught · G6 forged digest +
hallucinated finding refused · G7 N follows config (probes_per_force 4 ⇒ the
same registry is too small).
