// Property tests for site coherence. Run: node test.mjs — exits nonzero on FAIL.
import {
  Mage,
  Swordsman,
  dreamCycleTurn,
  loadCorpus,
  guideGraph,
  countChecks,
  danglingSources,
  PAGES,
} from './src/site_coherence.mjs';

let passed = 0;
let failed = 0;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
function check(name, cond) {
  if (cond) { passed++; console.log(`  ${green('PASS')} ${name}`); }
  else { failed++; console.log(`  ${red('FAIL')} ${name}`); }
}

console.log('\nruntime 09 · site-coherence — the site\'s own claims under audit\n');

const corpus = loadCorpus();

// G1 — the live site signs whole: nav resolves, lockup present, guide sound,
// numbers honest, sources real.
{
  const { verdict } = dreamCycleTurn(corpus);
  check('G1a the site signs under audit', verdict.signed === true);
  check('G1b all six pages loaded', Object.keys(corpus.html).length === PAGES.length);
  check('G1c the guide carries its full lineup', (verdict.guidePages ?? 0) >= 15);
}

// G2 — the guide graph: every wiki-link lands, every page reachable from welcome.
{
  const g = guideGraph(corpus.html['guide.html']);
  const allTargets = Object.values(g.links).flat();
  check('G2a every [[link]] resolves to a page', allTargets.every((t) => g.slugs.includes(t)));
  check('G2b the welcome page exists and links onward', g.slugs.includes('welcome-visitors') && g.links['welcome-visitors'].length > 0);
}

// G3 — the numbers watch: suite counts recompute and match the landing + evidence.
{
  const counted = countChecks();
  check('G3a suite counting finds all three lanes', counted.pytest > 0 && counted.vitest > 0 && counted.runtimes > 0);
  const claim = Mage.propose(corpus);
  check('G3b the landing states the true total', claim.claimedTotal === counted.total);
  check('G3c the evidence page states true lane counts', JSON.stringify(claim.claimedLanes) === JSON.stringify({ pytest: counted.pytest, vitest: counted.vitest, runtimes: counted.runtimes }));
}

// G4 — adversarial: a broken nav link, a dangling guide link, and a drifted
// number are each caught in a mutated corpus copy.
{
  const brokenNav = { html: { ...corpus.html, 'demo.html': corpus.html['demo.html'].replace('evidence.html', 'missing-page.html') } };
  const v1 = Swordsman(brokenNav).prove(Mage.propose(brokenNav));
  check('G4a a broken nav link is caught', v1.signed === false && v1.reason === 'nav-target-missing');

  const brokenGuide = { html: { ...corpus.html, 'guide.html': corpus.html['guide.html'].replace('[[The Ceremony]]', '[[The Ceremony That Is Not]]') } };
  const v2 = Swordsman(brokenGuide).prove(Mage.propose(brokenGuide));
  check('G4b a dangling guide link is caught', v2.signed === false && v2.reason === 'guide-link-dangling');

  const drifted = { html: { ...corpus.html, 'index.html': corpus.html['index.html'].replace(/<b>\d+<\/b><span>checks green/, '<b>9999</b><span>checks green') } };
  const v3 = Swordsman(drifted).prove(Mage.propose(drifted));
  check('G4c a drifted check-count is caught', v3.signed === false && v3.reason === 'landing-check-count-drift');
}

// G5 — the brand lockup: a page without KYRA GATE is caught.
{
  const unbranded = { html: { ...corpus.html, 'mathematics.html': corpus.html['mathematics.html'].replace(/KYRA GATE/g, 'SOME GATE') } };
  const v = Swordsman(unbranded).prove(Mage.propose(unbranded));
  check('G5 a missing brand lockup is caught', v.signed === false && v.reason === 'brand-lockup-missing');
}

// G6 — evidence sources: the real page has none dangling; a fabricated one is caught.
{
  check('G6a no dangling source references on the evidence page', danglingSources(corpus.html['evidence.html']).length === 0);
  const fabricated = corpus.html['evidence.html'].replace('</table>', '<tr><td>x</td><td>x</td><td><code>services/verify/no_such_module.py</code></td></tr></table>');
  check('G6b a fabricated source reference is caught', danglingSources(fabricated).length === 1);
}

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
