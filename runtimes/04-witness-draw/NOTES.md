# Runtime 04 · witness-draw

**Status: 🟢 standing watch (11/11), golden draw reproduced byte-for-byte.**

The Gap's anti-grooming mechanism (`sha256-canon-v1`, hearthold-lineage defect
D1 remediation) re-derived from its spec: counter-mode
`sha256(canonHashBytes ‖ uint32BE(i)) mod remaining`, sampling without
replacement from the lexicographically sorted probe ids, seeded by the sha256
of the agent's OWN canonicalised submission. The golden draw in
`canary-assessment.json` reproduces exactly in JS: same six probes, same
order, same `canonHash`, same `registryHash` — the auditor's re-derivation
promise made concrete in a second language.

The seats are cast adversarially here: the **Mage** is the would-be GROOMING
agent — `Mage.propose` derives honestly, `Mage.groom` hand-picks the probes
it prepared for (in the tests: the six declared-only probes). The
**Swordsman** is the auditor who re-derives the draw from the persisted
canonHash + the frozen registry and refuses every draw that does not follow
from the bytes.

Reject reasons: `unknown-algorithm`, `canon-hash-mismatch`,
`registry-hash-mismatch`, `draw-not-derivable-groomed`.

Properties: G1 golden draw reproduces (ids + both hashes) · G2 k derives from
config (6 = 0.25 × 24, never chosen) · G3 determinism + reseed on one changed
submission byte · G4 a full draw is a permutation (without replacement) ·
G5 honest signs, groomed refused · G6 a thinned registry cannot pass off as
the frozen pool · G7 a swapped canonHash refused.

Door: `draw_fraction` is provisional config (not frozen); changing it is a
config edit Mitch reviews, and k follows. The registry pool itself is a freeze
leaf — amending it is a re-freeze (runtime 01's door).
