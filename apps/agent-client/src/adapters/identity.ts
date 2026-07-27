// The late-bound identity lane. Concrete providers (did:key demo signer,
// or an upstream Emissary-style provider) implement this interface in their
// own modules; nothing outside apps/agent-client may depend on a provider.
// Contract shape: packages/contracts/schema/agent-identity.schema.json.

export interface AgentIdentityProvider {
  /** The DID this provider controls (did:key | did:web | did:cid). */
  did(): Promise<string>;

  /** Public key in multibase form, as carried in AgentIdentity. */
  publicKeyMultibase(): Promise<string>;

  /** Sign canonical bytes; returns a multibase signature. */
  sign(canonicalBytes: Uint8Array): Promise<string>;

  /**
   * Present evidence for a capability claim without exposing underlying
   * data. Providers that cannot prove (demo did:key) may return declared
   * evidence only; the assessment records the method accordingly.
   */
  presentEvidence(request: {
    probeId: string;
    prompt: string;
  }): Promise<{ kind: "declared" | "witnessed" | "deep"; body: unknown }>;
}
