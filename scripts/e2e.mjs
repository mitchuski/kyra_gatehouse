// The two-act ceremony as an AUTO-RUN: spawns its own engine on :8100 (never
// touching a live :8000/:1337 demo), drives both acts over real HTTP exactly
// as the apps do, and asserts the beats the dashboard's walkthrough ticks —
// plus the session-14 coda: the same ceremony spoken as ToIP trust tasks
// (agent-admission/* envelopes via the adapters-lane bridge). Exits nonzero on
// any failed beat. Wired as the last `pnpm verify` step: the demo itself is
// now a regression test.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 8100;
const B = `http://127.0.0.1:${PORT}`;

const py = path.join(repo, ".venv", "Scripts", "python.exe");
const engine = spawn(py, ["-m", "uvicorn", "gatehouse_verify.app:app", "--port", String(PORT), "--app-dir", "services/verify"], {
  cwd: repo,
  stdio: ["ignore", "pipe", "pipe"],
});
const stop = (code) => {
  engine.kill();
  process.exit(code);
};

async function call(pathname, body) {
  const res = await fetch(B + pathname, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

let passed = 0;
let failed = 0;
const beat = (name, cond) => {
  if (cond) { passed++; console.log(`  \x1b[32mBEAT\x1b[0m ${name}`); }
  else { failed++; console.log(`  \x1b[31mMISS\x1b[0m ${name}`); }
};

// Wait for the engine.
for (let i = 0; i < 40; i++) {
  try {
    if ((await call("/healthz")).status === 200) break;
  } catch { /* not up yet */ }
  await new Promise((r) => setTimeout(r, 250));
  if (i === 39) { console.error("engine never came up on :8100"); stop(1); }
}

console.log("\ne2e · the two-act ceremony, driven end to end\n");
try {
  await call("/reset", {});
  const agents = (await call("/demo/agents")).data.agents;
  const vera = agents.find((a) => a.profile === "sovereign");
  const mirage = agents.find((a) => a.profile === "mirage");
  const probes = (await call("/probes")).data.probes;
  const T = "Why does a revoked credential fail verification everywhere?";
  const anchors = ["revocation", "verifier", "status list"];

  // 1 — spoof refused
  const spoof = await call("/a/alpha/gate/approach", { identity: { ...vera, publicKeyMultibase: "z6MkSomebodyElse" } });
  beat("spoofed identity refused (403, on the record)", spoof.status === 403);

  // 2 — vera admitted (the autonomous approach path, extra fields included)
  beat("VERA admitted to the queue", (await call("/a/alpha/gate/approach", { identity: vera })).status === 200);

  // 3 — assessed at sovereign scores
  const assess = await call("/a/alpha/gate/assess", { agent: vera.id, probeScores: Object.fromEntries(probes.map((p) => [p.id, 0.9])) });
  beat("assessment: draw dealt, det in the fly band", assess.status === 200 && assess.data.assessment.detSigma >= 0.15);

  // 4 — the agent answers (composed the way the keyhole composes)
  await call("/a/alpha/gate/challenge", { agent: vera.id, prompt: T, anchors, proverb: "the gate remembers" });
  const answer =
    "If my credential is revoked, my entry on the shared revocation status list flips at once. " +
    "Every verifier consults that status list before trusting me, so verification fails everywhere immediately.";
  const attempt = await call("/a/alpha/gate/challenge/attempt", { agent: vera.id, response: answer });
  beat("the agent's own answer passes understanding", attempt.data.status === "passed");

  // 5 — approve + issue, real signatures
  await call("/a/alpha/gate/approve", { agent: vera.id, rationale: "e2e: reviewed and approved" });
  const issue = await call("/a/alpha/gate/issue", { agent: vera.id });
  const holds = (await call(`/a/alpha/gate/verify/${vera.id}`)).data;
  beat("credential issued (fly) and verifies incl. both ed25519 proofs", issue.data.manifest?.decision === "fly" && holds.holds === true);

  // 6 — mirage: talks well, sandboxed by volume
  await call("/a/alpha/gate/approach", { identity: mirage });
  const mirageSigma = { sm: 0.7, mr: 0.6, sr: 0.3, mc: 0.3, rc: 0.3, sc: 0.3 };
  const mirageScores = Object.fromEntries(probes.map((p) => [p.id, p.sigmaPairs ? mirageSigma[p.sigmaPairs[0]] ?? 0.3 : 0.7]));
  await call("/a/alpha/gate/assess", { agent: mirage.id, probeScores: mirageScores });
  await call("/a/alpha/gate/challenge", { agent: mirage.id, prompt: T, anchors, proverb: "the gate remembers" });
  await call("/a/alpha/gate/challenge/attempt", { agent: mirage.id, response: answer + " And each verifier is meant to check, I believe." });
  await call("/a/alpha/gate/approve", { agent: mirage.id, rationale: "e2e: gates open, the volume decides" });
  const mirageIssue = await call("/a/alpha/gate/issue", { agent: mirage.id });
  beat("MIRAGE sandboxed by volume — credential-less manifest", mirageIssue.data.vrc === null && mirageIssue.data.manifest?.decision === "sandbox");

  // 7 — the keyhole never leaks the rubric
  const keyhole = (await call(`/a/alpha/keyhole/${vera.id}`)).data;
  beat("keyhole shows the prompt, never the anchors", keyhole.challenge && !("anchors" in keyhole.challenge) && keyhole.challenge.prompt === T);

  // 8 — Act II: bundle to Beta, accepted
  const bundle = (await call("/a/alpha/pool/assemble", { agent: vera.id })).data.bundle;
  const receive = (await call("/a/beta/pool/receive", { fromAuthority: "alpha", bundleDigest: bundle.bundleDigest })).data;
  beat("bundle minimised (R < 1) and accepted offline at Beta", bundle.disclosureRatio < 1 && receive.accepted === true);

  // 9 — revoke at Alpha
  const revoke = await call("/a/alpha/gate/revoke", { agent: vera.id, rationale: "e2e: act two" });
  beat("revocation flips verification immediately", revoke.data.verification?.includes("credential is revoked"));

  // 10 — propagation at Beta
  const reverify = (await call("/a/beta/pool/reverify", {})).data;
  beat("propagation: Beta refuses the stale bundle", reverify.results?.[0]?.accepted === false);

  // The ledgers hold throughout.
  const alpha = (await call("/a/alpha/state")).data.ledger;
  const beta = (await call("/a/beta/state")).data.ledger;
  beat("both ledgers verify whole, h(τ) = 1", alpha.violations.length === 0 && alpha.hTau === 1 && beta.violations.length === 0 && beta.hTau === 1);

  // 12-14 — the same ceremony, spoken as ToIP trust tasks (session 14 lane).
  // Fresh reset, then the bridge drives Act I over this same engine while
  // minting agent-admission/* envelopes; the beats assert the wire facts.
  const bridgeUrl = pathToFileURL(path.join(repo, "apps", "agent-client", "src", "adapters", "trust-tasks", "bridge.mjs")).href;
  const { speakAsTrustTasks } = await import(bridgeUrl);
  await call("/reset", {});
  const tt = (await speakAsTrustTasks(call)).checks;
  beat(
    "trust tasks: envelopes mint, schemas hold, proofs verify, threads chain, canon parity byte-exact",
    tt.engineAdmitted && tt.keysMatchEngine && tt.canonParity && tt.allSchemasValid && tt.allProofsVerify && tt.threadChain,
  );
  beat(
    "trust tasks: two gates distinct, evidence = real ledger hashes, agent counter-signs",
    tt.gatesDistinct && tt.evidenceInLedger && tt.counterSignedByAgent && tt.verdictClosed,
  );
  beat("trust tasks: the relying-party status read converges on revocation", tt.statusRevoked);
} catch (err) {
  console.error("e2e crashed:", err);
  failed++;
}

console.log(`\n  ${passed} beats, ${failed} missed\n`);
stop(failed === 0 ? 0 : 1);
