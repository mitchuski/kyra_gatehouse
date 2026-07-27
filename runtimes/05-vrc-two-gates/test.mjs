// Property tests for the two-gates ceremony. Run: node test.mjs — exits nonzero on FAIL.
import {
  Mage,
  Swordsman,
  dreamCycleTurn,
  loadCorpus,
  VERDICT_TO_DECISION,
  GATE_SUPERVISOR,
} from './src/vrc_two_gates.mjs';

let passed = 0;
let failed = 0;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
function check(name, cond) {
  if (cond) { passed++; console.log(`  ${green('PASS')} ${name}`); }
  else { failed++; console.log(`  ${red('FAIL')} ${name}`); }
}

console.log('\nruntime 05 · vrc-two-gates — the bilateral ceremony proven at the gate\n');

const corpus = loadCorpus();

// G1 — the canary ceremony signs: both gates, bilateral, ledger-anchored, fly.
{
  const { verdict } = dreamCycleTurn(corpus);
  check('G1 the canary VRC signs and flies at tier 6', verdict.signed === true && verdict.decision === 'fly' && verdict.tier === 6);
}

// G2 — one gate is never enough (rule 5, stated twice on purpose in CLAUDE.md).
{
  const { vrc } = dreamCycleTurn(corpus);
  const supervisorOnly = structuredClone(vrc);
  supervisorOnly.evidence[1].type = GATE_SUPERVISOR; // two approvals, no understanding
  const v1 = Swordsman(corpus.chain).prove(supervisorOnly);
  check('G2a two approvals without understanding are refused', v1.signed === false && v1.reason === 'missing-understanding-gate');
  const challengeOnly = structuredClone(vrc);
  challengeOnly.evidence[0].type = 'UnderstandingChallengeAttempt';
  const v2 = Swordsman(corpus.chain).prove(challengeOnly);
  check('G2b understanding without approval is refused', v2.signed === false && v2.reason === 'missing-supervisor-gate');
}

// G3 — bilaterality: unforgeable alone.
{
  const { vrc } = dreamCycleTurn(corpus);
  const single = structuredClone(vrc);
  single.proof = [single.proof[0]];
  const v1 = Swordsman(corpus.chain).prove(single);
  check('G3a a single-signature credential is not-bilateral', v1.signed === false && v1.reason === 'not-bilateral');
  const selfSigned = structuredClone(vrc);
  selfSigned.proof[1].verificationMethod = selfSigned.proof[0].verificationMethod;
  const v2 = Swordsman(corpus.chain).prove(selfSigned);
  check('G3b both proofs from one party is self-signed', v2.signed === false && v2.reason === 'self-signed-not-bilateral');
  const schema = corpus.vrcSchema.properties.proof;
  check('G3c the frozen schema pins the same rule (minItems=maxItems=2)', schema.minItems === 2 && schema.maxItems === 2);
}

// G4 — evidence must anchor in the verified ledger: a forged hash is refused.
{
  const { vrc } = dreamCycleTurn(corpus);
  const forged = structuredClone(vrc);
  forged.evidence[1].auditEventHash = 'd'.repeat(64);
  const v = Swordsman(corpus.chain).prove(forged);
  check('G4a evidence outside the ledger is refused', v.signed === false && v.reason === 'evidence-not-in-ledger');
  const brokenChain = structuredClone(corpus.chain);
  brokenChain[1].rationale = 'rewritten after the fact';
  const v2 = Swordsman(brokenChain).prove(vrc);
  check('G4b a broken ledger voids the ceremony entirely', v2.signed === false && v2.reason === 'ledger-does-not-verify');
}

// G5 — the verdict lexicon is closed: never a third vocabulary.
{
  check('G5a the lexicon is exactly fly/sandbox/hold', JSON.stringify(VERDICT_TO_DECISION) === JSON.stringify({ VALIDATED: 'fly', MIRAGE: 'sandbox', BLOCKED: 'hold' }));
  const { vrc } = dreamCycleTurn(corpus);
  const invented = structuredClone(vrc);
  invented.verdict = 'APPROVED';
  invented.decision = 'launch';
  const v1 = Swordsman(corpus.chain).prove(invented);
  check('G5b an invented verdict is refused', v1.signed === false && v1.reason === 'unknown-verdict');
  const drifted = structuredClone(vrc);
  drifted.verdict = 'MIRAGE';
  drifted.decision = 'fly'; // a mirage that claims flight
  const v2 = Swordsman(corpus.chain).prove(drifted);
  check('G5c a mirage claiming flight is lexicon drift', v2.signed === false && v2.reason === 'decision-lexicon-drift');
}

// G6 — collapsed sovereignty: det(Σ) ≤ 0 ⇒ BLOCKED ⇒ hold ⇒ NO credential,
// even with both gates passed and both signatures ready.
{
  const collapsed = structuredClone(corpus.assessment);
  collapsed.detSigma = -0.2;
  const vrc = Mage.propose(collapsed, corpus.chain, {
    approvalEvent: corpus.chain[2].contentHash,
    challengeEvent: corpus.chain[1].contentHash,
    verdict: 'BLOCKED',
  });
  const v1 = Swordsman(corpus.chain).prove(vrc);
  check('G6a a collapsed pair holds deployment: no issuance', v1.signed === false && v1.reason === 'blocked-no-issuance');
  const lying = structuredClone(vrc);
  lying.verdict = 'VALIDATED';
  lying.decision = 'fly'; // collapsed det pretending to be validated
  const v2 = Swordsman(corpus.chain).prove(lying);
  check('G6b a collapsed pair claiming VALIDATED is forced to BLOCKED', v2.signed === false && v2.reason === 'collapsed-pair-must-block');
}

// G7 — tier IS the stratum, in the credential too.
{
  const { vrc } = dreamCycleTurn(corpus);
  const flattered = structuredClone(vrc);
  flattered.tier = 7; // no seventh gate above the lattice
  const v = Swordsman(corpus.chain).prove(flattered);
  check('G7 a flattering tier is tier-stratum-mismatch', v.signed === false && v.reason === 'tier-stratum-mismatch');
}

console.log(`\n  ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
