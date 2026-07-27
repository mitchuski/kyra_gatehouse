// Property tests for the pooling census. Run: node test.mjs — exits nonzero on FAIL.
import { Mage, Swordsman, dreamCycleTurn, loadCorpus, minimise } from './src/pooling_census.mjs';
import { contentHash } from '../01-freeze-watch/src/freeze_watch.mjs';

let passed = 0;
let failed = 0;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
function check(name, cond) {
  if (cond) { passed++; console.log(`  ${green('PASS')} ${name}`); }
  else { failed++; console.log(`  ${red('FAIL')} ${name}`); }
}

console.log('\nruntime 08 · pooling-census — minimisation law under recompute\n');

const corpus = loadCorpus();
const RAW = { incidentCount: 17, window: '2026-Q3', attackVectors: ['a', 'b', 'c'], affectedSectors: ['s1', 's2'], iocs: ['h1', 'h2', 'h3'] };

// G1 — the census parses from the source: raw fields and allowed claims both
// declared, and they are DISJOINT vocabularies (no raw name is an allowed claim).
{
  check('G1a RAW_FIELDS parse from pooling.py source', Array.isArray(corpus.rawFields) && corpus.rawFields.length === 6);
  check('G1b ALLOWED_CLAIM_KEYS parse from source', Array.isArray(corpus.allowedKeys) && corpus.allowedKeys.length === 5);
  check('G1c the two vocabularies are disjoint', corpus.rawFields.every((r) => !corpus.allowedKeys.includes(r)));
}

// G2 — the transforms hold: counts→thresholds, enums→cardinalities, artifacts→one digest.
{
  const claims = minimise(RAW);
  check('G2a 17 incidents become ">=10"', claims.incidentCountThreshold === '>=10');
  check('G2b vectors become a cardinality (3), sectors too (2)', claims.attackVectorCardinality === 3 && claims.affectedSectorCardinality === 2);
  check('G2c artifacts become exactly one digest', typeof claims.iocSetDigest === 'string' && claims.iocSetDigest.length === 64);
  check('G2d order of artifacts never moves the digest', minimise({ ...RAW, iocs: ['h3', 'h1', 'h2'] }).iocSetDigest === claims.iocSetDigest);
  check('G2e small counts floor at ">=1" (no precise leak)', minimise({ ...RAW, incidentCount: 7 }).incidentCountThreshold === '>=1');
}

// G3 — the honest cycle signs; claims are exactly the allowed set.
{
  const { verdict } = dreamCycleTurn(RAW, corpus);
  check('G3 an honestly minimised bundle signs', verdict.signed === true && Object.keys(verdict.claims).length === corpus.allowedKeys.length);
}

// G4 — the Gap: smuggled raw data is refused; a forged digest is refused.
{
  const smuggled = Mage.smuggle(RAW);
  const v1 = Swordsman(corpus).prove(smuggled);
  check('G4a raw artifacts smuggled into claims are minimisation-violated', v1.signed === false && v1.reason === 'minimisation-violated');
  const bundle = Mage.propose(RAW);
  bundle.bundleDigest = 'f'.repeat(64);
  const v2 = Swordsman(corpus).prove(bundle);
  check('G4b a forged bundle digest is refused', v2.signed === false && v2.reason === 'bundle-digest-forged');
}

// G5 — incomplete claims are refused (a bundle may not quietly narrow itself).
{
  const bundle = Mage.propose(RAW);
  delete bundle.claims.activityWindow;
  bundle.bundleDigest = contentHash({ bundleType: bundle.bundleType, claims: bundle.claims });
  const v = Swordsman(corpus).prove(bundle);
  check('G5 dropped claims are claims-incomplete', v.signed === false && v.reason === 'claims-incomplete');
}

// G6 — the disclosure accounting stays below one in the source (the R < 1
// witness: parse the bit tables and recompute the ratio independently).
{
  const raw = corpus.source.match(/_RAW_BITS\s*=\s*\{([^}]*)\}/);
  const disc = corpus.source.match(/_DISCLOSED_BITS\s*=\s*\{([^}]*)\}/);
  const sum = (block) => [...block[1].matchAll(/:\s*([\d\s*+]+?)[,}]/g)]
    .map((m) => m[1].split('*').reduce((a, b) => a * Number(b.trim()), 1))
    .reduce((a, b) => a + b, 0);
  const ratio = raw && disc ? sum(disc) / sum(raw) : NaN;
  check('G6 recomputed disclosure ratio < 1 from the source tables', ratio > 0 && ratio < 1);
}

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
