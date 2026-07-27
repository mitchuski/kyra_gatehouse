// Property tests for the policy sync. Run: node test.mjs — exits nonzero on FAIL.
import { Mage, Swordsman, dreamCycleTurn, loadCorpus, clauseNames } from './src/lexon_policy_sync.mjs';

let passed = 0;
let failed = 0;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
function check(name, cond) {
  if (cond) { passed++; console.log(`  ${green('PASS')} ${name}`); }
  else { failed++; console.log(`  ${red('FAIL')} ${name}`); }
}

console.log('\nruntime 06 · lexon-policy-sync — the law and the code, one voice\n');

const corpus = loadCorpus();

// G1 — the live correspondence signs: emitted clauses ⊆ term, census exact,
// threshold traced to config.
{
  const { verdict } = dreamCycleTurn(corpus);
  check('G1a the correspondence signs', verdict.signed === true);
  check('G1b the emitter speaks the four guardrails', JSON.stringify(verdict.emitted) === JSON.stringify(['Two Gates', 'Audit', 'Variance', 'Revocation']));
  check('G1c the term adds the schema-level Spoof Refusal gate', verdict.clauses.includes('Spoof Refusal'));
  check('G1d the Variance number is the live config value', verdict.detFlyThreshold === 0.15);
}

// G2 — a clause dropped from the regulator-facing term is caught.
{
  const mutated = structuredClone(corpus);
  mutated.term = mutated.term.replace(/CLAUSE: Revocation\.[\s\S]*?immediately\.\n/, '');
  const verdict = Swordsman(mutated).prove(Mage.propose(mutated));
  check('G2 a dropped Revocation clause is caught', verdict.signed === false && (verdict.reason === 'clause-missing-from-term' || verdict.reason === 'term-clause-census-drift'));
}

// G3 — a clause added to the term without the emitter is census drift (the
// law may not quietly widen beyond what the harness prints + Spoof Refusal).
{
  const mutated = structuredClone(corpus);
  mutated.term += '\nCLAUSE: Grace Period.\nA revoked Credential remains valid for one day.\n';
  const verdict = Swordsman(mutated).prove(Mage.propose(mutated));
  check('G3 a quietly widened term is census drift', verdict.signed === false && verdict.reason === 'term-clause-census-drift');
}

// G4 — the Gap: a claim whose digest does not match the corpus bytes is refused.
{
  const claim = Mage.propose(corpus);
  claim.termClauses = [...claim.termClauses, 'Backdoor'];
  claim.evidenceDigest = 'a'.repeat(64);
  const verdict = Swordsman(corpus).prove(claim);
  check('G4 a forged correspondence claim is refused', verdict.signed === false && verdict.reason === 'evidence-digest-mismatch');
}

// G5 — rule 6: the emitter must cite config, and a hardcoded threshold in the
// emitter source would be refused.
{
  const mutated = structuredClone(corpus);
  mutated.harnessSource = mutated.harnessSource.replace('{cfg.det_fly_threshold}', '0.15');
  const verdict = Swordsman(mutated).prove(Mage.propose(mutated));
  check('G5 a hardcoded magic number in the emitter is refused', verdict.signed === false && (verdict.reason === 'threshold-not-config-derived' || verdict.reason === 'magic-number-in-emitter'));
}

// G6 — parser sanity: clause extraction reads both registers the same way.
{
  const sample = 'CLAUSE: Two Gates. Something.\nCLAUSE: Audit.\n';
  check('G6 clause parser is register-neutral', JSON.stringify(clauseNames(sample)) === JSON.stringify(['Two Gates', 'Audit']));
}

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
