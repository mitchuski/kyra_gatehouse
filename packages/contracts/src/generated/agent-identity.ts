/* GENERATED FILE - do not edit. Source: packages/contracts/schema. Regenerate: pnpm codegen */

/**
 * The identity an agent presents at the gate. did:cid is admitted at the contract level; resolution integrity is a later, adapter-side concern.
 */
export interface AgentIdentity {
  /**
   * Decentralized identifier. did:cid is admitted (content-addressed identity document; resolution is re-derivation).
   */
  id: string;
  publicKeyMultibase: string;
  /**
   * @minItems 1
   */
  declaredCapabilities: [string, ...string[]];
  provenance: {
    /**
     * The operating authority or person behind the agent (DID or display string).
     */
    operator: string;
    /**
     * Where the agent comes from (stack, vendor, repo).
     */
    origin?: string;
    /**
     * Content hashes of prior attestation documents, if any.
     */
    attestations?: string[];
  };
  createdAt: string;
}
