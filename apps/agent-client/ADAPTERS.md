# agent-client adapters — the late-bound lane

The agent that approaches the gate gets its identity and evidence-presentation
machinery through `AgentIdentityProvider` (`src/adapters/identity.ts`). Two
providers are anticipated:

1. **`did:key` demo provider** — self-contained keypair, no external deps.
   This is what the scripted synthetic agent (WP6 acceptance) uses.
2. **Emissary provider (intended, not yet built)** — the upstream
   [`Flaxscrip/hearthold`](https://github.com/Flaxscrip/hearthold) (MIT) stack
   separates Warden (vault custodian) / Emissary (world-facing agent) /
   Sovereign (principal authorizer) on Archon `did:cid` + DIDComm v2. The
   Emissary is architecturally the agent-at-the-gate. A substantial merge is
   intended, but its style and the core submission are undecided — so hearthold
   enters ONLY as an adapter here, never as an import in `packages/` or
   `services/` (enforced by `guardrails/test_no_ecosystem_leaks.py`).

Note the CLAUDE.md fence: the sibling harness seat `mitchuski/hearthold_mage`
belongs to a separate acceptance and is never built against. The fence covers
the seat, not the upstream MIT repo.

## The chain-registry lane (opt-in) — `AgentRegistryProvider`

`src/adapters/registry.ts`. An agent that WANTS blockchain-registry
visibility anchors its Gatehouse outcome on-chain; the intended first
provider is **ERC-8004** ("Trustless Agents" — identity / reputation /
validation registries). Three rules keep the flow clean:

1. **Evidence, never authority.** The verdict comes from the assessment and
   the two gates; the chain entry only makes the outcome discoverable.
   Digests + tier only — no probe content leaves the gate.
2. **Predicate candidate for privacy pools.** Pool admission MAY compose
   (VALIDATED VRC) ∧ (anchored validation entry). The composition lives
   pool-side, behind this adapter — the core engine never imports a chain.
3. **Revocation mirrors.** A revoked VRC posts a revocation mark to the same
   registry (`registry.revocation_mirrored` on the ledger), so on-chain and
   off-chain relying parties converge.

Ledger vocabulary: `registry.anchored`, `registry.revocation_mirrored`
(rows in `packages/contracts/audit-actions.json` — data, not frozen).
