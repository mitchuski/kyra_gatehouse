// Runtime 05 · vrc-two-gates — the credential ceremony as a dream-agent cycle.
// Direct descendant of dtgwg-zkp-tf-mage/runtimes/07-trust-graph-formation:
// there the fold minted trust-graph edges on personhood + mutual consent; here
// it minted-checks the Gatehouse VRC on the TWO GATES (CLAUDE.md rule 5) —
// a supervisor approval AND a passed understanding challenge — bilaterally
// signed, every evidence hash resolving into a verified audit chain.
//
// The Mage proposes the smallest credential; the Swordsman proves it before
// signing: both gates present, exactly two proofs from two distinct parties,
// evidence anchored in the ledger, tier == stratum, and the verdict lexicon
// VALIDATED→fly / MIRAGE→sandbox / BLOCKED→hold with no third vocabulary.
// det(Σ) ≤ 0 or non-PSD ⇒ BLOCKED ⇒ hold: no credential issues at all.

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readJson } from '../../01-freeze-watch/src/freeze_watch.mjs';
import { verifyChain } from '../../03-canon-chain/src/canon_chain.mjs';

export const VERDICT_TO_DECISION = { VALIDATED: 'fly', MIRAGE: 'sandbox', BLOCKED: 'hold' };
export const GATE_SUPERVISOR = 'SupervisorApproval';
export const GATE_UNDERSTANDING = 'UnderstandingChallengeAttempt';
// TSP framing (harness constants): the ceremony is a relationship formation
// between two VIDs — the issuer role and the subject role must both sign.
export const TSP_ROLE_SUPERVISOR = 'tsp:relationship:issuer';
export const TSP_ROLE_AGENT = 'tsp:relationship:subject';

export function loadCorpus() {
  return {
    chain: readJson(path.join('packages', 'contracts', 'testdata', 'audit-chain-valid.json')),
    assessment: readJson(path.join('packages', 'contracts', 'testdata', 'canary-assessment.json')),
    vrcSchema: readJson(path.join('packages', 'contracts', 'schema', 'vrc.schema.json')),
  };
}

// Mage (proposer): the smallest well-formed credential for an assessment whose
// gates both passed, evidence pointing at the chain events that witnessed them.
export const Mage = {
  propose(assessment, chain, { approvalEvent, challengeEvent, verdict }) {
    return {
      issuer: assessment.supervisor,
      subject: assessment.agent,
      tier: assessment.tier,
      stratum: assessment.stratum,
      detSigma: assessment.detSigma,
      psd: assessment.psd,
      verdict,
      decision: VERDICT_TO_DECISION[verdict] ?? verdict,
      evidence: [
        { type: GATE_SUPERVISOR, auditEventHash: approvalEvent },
        { type: GATE_UNDERSTANDING, auditEventHash: challengeEvent },
      ],
      proof: [
        { role: TSP_ROLE_SUPERVISOR, verificationMethod: `${assessment.supervisor}#k1` },
        { role: TSP_ROLE_AGENT, verificationMethod: `${assessment.agent}#k1` },
      ],
    };
  },
};

// Swordsman (prover): the gatekeeper. Proves every rule of the ceremony from
// the candidate's own parts + the verified ledger; never trusts the Mage.
export function Swordsman(chain) {
  return {
    prove(vrc) {
      const reject = (reason, detail) => ({ signed: false, reason, detail });

      // 0. the ledger the evidence points into must itself verify
      if (verifyChain(chain).length > 0) return reject('ledger-does-not-verify');

      // 1. collapsed sovereignty blocks BEFORE any gate is even weighed:
      //    multiplicative gating takes total value to zero (CLAUDE.md).
      if (vrc.detSigma <= 0 || !vrc.psd) {
        if (vrc.verdict !== 'BLOCKED' || vrc.decision !== 'hold') {
          return reject('collapsed-pair-must-block');
        }
        return reject('blocked-no-issuance'); // a held agent gets no credential at all
      }

      // 2. the verdict lexicon is closed: never a third vocabulary
      if (!(vrc.verdict in VERDICT_TO_DECISION)) return reject('unknown-verdict', { verdict: vrc.verdict });
      if (vrc.decision !== VERDICT_TO_DECISION[vrc.verdict]) return reject('decision-lexicon-drift');

      // 3. BOTH gates, distinct kinds (rule 5: approval + understanding)
      const kinds = new Set(vrc.evidence.map((e) => e.type));
      if (!kinds.has(GATE_SUPERVISOR)) return reject('missing-supervisor-gate');
      if (!kinds.has(GATE_UNDERSTANDING)) return reject('missing-understanding-gate');

      // 4. every evidence hash resolves to an event in the verified ledger
      const ledgerHashes = new Set(chain.map((e) => e.contentHash));
      for (const e of vrc.evidence) {
        if (!ledgerHashes.has(e.auditEventHash)) return reject('evidence-not-in-ledger', { hash: e.auditEventHash });
      }

      // 5. bilateral: exactly two proofs, issuer and subject, distinct parties
      if (!Array.isArray(vrc.proof) || vrc.proof.length !== 2) return reject('not-bilateral');
      const roles = new Set(vrc.proof.map((p) => p.role));
      if (!roles.has(TSP_ROLE_SUPERVISOR) || !roles.has(TSP_ROLE_AGENT)) return reject('roles-not-spanning');
      const parties = new Set(vrc.proof.map((p) => p.verificationMethod.split('#')[0]));
      if (parties.size !== 2) return reject('self-signed-not-bilateral');

      // 6. tier IS the stratum
      if (vrc.tier !== vrc.stratum) return reject('tier-stratum-mismatch');

      return { signed: true, decision: vrc.decision, tier: vrc.tier };
    },
  };
}

export function dreamCycleTurn(corpus = loadCorpus(), overrides = {}) {
  const vrc = Mage.propose(corpus.assessment, corpus.chain, {
    approvalEvent: corpus.chain[2].contentHash,
    challengeEvent: corpus.chain[1].contentHash,
    verdict: 'VALIDATED',
    ...overrides,
  });
  const verdict = Swordsman(corpus.chain).prove(vrc);
  return { corpus, vrc, verdict };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { verdict } = dreamCycleTurn();
  console.log('vrc-two-gates:', JSON.stringify(verdict, null, 2));
  process.exit(verdict.signed ? 0 : 1);
}
