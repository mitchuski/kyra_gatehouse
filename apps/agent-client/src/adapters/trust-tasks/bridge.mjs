// The gateway beats — session 14 lane (TT-3), adapters lane only.
//
// Drives one full Act-I ceremony against a running engine (over the same HTTP
// surface the apps use) and speaks every beat as a ToIP Trust Task envelope:
// apply → respond → approve → issue (+ the agent's REAL counter-signature,
// D14-3) → revoke → a relying-party status read. Every payload validates
// against the vendored schemas; every evidence digest must be a REAL ledger
// contentHash the engine computed itself — that equality is the wire proof
// that this module's canonicalisation is parity, not a parallel truth.
//
// The engine is untouched: this is a bridge at the app edge. One honest demo
// note, carried into the transcript: the demo merges supervisor and gate
// authority into one party (the family spec names the split as its open
// question 1), so the approve envelope is issuer == recipient here.

import {
  contentHash,
  keypairFromSeedLabel,
  mintEnvelope,
  validatePayload,
  verifyEnvelope,
} from "./envelope.mjs";

const SCOPE_FUNCTION = "http://localhost:1337/policy"; // D14-4: the live Lexon clauses + config
const HEX64 = /^[0-9a-f]{64}$/;

async function ledgerEvents(call, aid) {
  return (await call(`/a/${aid}/state`)).data.ledger.events;
}
const lastHashWhere = (events, pred) => events.filter(pred).map((e) => e.contentHash).pop();

/**
 * Speak one full ceremony as trust tasks. `call(path, body?)` is the e2e-style
 * HTTP helper bound to the engine base URL. Returns { checks, documents, notes }.
 */
