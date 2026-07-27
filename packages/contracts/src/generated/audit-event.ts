/* GENERATED FILE - do not edit. Source: packages/contracts/schema. Regenerate: pnpm codegen */

/**
 * Content-addressed, hash-chained audit event. eventId == contentHash == sha256(canonical bytes of the event without contentHash). Chain rule: event[n].priorHash == event[n-1].contentHash; first event uses the genesis hash. Every state transition emits one; rationale is REQUIRED on every decision.
 */
export interface AuditEvent {
  /**
   * Lowercase hex sha256 over canonical bytes (recursive sorted keys, no whitespace, UTF-8).
   */
  contentHash: string;
  /**
   * Decentralized identifier. did:cid is admitted (content-addressed identity document; resolution is re-derivation).
   */
  actor: string;
  /**
   * Namespaced action, e.g. gate.approach, assessment.completed, challenge.attempted, vrc.issued, vrc.revoked. Known actions live in audit-actions.json (data, not frozen) so new transitions never force a schema re-freeze.
   */
  action: string;
  /**
   * Decentralized identifier. did:cid is admitted (content-addressed identity document; resolution is re-derivation).
   */
  subject?: string;
  /**
   * Lowercase hex sha256 over canonical bytes (recursive sorted keys, no whitespace, UTF-8).
   */
  payloadDigest: string;
  priorHash: string | "0000000000000000000000000000000000000000000000000000000000000000";
  timestamp: string;
  /**
   * Why this transition happened. Required on every decision (auditability guardrail).
   */
  rationale: string;
}
