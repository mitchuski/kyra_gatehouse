// Property tests for the freeze watch. Run: node test.mjs — exits nonzero on FAIL.
import {
  Mage,
  Swordsman,
  dreamCycleTurn,
  loadCorpus,
  contentHash,
  fileByteHash,
} from './src/freeze_watch.mjs';

let passed = 0;
let failed = 0;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
function check(name, cond) {
  if (cond) { passed++; console.log(`  ${green('PASS')} ${name}`); }
  else { failed++; console.log(`  ${red('FAIL')} ${name}`); }
}

console.log('\nruntime 01 · freeze-watch — contracts-v1 under independent recompute\n');

const corpus = loadCorpus();
const before = corpus.watchedFiles.map((f) => [f, fileByteHash(f)]);

// G1 — the real manifest signs whole: every leaf re-derived from repo bytes.
{
  const { verdict } = dreamCycleTurn(corpus);
  check('G1a the frozen manifest signs under recompute', verdict.signed === true);
  check('G1b all 8 schemas + registry + interface are leaves', verdict.leafCount === 10);
  check(
    'G1c the signed root is the chronicled contracts-v1 root',
    verdict.rootHash === '0c5df80799dc49b4aae602b37cfe29935f4b3115f11ee527c9457262434908eb',
  );
}

// G2 — a mutated schema is caught: one byte of drift moves the leaf and the root.
{
  const mutated = structuredClone(corpus);
  mutated.schemas['vrc.schema.json'].properties.proof.minItems = 1; // unilateral forgery
  const verdict = Swordsman(mutated).prove(Mage.propose(corpus.manifest));
  check('G2 a post-freeze schema mutation is schema-hash-drift', verdict.signed === false && verdict.reason === 'schema-hash-drift');
}

// G3 — a mutated probe registry is caught.
{
  const mutated = structuredClone(corpus);
  mutated.registry.probes.pop();
  const verdict = Swordsman(mutated).prove(Mage.propose(corpus.manifest));
  check('G3 a dropped probe is registry-hash-drift', verdict.signed === false && verdict.reason === 'registry-hash-drift');
}

// G4 — the Gap: a forged root is rejected even when every leaf is honest.
{
  const claim = Mage.propose(corpus.manifest);
  claim.rootHash = 'f'.repeat(64);
  const verdict = Swordsman(corpus).prove(claim);
  check('G4 a forged root is rejected across the Gap', verdict.signed === false && verdict.reason === 'root-forged');
}

// G5 — FD-1 authority is the harness SOURCE: a manifest claiming a different
// σ→bit table than harness.py is rejected (the one decision Mitch confirms).
{
  const claim = Mage.propose(corpus.manifest);
  claim.fd1SigmaBitOrder = { ...claim.fd1SigmaBitOrder, sm: 1, sc: 32 }; // swap Protection↔Value
  const verdict = Swordsman(corpus).prove(claim);
  check('G5 FD-1 drift from harness.py source is rejected', verdict.signed === false && verdict.reason === 'fd1-drift-from-harness-source');
}

// G6 — a forged interface hash is rejected (hash must re-derive from the
// embedded interface object).
{
  const claim = Mage.propose(corpus.manifest);
  claim.harnessInterfaceHash = 'a'.repeat(64);
  const verdict = Swordsman(corpus).prove(claim);
  check('G6 a forged interface hash is rejected', verdict.signed === false && verdict.reason === 'interface-hash-forged');
}

// G7 — canonical bytes are order-invariant: shuffled keys, same hash.
{
  const reversed = Object.fromEntries(Object.entries(corpus.registry).reverse());
  check('G7 key order never moves the canonical hash', contentHash(reversed) === contentHash(corpus.registry));
}

// G8 — read-only over the frozen artifacts: byte-hash before/after.
{
  const after = corpus.watchedFiles.map((f) => [f, fileByteHash(f)]);
  check('G8 the watch reads and never writes (byte-hash unchanged)', JSON.stringify(before) === JSON.stringify(after));
}

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
