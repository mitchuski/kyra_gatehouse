// The two-implementation interop run — the registry's own promotion bar,
// exercised locally, both directions:
//   A) implementation #2 (Python, independent) VERIFIES a transcript emitted
//      by implementation #1 (Kyra Gate's bridge over the live engine);
//   B) implementation #1's validator VERIFIES transcripts minted by
//      implementation #2 under each of its three EXPRESSIONS
//      (risk-mastery · archon-hearthold · hitchhikers).
// Exits nonzero on any failure. Wired as a `pnpm verify` step.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(repo, "interop", "out");
mkdirSync(OUT, { recursive: true });
const py = path.join(repo, ".venv", "Scripts", "python.exe");
const PORT = 8110;
const B = `http://127.0.0.1:${PORT}`;

let passed = 0;
let failed = 0;
const check = (name, cond) => {
  if (cond) { passed++; console.log(`  \x1b[32mPASS\x1b[0m ${name}`); }
  else { failed++; console.log(`  \x1b[31mFAIL\x1b[0m ${name}`); }
};

console.log("\ninterop · two implementations, three expressions\n");

// --- direction A: impl1 emits (live engine), impl2 verifies -------------------

const engine = spawn(py, ["-m", "uvicorn", "gatehouse_verify.app:app", "--port", String(PORT), "--app-dir", "services/verify"], {
  cwd: repo,
  stdio: ["ignore", "ignore", "ignore"],
});
const call = async (pathname, body) => {
  const res = await fetch(B + pathname, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, data: await res.json().catch(() => ({})) };
};
try {
  let up = false;
  for (let i = 0; i < 40 && !up; i++) {
    try {
      up = (await call("/healthz")).status === 200;
    } catch { /* boot */ }
    if (!up) await new Promise((r) => setTimeout(r, 250));
  }
  if (!up) throw new Error("engine never came up for the interop run");

  const bridgeUrl = pathToFileURL(path.join(repo, "apps", "agent-client", "src", "adapters", "trust-tasks", "bridge.mjs")).href;
  const { speakAsTrustTasks } = await import(bridgeUrl);
  await call("/reset", {});
  const spoken = await speakAsTrustTasks(call);
  const events = (await call("/a/alpha/state")).data.ledger.events;
  const impl1Path = path.join(OUT, "impl1-transcript.json");
  writeFileSync(impl1Path, JSON.stringify({
    implementation: "impl1-kyra-gate (bridge over the live engine)",
    documents: spoken.documents,
    events,
  }, null, 1));
  check("impl1 emitted a full trust-task transcript from the live engine", spoken.documents.length >= 12 && spoken.checks.allSchemasValid);

  const a = spawnSync(py, [path.join("interop", "impl2", "impl2.py"), "verify", impl1Path], { cwd: repo, encoding: "utf8" });
  process.stdout.write(a.stdout.split("\n").map((l) => "    " + l).join("\n") + "\n");
  check("direction A: impl2 (Python) independently verifies impl1's transcript", a.status === 0);
} finally {
  engine.kill();
}

// --- direction B: impl2 mints under each expression, impl1 verifies -----------

const envelopeUrl = pathToFileURL(path.join(repo, "apps", "agent-client", "src", "adapters", "trust-tasks", "envelope.mjs")).href;
const { validatePayload, verifyEnvelope } = await import(envelopeUrl);
const { readFileSync } = await import("node:fs");

for (const expression of ["risk-mastery", "archon-hearthold", "hitchhikers"]) {
  const outPath = path.join(OUT, `impl2-${expression}-transcript.json`);
  const mint = spawnSync(py, [
    path.join("interop", "impl2", "impl2.py"), "mint",
    "--expression", path.join("interop", "impl2", "expressions", `${expression}.json`),
    "--out", outPath,
  ], { cwd: repo, encoding: "utf8" });
  if (mint.status !== 0) {
    console.error(mint.stdout, mint.stderr);
    check(`impl2 mints under the ${expression} expression`, false);
    continue;
  }
  const transcript = JSON.parse(readFileSync(outPath, "utf8"));
  const docs = transcript.documents;
  const schemaErrors = docs.flatMap((d) => validatePayload(d.task, d.doc.payload, { variant: d.variant }));
  const proofsOk = docs.every((d) => verifyEnvelope(d.doc));
  const requests = new Map(docs.filter((d) => d.variant === "request").map((d) => [d.task, d.doc.id]));
  const threadsOk = docs.filter((d) => d.variant === "response").every((d) => d.doc.threadId === requests.get(d.task));
  const issue = docs.find((d) => d.task === "issue" && d.variant === "request")?.doc;
  const gatesOk = issue && issue.payload.gates.length === 2 && new Set(issue.payload.gates.map((g) => g.gate)).size === 2;
  const credProofs = issue?.payload.credential?.proof ?? [];
  const bilateralOk = credProofs.length === 2 && new Set(credProofs.map((p) => p.verificationMethod.split("#")[0])).size === 2;
  const counter = docs.find((d) => d.task === "issue" && d.variant === "response")?.doc;
  const counterOk = counter && counter.issuer === issue?.payload.agent && verifyEnvelope(counter);
  const statusOk = docs.find((d) => d.task === "status" && d.variant === "response")?.doc.payload.revoked === true;
  check(
    `direction B · ${expression}: impl1's validator accepts impl2's transcript (schemas, proofs, threads, gates, bilateral credential, counter-sign, status)`,
    schemaErrors.length === 0 && proofsOk && threadsOk && gatesOk && bilateralOk && counterOk && statusOk,
  );
}

console.log(`\n  interop: ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