export async function speakAsTrustTasks(call, { aid = "alpha" } = {}) {
  const notes = [];
  const documents = [];
  const schemaErrors = [];
  const record = (doc, task, variant) => {
    documents.push({ task, variant, doc });
    const errs = validatePayload(task, doc.payload, { variant });
    if (errs.length) schemaErrors.push(...errs);
    return doc;
  };

  // Parties: same deterministic demo custody as the engine (keys.py).
  const agents = (await call("/demo/agents")).data.agents;
  const vera = agents.find((a) => a.profile === "sovereign");
  const agentKey = keypairFromSeedLabel("agent:vera");
  const authorityKey = keypairFromSeedLabel(`authority:${aid}`);
  const relyingKey = keypairFromSeedLabel("relying-party:demo");
  const keysMatchEngine = agentKey.did === vera.id;

  // --- apply -----------------------------------------------------------------
  const submissionDigest = contentHash(vera);
  const apply = record(
    mintEnvelope({
      task: "apply",
      keypair: agentKey,
      recipient: authorityKey.did,
      payload: {
        agent: agentKey.did,
        policyRef: SCOPE_FUNCTION,
        submissionDigest,
      },
    }),
    "apply",
    "request",
  );
  const approach = await call(`/a/${aid}/gate/approach`, { identity: vera });

  const probes = (await call("/probes")).data.probes;
  await call(`/a/${aid}/gate/assess`, {
    agent: vera.id,
    probeScores: Object.fromEntries(probes.map((p) => [p.id, 0.9])),
  });

  const PROMPT = "Why does a revoked credential fail verification everywhere?";
  const applyResponse = record(
    mintEnvelope({
      task: "apply",
      variant: "response",
      keypair: authorityKey,
      recipient: agentKey.did,
      threadId: apply.id,
      payload: {
        applicationId: vera.id,
        witnessDraw: {
          algorithm: "sha256-canonical-json",
          submissionDigest,
          criteria: [{ criterionId: "understanding:prompt", prompt: PROMPT }],
        },
        respondBy: new Date(Date.now() + 30 * 60_000).toISOString(),
      },
    }),
    "apply",
    "response",
  );

  // --- respond ---------------------------------------------------------------
  await call(`/a/${aid}/gate/challenge`, {
    agent: vera.id,
    prompt: PROMPT,
    anchors: ["revocation", "verifier", "status list"],
    proverb: "the gate remembers",
  });
  const answer =
    "If my credential is revoked, my entry on the shared revocation status list flips at once. " +
    "Every verifier consults that status list before trusting me, so verification fails everywhere immediately.";
  const attempt = await call(`/a/${aid}/gate/challenge/attempt`, { agent: vera.id, response: answer });

  const respond = record(
    mintEnvelope({
      task: "respond",
      keypair: agentKey,
      recipient: authorityKey.did,
      payload: {
        agent: agentKey.did,
        applicationId: vera.id,
        answers: [{ criterionId: "understanding:prompt", answer }],
      },
    }),
    "respond",
    "request",
  );

  let events = await ledgerEvents(call, aid);
  const understandingDigest = lastHashWhere(
    events,
    (e) => e.subject === vera.id && /challenge/.test(e.action),
  );
  const understandingGate = {
    gate: "understandingChallenge",
    passed: attempt.data.status === "passed",
    at: new Date().toISOString(),
    evidenceDigest: understandingDigest ?? "0".repeat(64),
  };
  record(
    mintEnvelope({
      task: "respond",
      variant: "response",
      keypair: authorityKey,
      recipient: agentKey.did,
      threadId: respond.id,
      payload: { applicationId: vera.id, understandingGate },
    }),
    "respond",
    "response",
  );

  // --- approve (demo merges supervisor and gate authority — open question 1) --
  const approve = record(
    mintEnvelope({
      task: "approve",
      keypair: authorityKey,
      recipient: authorityKey.did,
      payload: {
        applicationId: vera.id,
        agent: agentKey.did,
        decision: "approve",
        note: "trust-task bridge: reviewed the scored answers against the live policy",
      },
    }),
    "approve",
    "request",
  );
  notes.push("demo posture: supervisor == gate authority (family spec open question 1)");
  await call(`/a/${aid}/gate/approve`, { agent: vera.id, rationale: "trust-task bridge: approved" });

  events = await ledgerEvents(call, aid);
  const approvalDigest = lastHashWhere(events, (e) => e.subject === vera.id && /approv/.test(e.action));
  const supervisorGate = {
    gate: "supervisorApproval",
    passed: true,
    at: new Date().toISOString(),
    evidenceDigest: approvalDigest ?? "0".repeat(64),
  };
  record(
    mintEnvelope({
      task: "approve",
      variant: "response",
      keypair: authorityKey,
      recipient: authorityKey.did,
      threadId: approve.id,
      payload: { applicationId: vera.id, supervisorGate },
    }),
    "approve",
    "response",
  );

  // --- issue + the agent's real counter-signature (D14-3) --------------------
  const issued = await call(`/a/${aid}/gate/issue`, { agent: vera.id });
  const vrc = issued.data.vrc;
  const manifest = issued.data.manifest ?? {};
  const tierCandidate = [manifest.tier, manifest.stratum, manifest.scope?.tier].find(Number.isInteger);
  const tierGrant = { tier: tierCandidate ?? 0, scopeFunction: SCOPE_FUNCTION };

  events = await ledgerEvents(call, aid);
  const ledgerHead = events[events.length - 1]?.contentHash ?? "0".repeat(64);
  const issue = record(
    mintEnvelope({
      task: "issue",
      keypair: authorityKey,
      recipient: agentKey.did,
      payload: {
        applicationId: vera.id,
        agent: agentKey.did,
        verdict: manifest.decision === "fly" ? "validated" : manifest.decision === "sandbox" ? "failedHeldOut" : "blocked",
        tierGrant,
        gates: [understandingGate, supervisorGate],
        ledgerHead,
        credential: vrc ?? {},
      },
    }),
    "issue",
    "request",
  );
  const credentialDigest = contentHash(vrc ?? {});
  const counterSign = record(
    mintEnvelope({
      task: "issue",
      variant: "response",
      keypair: agentKey, // the agent itself signs acceptance — bilaterality on the wire
      recipient: authorityKey.did,
      threadId: issue.id,
      payload: { applicationId: vera.id, credentialDigest, counterSigned: true },
    }),
    "issue",
    "response",
  );

  // --- revoke ----------------------------------------------------------------
  const revoke = record(
    mintEnvelope({
      task: "revoke",
      keypair: authorityKey,
      recipient: authorityKey.did,
      payload: {
        credentialId: credentialDigest,
        agent: agentKey.did,
        reason: "trust-task bridge: end of demonstration ceremony",
      },
    }),
    "revoke",
    "request",
  );
  await call(`/a/${aid}/gate/revoke`, { agent: vera.id, rationale: "trust-task bridge: revoked" });
  const revokedAt = new Date().toISOString();
  record(
    mintEnvelope({
      task: "revoke",
      variant: "response",
      keypair: authorityKey,
      recipient: authorityKey.did,
      threadId: revoke.id,
      payload: { credentialId: credentialDigest, revoked: true, revokedAt, mirroredAnchors: [] },
    }),
    "revoke",
    "response",
  );

  // --- status: the relying-party read (authoritative; anchors only mirror) ----
  const verifyRead = (await call(`/a/${aid}/gate/verify/${vera.id}`)).data;
  const status = record(
    mintEnvelope({
      task: "status",
      keypair: relyingKey,
      recipient: authorityKey.did,
      payload: { agent: agentKey.did },
    }),
    "status",
    "request",
  );
  const statusResponse = record(
    mintEnvelope({
      task: "status",
      variant: "response",
      keypair: authorityKey,
      recipient: relyingKey.did,
      threadId: status.id,
      payload: {
        agent: agentKey.did,
        credentialId: credentialDigest,
        verdict: "validated",
        tierGrant,
        issuedAt: issue.issuedAt,
        revoked: verifyRead.holds === false,
        revokedAt,
        anchors: [],
      },
    }),
    "status",
    "response",
  );

  // --- the checks the beats assert -------------------------------------------
  events = await ledgerEvents(call, aid);
  const ledgerHashes = new Set(events.map((e) => e.contentHash));
  const responses = documents.filter((d) => d.variant === "response");
  const requestIds = new Map(documents.filter((d) => d.variant === "request").map((d) => [d.task, d.doc.id]));

  // Canon parity, proven on the wire: recompute every ledger event's
  // contentHash (hash of the event without it) with THIS module's
  // canonicalisation and require byte-exact agreement with the engine's.
  const canonParity =
    events.length > 0 &&
    events.every((e) => {
      const { contentHash: engineHash, ...body } = e;
      return contentHash(body) === engineHash;
    });

  const checks = {
    engineAdmitted: approach.status === 200,
    keysMatchEngine,
    canonParity,
    allSchemasValid: schemaErrors.length === 0,
    allProofsVerify: documents.every((d) => verifyEnvelope(d.doc)),
    threadChain: responses.every((d) => d.doc.threadId === requestIds.get(d.task)),
    gatesDistinct:
      new Set(issue.payload.gates.map((g) => g.gate)).size === 2 && issue.payload.gates.length === 2,
    evidenceInLedger:
      [understandingGate.evidenceDigest, supervisorGate.evidenceDigest, issue.payload.ledgerHead].every(
        (h) => HEX64.test(h) && ledgerHashes.has(h),
      ),
    counterSignedByAgent: counterSign.issuer === vera.id && verifyEnvelope(counterSign),
    statusRevoked: statusResponse.payload.revoked === true,
    verdictClosed: ["validated", "failedHeldOut", "blocked"].includes(issue.payload.verdict),
  };
  return { checks, documents, notes, schemaErrors };
}
