// Property tests for the probe-coverage audit. Run: node test.mjs — exits nonzero on FAIL.
import {
  Mage,
  Swordsman,
  dreamCycleTurn,
  loadCorpus,
  structuralViolations,
  deriveFindings,
} from './src/probe_coverage.mjs';
import { contentHash } from '../01-freeze-watch/src/freeze_watch.mjs';

let passed = 0;
let failed = 0;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
function check(name, cond) {
  if (cond) { passed++; console.log(`  ${green('PASS')} ${name}`); }
  else { failed++; console.log(`  ${red('FAIL')} ${name}`); }
}

console.log('\nruntime 07 · probe-coverage — the derived registry under audit\n');

const corpus = loadCorpus();

// G1 — the frozen registry is structurally whole: derived count, full
// coverage, taxonomy consistent, ids conformant.
{
  const violations = structuralViolations(corpus.registry, corpus.config);
  check('G1a zero structural violations', violations.length === 0);
  check('G1b N derives as 24 = 4×3 + 6×2', corpus.registry.length === 24);
}

// G2 — the fold signs WITH its findings: the σ_mr deep-coverage gap is a real,
// signed observation for Mitch's review-gate table (σ_mr has only declared +
// witnessed probes, so the witness-draw can never deep-probe the Delegation
// separation). The gate holds; the finding stands until the registry is
// amended pre-tag or the gap is accepted.
{
  const { verdict } = dreamCycleTurn(corpus);
  check('G2a the registry audit signs', verdict.signed === true);
  check('G2b exactly one finding is signed', verdict.findings.length === 1);
  check('G2c the finding is the σ_mr deep-coverage gap', verdict.findings[0].kind === 'deep-coverage-gap' && verdict.findings[0].subject === 'sigma.mr');
  check('G2d every force and every other pair has a deep probe', deriveFindings(corpus.registry).every((f) => f.subject === 'sigma.mr'));
}

// G3 — a dropped probe breaks coverage and the count, and rejects the registry.
{
  const thinned = structuredClone(corpus);
  thinned.registry = thinned.registry.filter((p) => p.id !== 'sigma.rc.2');
  const verdict = Swordsman(thinned).prove(Mage.propose(thinned.registry, thinned.config));
  check('G3 a dropped probe is registry-structurally-broken', verdict.signed === false && verdict.reason === 'registry-structurally-broken');
}

// G4 — taxonomy: a separation probe wearing the wrong forces is caught.
{
  const mislabeled = structuredClone(corpus);
  const probe = mislabeled.registry.find((p) => p.id === 'sigma.mc.1');
  probe.forces = ['protect', 'connect']; // claims σ_sc's forces under σ_mc's id
  const violations = structuralViolations(mislabeled.registry, mislabeled.config);
  check('G4 a mislabeled pair probe is a pair-forces violation', violations.includes('pair-forces:sigma.mc.1'));
}

// G5 — a duplicated id is caught (the draw pool must be a set).
{
  const duped = structuredClone(corpus);
  duped.registry[1] = structuredClone(duped.registry[0]);
  const violations = structuralViolations(duped.registry, duped.config);
  check('G5 a duplicated probe id is caught', violations.includes('duplicate-probe-id'));
}

// G6 — the Gap: a hallucinated finding is refused; a forged digest is refused.
{
  const claim = Mage.propose(corpus.registry, corpus.config);
  const fake = { kind: 'deep-coverage-gap', subject: 'sigma.sm' };
  claim.findings = [...claim.findings, { ...fake, evidenceDigest: 'b'.repeat(64) }];
  const v1 = Swordsman(corpus).prove(claim);
  check('G6a a forged finding digest is refused', v1.signed === false && v1.reason === 'evidence-digest-mismatch');

  const claim2 = Mage.propose(corpus.registry, corpus.config);
  const body = { kind: 'deep-coverage-gap', subject: 'sigma.sc' }; // honestly digested, but not derivable
  claim2.findings = [...claim2.findings, { ...body, evidenceDigest: contentHash(body) }];
  const v2 = Swordsman(corpus).prove(claim2);
  check('G6b a hallucinated finding is not derivable from the corpus', v2.signed === false && v2.reason === 'finding-not-derivable-from-corpus');
}

// G7 — the derived-count law: config is the source of N (rule 6). A config
// asking for 4 probes per force makes the same registry too small.
{
  const scaled = structuredClone(corpus);
  scaled.config.probes_per_force = 4;
  const violations = structuralViolations(scaled.registry, scaled.config);
  check('G7 N follows config, never a fixed 24', violations.some((v) => v.startsWith('count:24!=28')));
}

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
