// Runtime 02 · lattice-canon — the 64-vertex sovereignty lattice re-derived
// from first principles and folded against the repo's frozen constants.
//
// The Swordsman enumerates {0..63} itself: strata sizes by popcount, MSB-first
// bits, vertex from the six σ pairs under FD-1. The Mage proposes an
// assessment's sovereignty claims (vertex, bits, stratum, tier); the Swordsman
// re-derives each from the assessment's own sigma values and the harness
// source constants, never trusting the claimed numbers.
//
// Cross-corpus: when the external canon script is present on this machine
// (agentprivacy-lattice-coherence/scripts/lattice_coherence_audit.py), its
// dimension order is parsed and must agree — the same skipif discipline as
// guardrails/test_lattice_coherence.py.

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  repoRoot,
  readJson,
  readText,
  contentHash,
  parseSigmaBitOrder,
  parseStratumSizes,
  HARNESS_PY,
} from '../../01-freeze-watch/src/freeze_watch.mjs';

export const EXTERNAL_CANON = path.join(
  'C:\\Users\\mitch',
  'agentprivacy_master',
  'agentprivacy-skills',
  'agentprivacy-skills-v5',
  'meta',
  'agentprivacy-lattice-coherence',
  'scripts',
  'lattice_coherence_audit.py',
);

export const popcount = (v) => v.toString(2).split('1').length - 1;
export const bitsOf = (v) => v.toString(2).padStart(6, '0');

// First-principles enumeration: the seven strata of {0,1}^6 by popcount.
export function strataSizes() {
  const sizes = [0, 0, 0, 0, 0, 0, 0];
  for (let v = 0; v < 64; v++) sizes[popcount(v)]++;
  return sizes;
}

// Vertex from the six pairwise separations under a σ→bit order (FD-1).
export function vertexFromSigma(sigma, bitOrder, threshold) {
  let v = 0;
  for (const [pair, weight] of Object.entries(bitOrder)) {
    if (sigma[pair] >= threshold) v += weight;
  }
  return v;
}

export function loadCorpus() {
  const harnessSource = readText(HARNESS_PY);
  return {
    harnessSource,
    bitOrder: parseSigmaBitOrder(harnessSource),
    stratumSizes: parseStratumSizes(harnessSource),
    config: readJson(path.join('services', 'verify', 'gatehouse_verify', 'harness_config.json')),
    assessment: readJson(path.join('packages', 'contracts', 'testdata', 'canary-assessment.json')),
    externalCanonPresent: existsSync(EXTERNAL_CANON),
  };
}

// Parse the canonical (weight, name) pairs out of the external audit script's
// CANON_DIMENSIONS block — the same canon guardrails/test_lattice_coherence.py
// cross-checks against.
export function parseExternalDimensions() {
  if (!existsSync(EXTERNAL_CANON)) return null;
  const source = readFileSync(EXTERNAL_CANON, 'utf-8');
  const block = source.match(/CANON_DIMENSIONS\s*=\s*\[([\s\S]*?)\]/);
  if (!block) return null;
  const dims = [...block[1].matchAll(/\((\d+),\s*"(\w+)"\)/g)].map((m) => [Number(m[1]), m[2]]);
  return dims.length === 6 ? dims : null;
}

// Mage (proposer): lift an assessment's sovereignty section into a claim, each
// committing to an evidence digest over the parts the Swordsman will re-derive.
export const Mage = {
  propose(assessment) {
    const claim = {
      sigma: { ...assessment.sigma },
      vertex: assessment.sovereignty.vertex,
      bits: assessment.sovereignty.bits,
      bitOrder: [...assessment.sovereignty.bitOrder],
      stratum: assessment.stratum,
      tier: assessment.tier,
    };
    claim.evidenceDigest = contentHash({ sigma: claim.sigma, vertex: claim.vertex });
    return claim;
  },
};

// Swordsman (prover): re-derive vertex, bits, stratum, tier from the sigma
// values + harness-source FD-1, across the Gap.
export function Swordsman(corpus) {
  return {
    prove(claim) {
      const reject = (reason, detail) => ({ signed: false, reason, detail });
      if (!corpus.bitOrder) return reject('fd1-unparseable-from-source');

      const digest = contentHash({ sigma: claim.sigma, vertex: claim.vertex });
      if (digest !== claim.evidenceDigest) return reject('evidence-digest-mismatch');

      const derivedVertex = vertexFromSigma(claim.sigma, corpus.bitOrder, corpus.config.sigma_threshold);
      if (derivedVertex !== claim.vertex) {
        return reject('vertex-not-derivable-from-sigma', { derived: derivedVertex, claimed: claim.vertex });
      }
      if (bitsOf(claim.vertex) !== claim.bits) {
        return reject('bits-vertex-mismatch', { derived: bitsOf(claim.vertex), claimed: claim.bits });
      }
      if (popcount(claim.vertex) !== claim.stratum) {
        return reject('stratum-not-popcount', { derived: popcount(claim.vertex), claimed: claim.stratum });
      }
      if (claim.tier !== claim.stratum) {
        return reject('tier-not-stratum', { tier: claim.tier, stratum: claim.stratum });
      }

      // The claimed dimension order must be the canon, weight-descending.
      const canonNames = ['Protection', 'Delegation', 'Memory', 'Connection', 'Computation', 'Value'];
      if (JSON.stringify(claim.bitOrder) !== JSON.stringify(canonNames)) {
        return reject('bit-order-drift', { claimed: claim.bitOrder });
      }

      return { signed: true, vertex: claim.vertex, stratum: claim.stratum, digest };
    },
  };
}

export function dreamCycleTurn(corpus = loadCorpus()) {
  const claim = Mage.propose(corpus.assessment);
  const verdict = Swordsman(corpus).prove(claim);
  return { corpus, claim, verdict };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { corpus, verdict } = dreamCycleTurn();
  console.log('lattice-canon:', JSON.stringify({ strata: strataSizes(), fd1: corpus.bitOrder, verdict }, null, 2));
  process.exit(verdict.signed ? 0 : 1);
}
