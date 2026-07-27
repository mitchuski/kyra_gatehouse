// Property tests for the canon chain. Run: node test.mjs — exits nonzero on FAIL.
import {
  Mage,
  Swordsman,
  dreamCycleTurn,
  loadCorpus,
  verifyChain,
  auditEventHash,
  contentHash,
  GENESIS_HASH,
} from './src/canon_chain.mjs';

let passed = 0;
let failed = 0;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
function check(name, cond) {
  if (cond) { passed++; console.log(`  ${green('PASS')} ${name}`); }
  else { failed++; console.log(`  ${red('FAIL')} ${name}`); }
}

console.log('\nruntime 03 · canon-chain — same bytes, same hash, third lane\n');

const corpus = loadCorpus();

// G1 — the golden chain verifies whole from genesis in this lane too.
{
  check('G1a the valid chain has zero violations', verifyChain(corpus.chainValid).length === 0);
  check('G1b the chain roots at the 64-zero genesis', corpus.chainValid[0].priorHash === GENESIS_HASH);
}

// G2 — the tampered twin is always caught (the re-rolled draw rationale).
{
  const violations = verifyChain(corpus.chainTampered);
  check('G2 the tampered chain is detected', violations.some((v) => v.includes('event[1]') && v.includes('forged')));
}

// G3 — cross-file payload binding: event digests re-derive from the payloads
// themselves (float-free payloads; the float seam is G6).
{
  check('G3a gate.approach payloadDigest == contentHash(canary-agent.json)', corpus.chainValid[0].payloadDigest === contentHash(corpus.canaryAgent));
  check('G3b witness_drawn payloadDigest == contentHash(assessment.witnessDraw)', corpus.chainValid[1].payloadDigest === contentHash(corpus.canaryAssessment.witnessDraw));
}

// G4 — the Gap: a forged contentHash is rejected; a signed event extends the
// ledger by exactly one.
{
  const chain = structuredClone(corpus.chainValid);
  const fields = {
    action: 'vrc.issued',
    actor: corpus.chainValid[0].actor,
    subject: corpus.chainValid[0].subject,
    payload: { note: 'runtime-03 fold' },
    rationale: 'dream-cycle extension for the fold',
    timestamp: '2026-07-17T00:00:00Z',
  };
  const forged = Mage.propose(chain, fields);
  forged.contentHash = 'f'.repeat(64);
  const v1 = Swordsman(chain).prove(forged);
  check('G4a a forged contentHash is rejected across the Gap', v1.signed === false && v1.reason === 'content-hash-forged');
  check('G4b a bare proposal does not touch the ledger', chain.length === 3);
  const r = dreamCycleTurn(chain, fields);
  check('G4c a signed event advances the ledger by one', r.grew === true && chain.length === 4 && verifyChain(chain).length === 0);
}

// G5 — lineage: an event chained to the wrong prior is rejected; rationale is
// mandatory (no unexplained state transitions, CLAUDE.md rule 4).
{
  const chain = structuredClone(corpus.chainValid);
  const orphan = Mage.propose(chain.slice(0, 1), {
    action: 'gate.approach',
    actor: chain[0].actor,
    subject: chain[0].subject,
    payload: { replay: true },
    rationale: 'chained to a stale prior',
    timestamp: '2026-07-17T00:00:00Z',
  });
  const v1 = Swordsman(chain).prove(orphan);
  check('G5a a stale priorHash is lineage-broken', v1.signed === false && v1.reason === 'lineage-broken');
  const mute = Mage.propose(chain, { ...orphan, payload: {}, rationale: '', timestamp: orphan.timestamp });
  const v2 = Swordsman(chain).prove(mute);
  check('G5b an event without rationale is refused', v2.signed === false && v2.reason === 'rationale-required');
}

// G6 — the DECLARED float seam, pinned as a witness: Python hashed the canary
// assessment with 1.0-valued floats; this lane's recompute of the same parsed
// file MUST differ. If this check ever flips, the seam has silently closed (or
// the vector changed) and the cross-language canon contract must be re-read.
{
  check('G6 integer-float seam witness: JS recompute of assessment payload differs from Python digest', corpus.chainValid[2].payloadDigest !== contentHash(corpus.canaryAssessment));
}

// G7 — determinism: same bytes, same hash; reordered keys, same hash; one
// mutated byte, different hash.
{
  const event = corpus.chainValid[0];
  const reordered = Object.fromEntries(Object.entries(event).reverse());
  check('G7a key order never moves an event hash', auditEventHash(reordered) === auditEventHash(event));
  const mutated = { ...event, rationale: event.rationale + '.' };
  check('G7b one mutated byte moves the hash', auditEventHash(mutated) !== auditEventHash(event));
}

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
