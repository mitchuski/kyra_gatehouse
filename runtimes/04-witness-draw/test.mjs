// Property tests for the witness draw. Run: node test.mjs — exits nonzero on FAIL.
import { Mage, Swordsman, dreamCycleTurn, loadCorpus, witnessDraw } from './src/witness_draw.mjs';

let passed = 0;
let failed = 0;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
function check(name, cond) {
  if (cond) { passed++; console.log(`  ${green('PASS')} ${name}`); }
  else { failed++; console.log(`  ${red('FAIL')} ${name}`); }
}

console.log('\nruntime 04 · witness-draw — the anti-grooming Gap, re-derived\n');

const corpus = loadCorpus();

// G1 — the golden draw re-derives EXACTLY in this lane: same submission bytes,
// same six probes in the same order, same persisted hashes.
{
  const fresh = witnessDraw(corpus.canaryAgent, corpus.registry, 6);
  check('G1a drawn probe ids reproduce byte-for-byte', JSON.stringify(fresh.drawnProbeIds) === JSON.stringify(corpus.goldenDraw.drawnProbeIds));
  check('G1b canonHash reproduces', fresh.canonHash === corpus.goldenDraw.canonHash);
  check('G1c registryHash reproduces', fresh.registryHash === corpus.goldenDraw.registryHash);
}

// G2 — the draw size is derived, not chosen: k = draw_fraction * N.
{
  const n = corpus.registry.length;
  const k = Math.round(n * corpus.config.draw_fraction);
  check('G2 golden k equals draw_fraction × N (6 = 0.25 × 24)', corpus.goldenDraw.drawnProbeIds.length === k && n === 24);
}

// G3 — determinism and sensitivity: same bytes same draw; one changed byte in
// the submission moves the seed (and the agent cannot predict where).
{
  const a = witnessDraw(corpus.canaryAgent, corpus.registry, 6);
  const b = witnessDraw(corpus.canaryAgent, corpus.registry, 6);
  check('G3a same submission bytes, same draw', JSON.stringify(a) === JSON.stringify(b));
  const mutated = structuredClone(corpus.canaryAgent);
  mutated.declaredCapabilities.push('pool.read');
  const c = witnessDraw(mutated, corpus.registry, 6);
  check('G3b a changed submission reseeds the draw', c.canonHash !== a.canonHash && JSON.stringify(c.drawnProbeIds) !== JSON.stringify(a.drawnProbeIds));
}

// G4 — sampling without replacement: no probe drawn twice, all from the registry.
{
  const full = witnessDraw(corpus.canaryAgent, corpus.registry, corpus.registry.length);
  const unique = new Set(full.drawnProbeIds);
  const ids = new Set(corpus.registry.map((p) => p.id));
  check('G4 a full draw is a permutation of the registry', unique.size === 24 && [...unique].every((id) => ids.has(id)));
}

// G5 — the honest cycle signs; the GROOMED draw is refused across the Gap.
{
  const { verdict } = dreamCycleTurn(corpus.canaryAgent, corpus.registry, 6);
  check('G5a an honestly derived draw signs', verdict.signed === true);
  const groomed = Mage.groom(corpus.canaryAgent, corpus.registry, [
    'force.protect.3', 'force.project.1', 'force.reflect.2',
    'force.connect.1', 'sigma.mr.1', 'sigma.mc.2',
  ]); // the agent hand-picks the six declared-only probes it prepared for
  const v2 = Swordsman(corpus.registry).prove(groomed);
  check('G5b a hand-picked draw is draw-not-derivable-groomed', v2.signed === false && v2.reason === 'draw-not-derivable-groomed');
}

// G6 — registry binding: a draw against a thinned registry cannot pass off as
// a draw against the frozen one (the pool itself is committed).
{
  const thinned = corpus.registry.slice(0, 20);
  const candidate = Mage.propose(corpus.canaryAgent, thinned, 6);
  const verdict = Swordsman(corpus.registry).prove(candidate);
  check('G6 a draw over a thinned registry is registry-hash-mismatch', verdict.signed === false && verdict.reason === 'registry-hash-mismatch');
}

// G7 — canon binding: a draw claiming someone else's submission hash is refused.
{
  const candidate = Mage.propose(corpus.canaryAgent, corpus.registry, 6);
  candidate.draw.canonHash = 'e'.repeat(64);
  const verdict = Swordsman(corpus.registry).prove(candidate);
  check('G7 a swapped canonHash is canon-hash-mismatch', verdict.signed === false && verdict.reason === 'canon-hash-mismatch');
}

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
