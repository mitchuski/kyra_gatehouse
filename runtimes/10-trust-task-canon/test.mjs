// Property tests for the vendored trust-task canon. Run: node test.mjs — exits nonzero on FAIL.
import {
  loadBundle,
  digestsMatch,
  refsResolve,
  payloadsClosed,
  familyRules,
  provenanceNamesUpstream,
  bareFloatSurface,
  TASKS,
} from "./src/trust_task_canon.mjs";

let passed = 0;
let failed = 0;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
function check(name, cond) {
  if (cond) { passed++; console.log(`  ${green("PASS")} ${name}`); }
  else { failed++; console.log(`  ${red("FAIL")} ${name}`); }
}

console.log("\nruntime 10 · trust-task-canon — the vendored ToIP family under audit\n");

const bundle = loadBundle();

// G1 — the vendored bundle is whole and byte-honest.
{
  check("G1a all eight vendored files present", Object.values(bundle.present).every(Boolean));
  check("G1b provenance record present", typeof bundle.provenance === "string" && bundle.provenance.length > 0);
  const d = digestsMatch(bundle);
  check("G1c every file digest matches the provenance table", d.ok);
  check("G1d the table carries exactly the vendored set", d.declaredCount === Object.keys(bundle.files).length);
  check("G1e provenance names the upstream repo and commit", provenanceNamesUpstream(bundle));
}

// G2 — the family's refs and closure discipline hold.
{
  const r = refsResolve(bundle);
  check("G2a every external $ref resolves into the vendored set", r.ok);
  const c = payloadsClosed(bundle);
  check("G2b every object schema with properties is closed", c.ok);
  check("G2c the framework Ext slot is open by design (and only it)", c.extOpenByDesign === true);
  const w1 = bareFloatSurface(bundle);
  check("G2d bare floats stay in the known quarantine (W-1: the canon float seam)", w1.quarantined);
}

// G3 — the ceremony's rules survive in schema form.
{
  const f = familyRules(bundle);
  check("G3a the verdict lexicon is closed at three", f.verdictClosed);
  check("G3b issuance demands exactly two gates", f.twoGatesExactly);
  check("G3c the two gate kinds are a closed pair", f.gateKindsDistinctByEnum);
  check("G3d every task carries an anchored response schema", f.responsesAnchored);
  check("G3e every $id is the canonical type URI", f.idsCanonical);
  check("G3f a status query must name a subject", f.statusNeedsASubject);
  check("G3g the family is six tasks, no more, no fewer", TASKS.length === 6);
}

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
