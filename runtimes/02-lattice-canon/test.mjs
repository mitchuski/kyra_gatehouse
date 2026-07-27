// Property tests for the lattice canon. Run: node test.mjs — exits nonzero on FAIL.
import {
  Mage,
  Swordsman,
  dreamCycleTurn,
  loadCorpus,
  strataSizes,
  vertexFromSigma,
  bitsOf,
  popcount,
  parseExternalDimensions,
} from './src/lattice_canon.mjs';

let passed = 0;
let failed = 0;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
function check(name, cond) {
  if (cond) { passed++; console.log(`  ${green('PASS')} ${name}`); }
  else { failed++; console.log(`  ${red('FAIL')} ${name}`); }
}

console.log('\nruntime 02 · lattice-canon — the 64-vertex lattice from first principles\n');

const corpus = loadCorpus();

// G1 — first principles: enumerating {0,1}^6 yields the seven strata of the dragon skill.
{
  const sizes = strataSizes();
  check('G1a strata by popcount are (1,6,15,20,15,6,1)', JSON.stringify(sizes) === JSON.stringify([1, 6, 15, 20, 15, 6, 1]));
  check('G1b harness.py STRATUM_SIZES agrees with the enumeration', JSON.stringify(corpus.stratumSizes) === JSON.stringify(sizes));
  check('G1c strata sum to 64 vertices', sizes.reduce((a, b) => a + b, 0) === 64);
}

// G2 — FD-1 from source: a permutation of {32..1} over the six distinct pairs.
{
  const weights = Object.values(corpus.bitOrder ?? {}).sort((a, b) => b - a);
  check('G2a harness source yields a six-pair FD-1 table', corpus.bitOrder !== null && Object.keys(corpus.bitOrder).length === 6);
  check('G2b FD-1 weights are exactly the lattice basis 32,16,8,4,2,1', JSON.stringify(weights) === JSON.stringify([32, 16, 8, 4, 2, 1]));
  check('G2c FD-1 anchor: σ_sm sets Protection (32)', corpus.bitOrder.sm === 32);
}

// G3 — the canary signs: vertex 63, bits 111111, stratum 6, tier 6 all re-derive.
{
  const { verdict } = dreamCycleTurn(corpus);
  check('G3 the canary sovereignty section signs under recompute', verdict.signed === true && verdict.vertex === 63 && verdict.stratum === 6);
}

// G4 — pipeline spot-derivations: sub-threshold pairs clear their bits.
{
  const sigma = { sm: 1.0, mr: 1.0, sr: 0.2, mc: 1.0, rc: 0.2, sc: 1.0 };
  const v = vertexFromSigma(sigma, corpus.bitOrder, corpus.config.sigma_threshold);
  check('G4a dropping σ_sr and σ_rc clears bits 8 and 2 (vertex 53)', v === 53);
  check('G4b bits render MSB-first', bitsOf(53) === '110101');
  check('G4c stratum of vertex 53 is 4', popcount(53) === 4);
}

// G5 — mirages rejected across the Gap: claimed numbers never trusted.
{
  const forged = structuredClone(corpus.assessment);
  forged.stratum = 5; // claims a lower stratum than its own bits
  forged.tier = 5;
  const verdict = Swordsman(corpus).prove(Mage.propose(forged));
  check('G5a stratum != popcount(vertex) is rejected', verdict.signed === false && verdict.reason === 'stratum-not-popcount');

  const tierForged = structuredClone(corpus.assessment);
  tierForged.tier = 4; // tier IS the stratum; a flattering tier is a mirage
  const v2 = Swordsman(corpus).prove(Mage.propose(tierForged));
  check('G5b tier != stratum is rejected', v2.signed === false && v2.reason === 'tier-not-stratum');

  const vertexForged = structuredClone(corpus.assessment);
  vertexForged.sigma.sm = 0.1; // sigma says the boundary collapsed; vertex still claims 63
  const claim = Mage.propose(vertexForged);
  const v3 = Swordsman(corpus).prove(claim);
  check('G5c a vertex not derivable from its own sigma is rejected', v3.signed === false && v3.reason === 'vertex-not-derivable-from-sigma');
}

// G6 — evidence digest: a claim whose commitment does not match its parts is rejected.
{
  const claim = Mage.propose(corpus.assessment);
  claim.sigma.sc = 0.9; // mutate after committing
  const verdict = Swordsman(corpus).prove(claim);
  check('G6 a post-commitment sigma mutation is evidence-digest-mismatch', verdict.signed === false && verdict.reason === 'evidence-digest-mismatch');
}

// G7 — bit-order drift: a shuffled dimension order is rejected.
{
  const drifted = structuredClone(corpus.assessment);
  drifted.sovereignty.bitOrder = ['Value', 'Delegation', 'Memory', 'Connection', 'Computation', 'Protection'];
  const verdict = Swordsman(corpus).prove(Mage.propose(drifted));
  check('G7 a shuffled canonical dimension order is rejected', verdict.signed === false && verdict.reason === 'bit-order-drift');
}

// G8 — cross-corpus: the external lattice_coherence_audit.py canon agrees
// (skip-flavored pass when the script is absent on this machine).
{
  const external = parseExternalDimensions();
  const expected = [[32, 'Protection'], [16, 'Delegation'], [8, 'Memory'], [4, 'Connection'], [2, 'Computation'], [1, 'Value']];
  check(
    'G8 external lattice_coherence_audit.py canon agrees (skip-passes when absent)',
    external === null || JSON.stringify(external) === JSON.stringify(expected),
  );
}

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
