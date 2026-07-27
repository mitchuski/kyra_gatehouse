// The dashboard's only data source: the verify service (v3 — authorities,
// queues, pooling). The UI renders what the engine derived; it computes
// nothing except the client-side chain recompute in the tamper inspector.
import type {
  AgentIdentity,
  AssessmentResult,
  AuditEvent,
  DeploymentManifest,
  Probe,
  UnderstandingChallenge,
  VerifiableRelationshipCredential,
} from "@gatehouse/contracts";

export interface LedgerView {
  events: AuditEvent[];
  hTau: number;
  violations: string[];
}

export interface CeremonyView {
  identity: AgentIdentity;
  assessment: AssessmentResult | null;
  challenge: UnderstandingChallenge | null;
  approvalEventHash: string | null;
  vrc: VerifiableRelationshipCredential | null;
  manifest: DeploymentManifest | null;
  revoked: boolean;
}

export interface Bundle {
  bundleDigest: string;
  issuerAuthority: string;
  agent: string;
  claims: Record<string, string | number>;
  face: { protectsAgainst: string; windowDays: number; lawfulCombination: string };
  disclosureRatio: number;
  credentialStatus: { statusListIndex: number };
}

export interface InboxRecord {
  bundle: Bundle;
  from: string;
  accepted: boolean;
  violations: string[];
  verifiedAt: string;
}

export interface AuthorityView {
  id: string;
  name: string;
  supervisor: string;
  queue: CeremonyView[];
  outbox: Bundle[];
  inbox: InboxRecord[];
  ledger: LedgerView;
}

export interface DemoAgent extends AgentIdentity {
  displayName: string;
  profile: "sovereign" | "mirage";
}

export interface PolicyView {
  lexon: string;
  config: { det_fly_threshold: number; sigma_threshold: number; h_tau_gate: number };
}

async function req<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new ApiRefusal(res.status, data?.detail ?? data);
  return data as T;
}

export class ApiRefusal extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown) {
    super(typeof detail === "string" ? detail : JSON.stringify(detail));
    this.status = status;
    this.detail = detail;
  }
}

export const api = {
  authority: (aid: string) => req<AuthorityView>(`/a/${aid}/state`),
  demoAgents: () => req<{ agents: DemoAgent[] }>("/demo/agents"),
  probes: () => req<{ probes: Probe[]; expectedCount: number }>("/probes"),
  policy: () => req<PolicyView>("/policy"),
  reset: () => req<{ reset: boolean }>("/reset", {}),
  approach: (aid: string, identity: AgentIdentity) => req(`/a/${aid}/gate/approach`, { identity }),
  assess: (aid: string, agent: string, probeScores: Record<string, number>) =>
    req(`/a/${aid}/gate/assess`, { agent, probeScores }),
  challenge: (aid: string, agent: string, body: { prompt: string; anchors: string[]; proverb: string; visibilityRatio?: number }) =>
    req(`/a/${aid}/gate/challenge`, { agent, ...body }),
  attempt: (aid: string, agent: string, response: string) =>
    req<{ status: string }>(`/a/${aid}/gate/challenge/attempt`, { agent, response }),
  approve: (aid: string, agent: string, rationale: string) => req(`/a/${aid}/gate/approve`, { agent, rationale }),
  issue: (aid: string, agent: string) =>
    req<{ vrc: VerifiableRelationshipCredential | null; manifest: DeploymentManifest; refusal?: string }>(
      `/a/${aid}/gate/issue`, { agent },
    ),
  revoke: (aid: string, agent: string, rationale: string) => req(`/a/${aid}/gate/revoke`, { agent, rationale }),
  poolAssemble: (aid: string, agent: string) =>
    req<{ bundle: Bundle; rawIntelShownForDemo: Record<string, unknown> }>(`/a/${aid}/pool/assemble`, { agent }),
  poolReceive: (aid: string, fromAuthority: string, bundleDigest: string) =>
    req<InboxRecord>(`/a/${aid}/pool/receive`, { fromAuthority, bundleDigest }),
  poolReverify: (aid: string) => req<{ results: { accepted: boolean; violations: string[] }[] }>(`/a/${aid}/pool/reverify`, {}),
};

/** Score presets, per demo agent profile. The mirage lands at det ≈ 0.095
 * (stratum 2): both gates can pass, and the variance still sandboxes it. */
export function presetScores(probes: Probe[], profile: "sovereign" | "mirage" | "canary"): Record<string, number> {
  const mirageSigma: Record<string, number> = { sm: 0.7, mr: 0.6, sr: 0.3, mc: 0.3, rc: 0.3, sc: 0.3 };
  return Object.fromEntries(
    probes.map((p) => {
      if (profile === "canary") return [p.id, 1.0];
      if (profile === "sovereign") return [p.id, 0.9];
      const pair = (p as { sigmaPairs?: string[] }).sigmaPairs?.[0];
      return [p.id, pair ? mirageSigma[pair] ?? 0.3 : 0.7];
    }),
  );
}

export function spoofedTwin(agent: AgentIdentity): AgentIdentity {
  return { ...agent, publicKeyMultibase: "z6MkSomebodyElsesKeyEntirely" };
}
