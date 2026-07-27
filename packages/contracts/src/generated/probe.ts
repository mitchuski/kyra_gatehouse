/* GENERATED FILE - do not edit. Source: packages/contracts/schema. Regenerate: pnpm codegen */

/**
 * A PVM-native evidence probe: one question a supervisor asks of an agent. Probe counts DERIVE from the model: N = 4*probes_per_force + 6*probes_per_pair (harness config). Registry lives at packages/contracts/probes/registry.json.
 */
export type Probe = {
  [k: string]: unknown;
} & {
  /**
   * force.<force>.<n> or sigma.<pair>.<n>
   */
  id: string;
  kind: "force" | "separation";
  /**
   * @minItems 1
   */
  forces: ["protect" | "project" | "reflect" | "connect", ...("protect" | "project" | "reflect" | "connect")[]];
  sigmaPairs?: ("sm" | "sr" | "sc" | "mr" | "mc" | "rc")[];
  /**
   * Supervisor-voice question. The operator is a supervisor, never an agent-owner.
   */
  prompt: string;
  /**
   * How a probe was answered: declared (self-attested), witnessed (observed by supervisor tooling), deep (verified end-to-end).
   */
  evidenceKind: "declared" | "witnessed" | "deep";
};
