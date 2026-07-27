/* GENERATED FILE - do not edit. Source: packages/contracts/schema. Regenerate: pnpm codegen */

/**
 * W3C VC 2.0-shaped bilateral credential: unforgeable alone, two proofs (issuer + subject). A VRC is only well-formed if evidence carries BOTH gates: a supervisor approval and a passed understanding challenge (enforced in code + WP7).
 */
export interface VerifiableRelationshipCredential {
  /**
   * Must begin with https://www.w3.org/ns/credentials/v2
   *
   * @minItems 1
   */
  "@context": [string, ...string[]];
  type: {
    [k: string]: unknown;
  } & string[];
  /**
   * Decentralized identifier. did:cid is admitted (content-addressed identity document; resolution is re-derivation).
   */
  issuer: string;
  validFrom: string;
  validUntil?: string;
  credentialSubject: {
    /**
     * Decentralized identifier. did:cid is admitted (content-addressed identity document; resolution is re-derivation).
     */
    id: string;
    /**
     * Popcount of the 6 sovereignty bits. Strata sizes 1,6,15,20,15,6,1.
     */
    tier: number;
    /**
     * Popcount of the 6 sovereignty bits. Strata sizes 1,6,15,20,15,6,1.
     */
    stratum: number;
    /**
     * Lowercase hex sha256 over canonical bytes (recursive sorted keys, no whitespace, UTF-8).
     */
    assessmentDigest: string;
    /**
     * The A(tau) record: A(tau) = alpha * ln(1+|tau|) * h(tau).
     */
    relationship: {
      tauCount: number;
      hTau: number;
      aTau: number;
      /**
       * Lowercase hex sha256 over canonical bytes (recursive sorted keys, no whitespace, UTF-8).
       */
      proverbCommitment: string;
      visibilityRatio: number;
    };
  };
  /**
   * @minItems 2
   */
  evidence: {
    [k: string]: unknown;
  } & [
    {
      type: "UnderstandingChallengeAttempt" | "SupervisorApproval";
      /**
       * Lowercase hex sha256 over canonical bytes (recursive sorted keys, no whitespace, UTF-8).
       */
      auditEventHash: string;
    },
    {
      type: "UnderstandingChallengeAttempt" | "SupervisorApproval";
      /**
       * Lowercase hex sha256 over canonical bytes (recursive sorted keys, no whitespace, UTF-8).
       */
      auditEventHash: string;
    },
    ...{
      type: "UnderstandingChallengeAttempt" | "SupervisorApproval";
      /**
       * Lowercase hex sha256 over canonical bytes (recursive sorted keys, no whitespace, UTF-8).
       */
      auditEventHash: string;
    }[]
  ];
  credentialStatus: {
    type: "RevocationList2026";
    statusListRef: string;
    statusListIndex: number;
  };
  /**
   * BILATERAL: exactly two proofs - issuer (supervisor authority) and subject (agent). Unforgeable alone.
   *
   * @minItems 2
   * @maxItems 2
   */
  proof: [
    {
      type: string;
      verificationMethod: string;
      created: string;
      proofPurpose: string;
      proofValue: string;
    },
    {
      type: string;
      verificationMethod: string;
      created: string;
      proofPurpose: string;
      proofValue: string;
    }
  ];
}
