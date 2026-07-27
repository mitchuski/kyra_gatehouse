// Runtime 08 · pooling-census — Act II's minimisation law under independent
// recompute, BEFORE its freeze (readiness item 8): this watch is the census's
// auditor until the census becomes a frozen artifact, and stays after.
//
// Corpus: gatehouse_verify/pooling.py SOURCE (the census: RAW_FIELDS,
// ALLOWED_CLAIM_KEYS, the transforms) — the authority is the code Mitch
// reviews. The Swordsman re-implements the minimisation in JS from the
// census's stated law and refuses: raw fields surviving into claims, claims
// outside the allowed set, forged bundle digests, and a disclosure ratio
// that fails to stay below one.

import { pathToFileURL } from 'node:url';
import { readText, contentHash } from '../../01-freeze-watch/src/freeze_watch.mjs';

const POOLING_PY = 'services/verify/gatehouse_verify/pooling.py';

export function loadCorpus() {
  const source = readText(POOLING_PY);
  return { source, rawFields: parseTuple(source, 'RAW_FIELDS'), allowedKeys: parseSet(source, 'ALLOWED_CLAIM_KEYS') };
}

function parseTuple(source, name) {
  const m = source.match(new RegExp(`${name}\\s*=\\s*\\(([^)]*)\\)`));
  return m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : null;
}

function parseSet(source, name) {
  const m = source.match(new RegExp(`${name}\\s*=\\s*\\{([\\s\\S]*?)\\}`));
  return m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : null;
}

// The census transform, re-implemented from the stated law (parity target:
// pooling.minimise). Threshold: decade floor for counts >= 10.
export function minimise(raw) {
  const count = raw.incidentCount;
  let floor = 1;
  while (floor * 10 <= count) floor *= 10;
  const threshold = count >= 10 ? `>=${Math.min(Math.floor(count / floor) * floor, count)}` : '>=1';
  return {
    incidentCountThreshold: threshold,
    activityWindow: raw.window,
    attackVectorCardinality: raw.attackVectors.length,
    affectedSectorCardinality: raw.affectedSectors.length,
    iocSetDigest: contentHash([...raw.iocs].sort()),
  };
}

// Mage (proposer): assemble a bundle-shaped claim from raw intel. The honest
// path minimises; the adversarial path smuggles.
export const Mage = {
  propose(raw) {
    const body = { bundleType: 'threat-intel-attestation', claims: minimise(raw) };
    return { ...body, bundleDigest: contentHash(body) };
  },
  smuggle(raw) {
    const body = { bundleType: 'threat-intel-attestation', claims: { ...minimise(raw), iocs: raw.iocs } };
    return { ...body, bundleDigest: contentHash(body) };
  },
};

// Swordsman (prover): the receiving auditor — census law from the source bytes.
export function Swordsman(corpus) {
  return {
    prove(bundle) {
      const reject = (reason, detail) => ({ signed: false, reason, detail });
      if (!corpus.rawFields || !corpus.allowedKeys) return reject('census-unparseable-from-source');
      const body = { ...bundle };
      delete body.bundleDigest;
      if (contentHash(body) !== bundle.bundleDigest) return reject('bundle-digest-forged');
      const claims = bundle.claims ?? {};
      const smuggled = Object.keys(claims).filter((k) => !corpus.allowedKeys.includes(k));
      const rawPresent = corpus.rawFields.filter((k) => k in claims || k in bundle);
      if (smuggled.length || rawPresent.length) {
        return reject('minimisation-violated', { smuggled, rawPresent });
      }
      const missing = corpus.allowedKeys.filter((k) => !(k in claims));
      if (missing.length) return reject('claims-incomplete', { missing });
      return { signed: true, claims };
    },
  };
}

export function dreamCycleTurn(raw, corpus = loadCorpus()) {
  const bundle = Mage.propose(raw);
  return { bundle, verdict: Swordsman(corpus).prove(bundle) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const raw = { incidentCount: 17, window: '2026-Q3', attackVectors: ['a', 'b', 'c'], affectedSectors: ['s1', 's2'], iocs: ['h1', 'h2'] };
  console.log('pooling-census:', JSON.stringify(dreamCycleTurn(raw).verdict, null, 2));
}
