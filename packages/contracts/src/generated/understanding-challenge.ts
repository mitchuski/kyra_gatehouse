/* GENERATED FILE - do not edit. Source: packages/contracts/schema. Regenerate: pnpm codegen */

/**
 * Authentication by comprehension, not possession: the agent must demonstrate understanding of a supervisor-set question. Passing feeds h(tau); failed comprehension blocks issuance. Every attempt is audited (auditEventHash).
 */
export interface UnderstandingChallenge {
  challengeId: string;
  /**
   * Decentralized identifier. did:cid is admitted (content-addressed identity document; resolution is re-derivation).
   */
  agent: string;
  /**
   * Decentralized identifier. did:cid is admitted (content-addressed identity document; resolution is re-derivation).
   */
  supervisor: string;
  prompt: string;
  /**
   * What understanding looks like - concept anchors, not a literal answer (mimicry of a static secret must fail).
   */
  expectedComprehensionSignature: {
    /**
     * @minItems 1
     */
    anchors: [string, ...string[]];
    /**
     * Lowercase hex sha256 over canonical bytes (recursive sorted keys, no whitespace, UTF-8).
     */
    proverbCommitment: string;
    visibilityRatio: number;
  };
  attempts: {
    attemptId: string;
    response: string;
    score: number;
    verdict: "pass" | "fail";
    verifier: string;
    timestamp: string;
    /**
     * Lowercase hex sha256 over canonical bytes (recursive sorted keys, no whitespace, UTF-8).
     */
    auditEventHash: string;
  }[];
  status: "open" | "passed" | "failed" | "expired";
  maxAttempts: number;
}
