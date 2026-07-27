// TS parity lane: the SAME golden vectors must validate under ajv 2020-12,
// and the canon/chain discipline must reproduce byte-for-byte in TS.
import { describe, expect, it } from "vitest";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const schemaDir = path.join(repo, "packages", "contracts", "schema");
const testdata = path.join(repo, "packages", "contracts", "testdata");

const load = (p: string) => JSON.parse(readFileSync(p, "utf-8"));

const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
for (const file of fg.sync("*.schema.json", { cwd: schemaDir }).sort()) {
  ajv.addSchema(load(path.join(schemaDir, file)));
}
const validate = (id: string, data: unknown) => {
  const v = ajv.getSchema(`https://gatehouse.agentprivacy.ai/schema/${id}`);
  if (!v) throw new Error(`schema not registered: ${id}`);
  const ok = v(data);
  return { ok, errors: v.errors };
};

// Canonical bytes: recursive sorted keys, no whitespace (parity with canon.py).
function canonical(obj: unknown): string {
  if (Array.isArray(obj)) return `[${obj.map(canonical).join(",")}]`;
  if (obj !== null && typeof obj === "object") {
    const entries = Object.entries(obj as Record<string, unknown>)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(obj);
}
const sha256 = (s: string) => createHash("sha256").update(s, "utf-8").digest("hex");
const eventHash = (event: Record<string, unknown>) => {
  const { contentHash: _drop, ...body } = event;
  return sha256(canonical(body));
};

describe("golden vectors validate (parity with pytest lane)", () => {
  it("canary agent", () => {
    const r = validate("agent-identity.schema.json", load(path.join(testdata, "canary-agent.json")));
    expect(r.errors ?? []).toEqual([]);
    expect(r.ok).toBe(true);
  });
  it("canary assessment", () => {
    const r = validate("assessment-result.schema.json", load(path.join(testdata, "canary-assessment.json")));
    expect(r.errors ?? []).toEqual([]);
    expect(r.ok).toBe(true);
  });
  it("audit chain events", () => {
    for (const event of load(path.join(testdata, "audit-chain-valid.json"))) {
      expect(validate("audit-event.schema.json", event).ok).toBe(true);
    }
  });
  it("probe registry", () => {
    for (const probe of load(path.join(repo, "packages", "contracts", "probes", "registry.json")).probes) {
      const r = validate("probe.schema.json", probe);
      expect(r.errors ?? []).toEqual([]);
      expect(r.ok).toBe(true);
    }
  });
});

describe("canon parity: same bytes, same hash in TS", () => {
  it("valid chain verifies", () => {
    let prior = "0".repeat(64);
    for (const event of load(path.join(testdata, "audit-chain-valid.json"))) {
      expect(event.contentHash).toBe(eventHash(event));
      expect(event.priorHash).toBe(prior);
      prior = event.contentHash;
    }
  });
  it("tampered chain is detected", () => {
    const events = load(path.join(testdata, "audit-chain-tampered.json"));
    const broken = events.some(
      (event: Record<string, unknown>) => event.contentHash !== eventHash(event),
    );
    expect(broken).toBe(true);
  });
});

describe("schema-level gate shape", () => {
  it("VRC without both evidence gates is rejected", () => {
    const chain = load(path.join(testdata, "audit-chain-valid.json"));
    const vrc = {
      "@context": ["https://www.w3.org/ns/credentials/v2"],
      type: ["VerifiableCredential", "VerifiableRelationshipCredential"],
      issuer: "did:web:gatehouse.agentprivacy.ai:authority:demo",
      validFrom: "2026-07-17T00:00:00Z",
      credentialSubject: {
        id: "did:key:z6MkCanaryReferenceAgentPassesByConstruction1",
        tier: 6,
        stratum: 6,
        assessmentDigest: chain[2].payloadDigest,
        relationship: {
          tauCount: 1,
          hTau: 1,
          aTau: 0.6931471805599453,
          proverbCommitment: chain[0].contentHash,
          visibilityRatio: 0.5,
        },
      },
      evidence: [
        { type: "SupervisorApproval", auditEventHash: chain[0].contentHash },
        { type: "SupervisorApproval", auditEventHash: chain[1].contentHash },
      ],
      credentialStatus: { type: "RevocationList2026", statusListRef: "urn:demo:list", statusListIndex: 0 },
      proof: [
        { type: "DataIntegrityProof", verificationMethod: "did:web:x#k1", created: "2026-07-17T00:00:00Z", proofPurpose: "assertionMethod", proofValue: "z1" },
        { type: "DataIntegrityProof", verificationMethod: "did:key:y#k1", created: "2026-07-17T00:00:00Z", proofPurpose: "assertionMethod", proofValue: "z2" },
      ],
    };
    // Missing UnderstandingChallengeAttempt evidence => schema must reject.
    expect(validate("vrc.schema.json", vrc).ok).toBe(false);
    // With both gates present it validates.
    vrc.evidence[1] = { type: "UnderstandingChallengeAttempt", auditEventHash: chain[1].contentHash };
    const r = validate("vrc.schema.json", vrc);
    expect(r.errors ?? []).toEqual([]);
    expect(r.ok).toBe(true);
  });

  it("single-signature VRC is rejected (bilateral)", () => {
    // proof minItems 2 - unforgeable alone.
    const schema = load(path.join(schemaDir, "vrc.schema.json"));
    expect(schema.properties.proof.minItems).toBe(2);
    expect(schema.properties.proof.maxItems).toBe(2);
  });
});
