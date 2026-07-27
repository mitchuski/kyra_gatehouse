// Runtime 03 · canon-chain — the audit ledger's same-bytes-same-hash discipline
// re-derived in a third lane (after canon.py and the vitest spec), zero-dep.
//
// The Mage proposes chain extensions (the smallest event); the Swordsman
// re-derives the contentHash from the event's own body across the Gap and
// refuses any event whose hash or lineage does not recompute. The golden
// chains are the corpus; the tampered twin must always be caught.
//
// DECLARED SEAM (signed, not hidden): integer-valued floats. Python canonical
// bytes render 1.0 as "1.0"; JSON.parse collapses it to 1 and JS renders "1".
// Payloads containing such floats (the canary assessment) therefore hash
// differently across languages. The chain itself is immune — event bodies
// carry digests as strings — and the seam is pinned by an explicit witness
// check (G6) so it can never silently widen.

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  readJson,
  contentHash,
  canonicalJson,
} from '../../01-freeze-watch/src/freeze_watch.mjs';

export const GENESIS_HASH = '0'.repeat(64);
const TESTDATA = path.join('packages', 'contracts', 'testdata');

// Parity with canon.audit_event_hash: hash the event without its contentHash.
export function auditEventHash(event) {
  const { contentHash: _drop, ...body } = event;
  return contentHash(body);
}

// Parity with canon.verify_chain: violations list, empty = valid.
export function verifyChain(events) {
  const violations = [];
  let prior = GENESIS_HASH;
  events.forEach((event, i) => {
    const expected = auditEventHash(event);
    if (event.contentHash !== expected) violations.push(`event[${i}]: contentHash forged`);
    if (event.priorHash !== prior) violations.push(`event[${i}]: broken lineage`);
    prior = event.contentHash ?? expected;
  });
  return violations;
}

export function loadCorpus() {
  return {
    chainValid: readJson(path.join(TESTDATA, 'audit-chain-valid.json')),
    chainTampered: readJson(path.join(TESTDATA, 'audit-chain-tampered.json')),
    canaryAgent: readJson(path.join(TESTDATA, 'canary-agent.json')),
    canaryAssessment: readJson(path.join(TESTDATA, 'canary-assessment.json')),
  };
}

// Mage (proposer): extend a chain by the smallest event, committing to a
// contentHash the Swordsman never trusts.
export const Mage = {
  propose(chain, { action, actor, subject, payload, rationale, timestamp }) {
    const body = {
      actor,
      action,
      subject,
      payloadDigest: contentHash(payload),
      priorHash: chain.length ? chain[chain.length - 1].contentHash : GENESIS_HASH,
      timestamp,
      rationale,
    };
    return { ...body, contentHash: contentHash(body) };
  },
};

// Swordsman (prover): recompute hash and lineage across the Gap before the
// event may join the ledger.
export function Swordsman(chain) {
  return {
    prove(event) {
      const reject = (reason) => ({ signed: false, reason });
      if (!event.rationale) return reject('rationale-required');
      const expected = auditEventHash(event);
      if (event.contentHash !== expected) return reject('content-hash-forged');
      const prior = chain.length ? chain[chain.length - 1].contentHash : GENESIS_HASH;
      if (event.priorHash !== prior) return reject('lineage-broken');
      return { signed: true, event };
    },
  };
}

// One turn: propose the smallest event, prove it, and the ledger advances by
// exactly one entry only on a signature.
export function dreamCycleTurn(chain, fields) {
  const candidate = Mage.propose(chain, fields);
  const verdict = Swordsman(chain).prove(candidate);
  if (verdict.signed) chain.push(verdict.event);
  return { grew: verdict.signed === true, ...verdict };
}

export { contentHash, canonicalJson };

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const corpus = loadCorpus();
  const report = {
    valid: verifyChain(corpus.chainValid),
    tampered: verifyChain(corpus.chainTampered),
  };
  console.log('canon-chain:', JSON.stringify(report, null, 2));
  process.exit(report.valid.length === 0 && report.tampered.length > 0 ? 0 : 1);
}
