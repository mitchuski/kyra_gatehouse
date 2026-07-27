# Runtime 01 · freeze-watch

**Status: 🟢 standing watch (10/10).** Re-run after ANY re-freeze; the signed
root must always equal the manifest's, and the chronicled contracts-v1 root
`0c5df807…4908eb` is pinned in G1c — a versioned re-freeze intentionally breaks
G1c and the pin is updated as part of that re-freeze's review.

The fold: the **Mage** proposes the freeze manifest's claims (per-leaf
canonical hashes, FD-1 table, interface hash, merkle root); the **Swordsman**
re-derives every claim from the repo bytes — 8 schemas, the probe registry,
and `harness.py` SOURCE TEXT (FD-1 authority is the code Mitch reviews, never
the manifest under audit) — and rebuilds the root from the leaves. Third lane:
no Python (`canon.py`), no ajv (vitest); node:crypto only.

Reject reasons: `schema-census-drift`, `schema-hash-drift`,
`registry-hash-drift`, `interface-hash-forged`, `fd1-drift-from-harness-source`,
`fd1-weights-not-a-lattice-basis`, `stratum-sizes-drift-from-source`,
`root-forged`.

Properties: G1 the real manifest signs whole (10 leaves, chronicled root) ·
G2/G3 one mutated byte in a schema or registry is caught · G4 forged root
rejected across the Gap · G5 FD-1 drift from source rejected (the one decision
Mitch confirms at gate 1) · G6 forged interface hash rejected · G7 canonical
bytes are key-order-invariant · G8 read-only (byte-hash before/after).

Shared exports for the lane: `canonicalJson`, `contentHash`, `sha256Hex`,
`readJson`, `readText`, `fileByteHash`, `parseSigmaBitOrder`,
`parseStratumSizes`, `rootFromLeaves`, `repoRoot`, `HARNESS_PY`.

Door: re-freeze (a new versioned CONTRACTS_FROZEN entry), the local commit and
the `contracts-v1` tag are Mitch's acts. This runtime signs; it never touches
`packages/` or `services/`.
