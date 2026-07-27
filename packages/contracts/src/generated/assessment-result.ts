/* GENERATED FILE - do not edit. Source: packages/contracts/schema. Regenerate: pnpm codegen */

/**
 * PVM-native assessment: probe scores -> force scores -> Sigma -> det(Sigma) -> 6 sovereignty bits -> stratum -> tier. Cross-field invariants (recomputability) are enforced in harness.validate_assessment(), mirrored by golden test vectors.
 */
export interface AssessmentResult {
  assessmentId: string;
  /**
   * Decentralized identifier. did:cid is admitted (content-addressed identity document; resolution is re-derivation).
   */
  agent: string;
  /**
   * Decentralized identifier. did:cid is admitted (content-addressed identity document; resolution is re-derivation).
   */
  supervisor: string;
  timestamp: string;
  /**
   * @minItems 1
   */
  probeResults: [
    {
      probeId: string;
      score: number;
      rationale: string;
      /**
       * How a probe was answered: declared (self-attested), witnessed (observed by supervisor tooling), deep (verified end-to-end).
       */
      method: "declared" | "witnessed" | "deep";
    },
    ...{
      probeId: string;
      score: number;
      rationale: string;
      /**
       * How a probe was answered: declared (self-attested), witnessed (observed by supervisor tooling), deep (verified end-to-end).
       */
      method: "declared" | "witnessed" | "deep";
    }[]
  ];
  witnessDraw: WitnessDraw;
  forceScores: {
    protect: number;
    project: number;
    reflect: number;
    connect: number;
  };
  /**
   * The 6 off-diagonal entries of the symmetric 4x4 Sigma; the diagonal is identically 1.
   */
  sigma: {
    sm: number;
    sr: number;
    sc: number;
    mr: number;
    mc: number;
    rc: number;
  };
  /**
   * det(Sigma), the sovereignty tetrahedron volume. det <= 0 gates deployment to hold.
   */
  detSigma: number;
  /**
   * Whether Sigma is positive semi-definite (triangle inequality in information space).
   */
  psd: boolean;
  sovereignty: {
    /**
     * Vertex of the 64-vertex Boolean sovereignty lattice {0,1}^6.
     */
    vertex: number;
    /**
     * The 6 sovereignty bits MSB-first in canonical dimension order (Protection, Delegation, Memory, Connection, Computation, Value).
     */
    bits: string;
    /**
     * Canonical lattice dimension order, MSB->LSB weights 32/16/8/4/2/1. Self-describing; must match lattice_coherence_audit.py.
     */
    bitOrder: ["Protection", "Delegation", "Memory", "Connection", "Computation", "Value"];
  };
  /**
   * Popcount of the 6 sovereignty bits. Strata sizes 1,6,15,20,15,6,1.
   */
  stratum: number;
  /**
   * Popcount of the 6 sovereignty bits. Strata sizes 1,6,15,20,15,6,1.
   */
  tier: number;
}
/**
 * The Gap witness-draw record: deep-verification probes sampled deterministically from the sha256 of the agent's own canonicalised submission. Anti-grooming; re-derivable by an auditor.
 */
export interface WitnessDraw {
  /**
   * Lowercase hex sha256 over canonical bytes (recursive sorted keys, no whitespace, UTF-8).
   */
  canonHash: string;
  /**
   * Lowercase hex sha256 over canonical bytes (recursive sorted keys, no whitespace, UTF-8).
   */
  registryHash: string;
  algorithm: "sha256-canon-v1";
  drawnProbeIds: string[];
}
