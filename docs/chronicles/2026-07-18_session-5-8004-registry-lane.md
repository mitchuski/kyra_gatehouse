# Chronicle — Session 5: the ERC-8004 registry lane (seated, not built)

**Date:** 2026-07-18 · **Trigger:** Mitch: *"we can also just give these
agents an 8004 if they want blockchain registry enabled right? that also is
a predicate for the privacypools i may add to this later if it works in a
flow nicely."* · **Answer:** yes — and it is seated so it can flow later,
without one line of chain code today.

## The ruling shape

ERC-8004 ("Trustless Agents": on-chain identity / reputation / validation
registries) gets the exact hearthold treatment: an **opt-in, late-bound
adapter lane**, never a core dependency. Three rules were written into the
lane so the future flow stays clean:

1. **Evidence, never authority.** The chain entry makes the gate's outcome
   discoverable; it never makes the decision. Anchored content is digests +
   tier only — no probe content, scores, or rationales leave the gate, so
   minimised disclosure survives anchoring.
2. **Pool predicate by composition.** Privacy-pool admission MAY require
   (VALIDATED VRC) ∧ (live anchored validation entry). The ∧ lives
   pool-side behind the adapter; `packages/` and `services/` never learn
   chains exist.
3. **Revocation mirrors.** A revoked VRC posts a revocation mark to the same
   registry — on-chain and off-chain relying parties fail the agent
   together, which is the whole point of "fails verification everywhere."

## What was placed

- `apps/agent-client/src/adapters/registry.ts` — `AgentRegistryProvider`
  interface (scheme / register / anchorValidation / mirrorRevocation /
  isAnchored) + `RegistryAnchor`; types only, provider-less, exactly like
  the identity lane.
- `ADAPTERS.md` — the chain-registry lane section with the three rules.
- `audit-actions.json` — `registry.anchored`, `registry.revocation_mirrored`
  (data rows, not frozen; the freeze root is untouched).
- `docs/pitch-narrative-rwa-gatehouse.md` — Act-3 addendum: the trust-graph
  registry on the outside now has a concrete standard name, and the pool
  predicate composition is stated in the pitch's one-sentence close.

## Flow position (when it is built)

Post-issuance, pre-pool: … → ISSUE → **anchor (opt-in)** → pool admission
checks the predicate → Act 2 REVOKE → **mirror**. In the dashboard this is
one chip on the credential card ("⛓ anchored · erc8004 #id") and one extra
block on the audit rail; in the agent client, one line under "what I hold."

## State

Nothing committed; freeze intact; `pnpm verify` unaffected (types-only lane).
Building a real provider (testnet or mock chain) is a later session, gated on
Mitch's "if it works in a flow nicely."
