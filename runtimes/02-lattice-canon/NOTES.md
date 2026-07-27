# Runtime 02 · lattice-canon

**Status: 🟢 standing watch (16/16), external canon cross-check LIVE.**

The fold re-derives the 64-vertex sovereignty lattice from first principles —
enumerating {0,1}^6 yields the seven strata (1,6,15,20,15,6,1) — and folds the
canary assessment's sovereignty section against it. The **Mage** proposes the
assessment's claims (vertex, bits, stratum, tier, bitOrder) committed to an
evidence digest; the **Swordsman** re-derives each from the assessment's own
σ values, the live `sigma_threshold`, and FD-1 parsed from `harness.py` source.
Claimed numbers are never trusted: a flattering tier, a stratum that is not
the popcount, or a vertex the σ values cannot produce is a mirage and is
rejected by name.

Reject reasons: `evidence-digest-mismatch`, `vertex-not-derivable-from-sigma`,
`bits-vertex-mismatch`, `stratum-not-popcount`, `tier-not-stratum`,
`bit-order-drift`, `fd1-unparseable-from-source`.

Cross-corpus: when
`agentprivacy-lattice-coherence/scripts/lattice_coherence_audit.py` is present
on this machine, its `CANON_DIMENSIONS` block is parsed and must agree with
the canon byte-for-byte (32/16/8/4/2/1 = Protection/Delegation/Memory/
Connection/Computation/Value) — the same skipif discipline as
`guardrails/test_lattice_coherence.py`, G8 skip-passes when absent.

Properties: G1 strata from enumeration = harness constants · G2 FD-1 is a
six-pair permutation of the lattice basis, σ_sm anchors Protection · G3 the
canary signs (63/111111/6/6) · G4 sub-threshold pairs clear their bits
(spot vertex 53) · G5 three mirage rejections · G6 post-commitment mutation
caught · G7 shuffled dimension order rejected · G8 external canon agrees.

Door: FD-1 confirmation is review gate 1 (Mitch). If FD-1 changes pre-tag,
`SIGMA_BIT_ORDER` in harness.py moves, runtime 01 re-freezes, and this
runtime's derivations follow automatically — nothing here hardcodes the table.
