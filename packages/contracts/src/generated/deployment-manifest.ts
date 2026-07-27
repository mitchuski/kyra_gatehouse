/* GENERATED FILE - do not edit. Source: packages/contracts/schema. Regenerate: pnpm codegen */

/**
 * The dragon-flight record: deployment self-activates only when the predicate holds. Scope is a FUNCTION of variance: high det(Sigma) grants broad scope, low grants sandbox, det <= 0 holds entirely (multiplicative gating). decision == VERDICT_TO_DECISION[verdict] (VALIDATED->fly, MIRAGE->sandbox, BLOCKED->hold) - enforced in code + WP7.
 */
export interface DeploymentManifest {
  manifestId: string;
  /**
   * Decentralized identifier. did:cid is admitted (content-addressed identity document; resolution is re-derivation).
   */
  agent: string;
  /**
   * Lowercase hex sha256 over canonical bytes (recursive sorted keys, no whitespace, UTF-8).
   */
  assessmentDigest: string;
  /**
   * Lowercase hex sha256 over canonical bytes (recursive sorted keys, no whitespace, UTF-8).
   */
  vrcDigest: string;
  detSigma: number;
  /**
   * Popcount of the 6 sovereignty bits. Strata sizes 1,6,15,20,15,6,1.
   */
  stratum: number;
  /**
   * The flight predicate record: Phi > 0 across axes AND h(tau) -> 1 AND V > threshold, plus the two issuance gates.
   */
  predicate: {
    detSigmaPositive: boolean;
    hTau: number;
    challengePassed: boolean;
    supervisorApproved: boolean;
  };
  /**
   * Harness verdict lexicon. Never a third vocabulary.
   */
  verdict: "VALIDATED" | "MIRAGE" | "BLOCKED";
  /**
   * Deploy decision: VALIDATED→fly, MIRAGE→sandbox, BLOCKED→hold.
   */
  decision: "fly" | "sandbox" | "hold";
  scope: {
    capabilities: string[];
    /**
     * Free-form constraint map (rate limits, data classes, jurisdictions).
     */
    constraints: {};
    ttlSeconds: number;
  };
  issuedAt: string;
  revocationRef?: string;
}
