# Runtime 03 · canon-chain

**Status: 🟢 standing watch (13/13), one DECLARED SEAM pinned.**

Same bytes, same hash, third language: the audit ledger's canon discipline
(recursive sorted keys, no whitespace, UTF-8, sha256; UOR lineage) re-derived
with node:crypto alone — after `canon.py` (lane 1) and the vitest spec
(lane 2). The **Mage** proposes chain extensions (the smallest event,
committed contentHash); the **Swordsman** recomputes hash and lineage across
the Gap before the ledger may advance by exactly one. The golden chains are
the corpus; the tampered twin (re-rolled draw rationale) must always be caught.

Reject reasons: `content-hash-forged`, `lineage-broken`, `rationale-required`
(CLAUDE.md rule 4: no unexplained state transitions).

**The declared seam (G6):** Python canonical bytes render integer-valued
floats as `1.0`; `JSON.parse` collapses them to `1` and JS renders `1`. So the
canary assessment (scores 1.0) hashes DIFFERENTLY across languages, and
`audit-chain-valid.json[2].payloadDigest` (computed by Python over that
assessment) is not recomputable in JS. The chain itself is immune — event
bodies carry digests as opaque strings — and events 0 and 1 (agent identity,
witness draw: float-free payloads) DO re-derive cross-file (G3). G6 pins the
seam as an explicit witness: it asserts the mismatch, so the seam can never
silently widen or silently close. If WP4's ledger ever hashes float-bearing
payloads in both languages, the canon needs a number-normalization rule
(e.g. integer-valued floats forbidden in hashed payloads, or an explicit
decimal encoding) — that is a contracts decision, Mitch's door.

Properties: G1 golden chain verifies from the 64-zero genesis · G2 tampered
twin caught · G3 cross-file payload bindings re-derive (float-free payloads) ·
G4 forged contentHash rejected; bare proposal touches nothing; signed event
advances by one · G5 stale prior rejected; missing rationale refused ·
G6 the seam witness · G7 key-order invariance + single-byte sensitivity.
