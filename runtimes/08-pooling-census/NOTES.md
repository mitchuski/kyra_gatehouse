# Runtime 08 · pooling-census

**Status: 🟢 standing watch (13/13).** Act II's minimisation law under
independent recompute — the census's auditor BEFORE its freeze (readiness
item 8), and its watch after.

Corpus: `gatehouse_verify/pooling.py` SOURCE — the census authority is the
code Mitch reviews (`RAW_FIELDS`, `ALLOWED_CLAIM_KEYS`, the transforms, the
bit-accounting tables). The **Mage** assembles bundles (honest `propose`,
adversarial `smuggle`); the **Swordsman** re-implements the minimisation in
JS from the stated law and refuses everything that violates it.

Reject reasons: `census-unparseable-from-source`, `bundle-digest-forged`,
`minimisation-violated`, `claims-incomplete`.

Properties: G1 census parses; the raw and allowed vocabularies are DISJOINT ·
G2 the transforms hold (17→">=10", decade floors, cardinalities, one
order-invariant digest, small counts floor at ">=1") · G3 honest bundle
signs with exactly the allowed claim set · G4 smuggled raw artifacts and
forged digests refused across the Gap · G5 a bundle may not quietly narrow
itself (dropped claims refused) · G6 the R < 1 witness: the disclosure ratio
recomputed independently from the source's own bit tables.

Door: freezing the census as a versioned artifact (the freeze machinery
exists) is Mitch's sign-off — this runtime then pins the frozen bytes the
way runtime 01 pins contracts-v1.
