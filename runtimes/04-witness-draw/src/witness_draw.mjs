// Runtime 04 · witness-draw — the Gap's anti-grooming mechanism re-derived.
//
// sha256-canon-v1, counter-mode: index_i = sha256(canonHashBytes || uint32BE(i))
// mod remaining, sampling without replacement from the lexicographically sorted
// probe ids. The agent seeds the draw with its OWN canonicalised submission —
// it cannot know which probes will be probed while it writes.
//
// The Mage here plays the GROOMING agent: it proposes draws, including
// hand-picked ones. The Swordsman is the auditor who re-derives the draw from
// the persisted canon hash + registry and refuses every draw that does not
// follow from the bytes. Parity target: gatehouse_contracts/witness.py.

import { createHash } from 'node:crypto';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readJson, contentHash } from '../../01-freeze-watch/src/freeze_watch.mjs';

export const ALGORITHM = 'sha256-canon-v1';

// Parity with witness.witness_draw.
export function witnessDraw(submission, registry, k) {
  const ids = registry.map((p) => p.id).sort();
  if (k < 0 || k > ids.length) throw new Error(`cannot draw ${k} from ${ids.length}`);
  const canonHash = contentHash(submission);
  const seed = Buffer.from(canonHash, 'hex');
  const drawn = [];
  const pool = [...ids];
  for (let i = 0; i < k; i++) {
    const counter = Buffer.alloc(4);
    counter.writeUInt32BE(i);
    const digest = createHash('sha256').update(Buffer.concat([seed, counter])).digest('hex');
    const idx = Number(BigInt(`0x${digest}`) % BigInt(pool.length));
    drawn.push(pool.splice(idx, 1)[0]);
  }
  return {
    canonHash,
    registryHash: contentHash({ version: 1, ids }),
    algorithm: ALGORITHM,
    drawnProbeIds: drawn,
  };
}

export function loadCorpus() {
  const registry = readJson(path.join('packages', 'contracts', 'probes', 'registry.json')).probes;
  return {
    registry,
    config: readJson(path.join('services', 'verify', 'gatehouse_verify', 'harness_config.json')),
    canaryAgent: readJson(path.join('packages', 'contracts', 'testdata', 'canary-agent.json')),
    goldenDraw: readJson(path.join('packages', 'contracts', 'testdata', 'canary-assessment.json')).witnessDraw,
  };
}

// Mage (proposer, here the would-be groomer): submit + claim a draw. An honest
// Mage derives it; a grooming Mage hand-picks the probes it prepared for.
export const Mage = {
  propose(submission, registry, k) {
    return { submission, draw: witnessDraw(submission, registry, k) };
  },
  groom(submission, registry, pickedIds) {
    const ids = registry.map((p) => p.id).sort();
    return {
      submission,
      draw: {
        canonHash: contentHash(submission),
        registryHash: contentHash({ version: 1, ids }),
        algorithm: ALGORITHM,
        drawnProbeIds: pickedIds,
      },
    };
  },
};

// Swordsman (auditor): re-derive the draw from the submission + registry bytes.
// Never trusts the claimed probe list — that is the whole mechanism.
export function Swordsman(registry) {
  return {
    prove({ submission, draw }) {
      const reject = (reason) => ({ signed: false, reason });
      if (draw.algorithm !== ALGORITHM) return reject('unknown-algorithm');
      if (draw.canonHash !== contentHash(submission)) return reject('canon-hash-mismatch');
      const ids = registry.map((p) => p.id).sort();
      if (draw.registryHash !== contentHash({ version: 1, ids })) return reject('registry-hash-mismatch');
      const fresh = witnessDraw(submission, registry, draw.drawnProbeIds.length);
      if (JSON.stringify(fresh.drawnProbeIds) !== JSON.stringify(draw.drawnProbeIds)) {
        return reject('draw-not-derivable-groomed');
      }
      return { signed: true, draw };
    },
  };
}

export function dreamCycleTurn(submission, registry, k) {
  const candidate = Mage.propose(submission, registry, k);
  const verdict = Swordsman(registry).prove(candidate);
  return { candidate, verdict };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const corpus = loadCorpus();
  const { verdict } = dreamCycleTurn(corpus.canaryAgent, corpus.registry, 6);
  console.log('witness-draw:', JSON.stringify(verdict, null, 2));
  process.exit(verdict.signed ? 0 : 1);
}
