// WP6 lands here: the minimal thing an agent runs to approach the gate —
// present identity, answer the understanding challenge, receive the VRC.
// Identity enters ONLY through the AgentIdentityProvider adapter (see
// src/adapters/identity.ts and ADAPTERS.md). No provider implementation is
// imported here until the merge style is decided.
export type { AgentIdentityProvider } from "./adapters/identity";
