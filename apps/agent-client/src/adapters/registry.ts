// The late-bound chain-registry lane (OPT-IN). An agent that wants
// blockchain-registry visibility anchors its Gatehouse outcome into an
// on-chain agent registry — the intended first provider is ERC-8004
// ("Trustless Agents": identity / reputation / validation registries).
//
// Positioning (see docs/pitch-narrative-rwa-gatehouse.md addendum):
//   - The anchor is EVIDENCE, never authority: the gate's verdict comes from
//     the assessment + the two gates; the chain entry only makes the outcome
//     discoverable by relying parties who live on-chain.
//   - The anchor is a PREDICATE CANDIDATE for privacy-pool admission: pool
//     membership MAY require (VALIDATED VRC) ∧ (anchored validation entry).
//     That composition happens pool-side; the core engine never imports this.
//   - Revocation must mirror: a revoked VRC posts a revocation mark to the
//     same registry, so on-chain relying parties converge with off-chain ones.
//
// Like the identity lane: concrete providers implement this in their own
// modules; nothing outside apps/agent-client may depend on a provider, and
// nothing in packages/ or services/ knows chains exist.

export interface RegistryAnchor {
  /** Registry scheme, e.g. "erc8004". */
  scheme: string;
  /** Registry-assigned agent id (stringified — chain ids are not JS-safe ints). */
  agentId: string;
  /** Transaction or record reference for the audit ledger's payload. */
  ref: string;
}

export interface AgentRegistryProvider {
  /** Which registry scheme this provider speaks (e.g. "erc8004"). */
  scheme(): string;

  /** Register the agent (idempotent): returns the existing or new anchor. */
  register(identity: { did: string; agentCardUrl: string }): Promise<RegistryAnchor>;

  /**
   * Post the Gatehouse outcome as a validation entry: the assessment digest,
   * the VRC digest, and the tier. Digests only — no probe content, no scores,
   * no rationale ever leaves the gate (minimised disclosure survives anchoring).
   */
  anchorValidation(anchor: RegistryAnchor, outcome: {
    assessmentDigest: string;
    vrcDigest: string;
    tier: number;
  }): Promise<{ ref: string }>;

  /** Mirror a revocation so on-chain relying parties fail the agent too. */
  mirrorRevocation(anchor: RegistryAnchor, revocationRef: string): Promise<{ ref: string }>;

  /** What a pool or relying party checks: is a live Gatehouse validation anchored? */
  isAnchored(did: string): Promise<RegistryAnchor | null>;
}
