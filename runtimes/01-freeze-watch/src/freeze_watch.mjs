// Runtime 01 · freeze-watch — a Mage⊥Swordsman fold over the contracts freeze.
//
// The Mage proposes the freeze manifest's claims (leaf hashes, FD-1 table,
// interface hash, merkle root); the Swordsman re-derives every claim from the
// repo bytes themselves — schemas, probe registry, and the harness.py SOURCE
// TEXT — and signs only what survives the recompute. Third lane after pytest
// (canon.py) and vitest (ajv): zero-dep node:crypto, no shared code with either.
//
// This runtime is an auditor over frozen artifacts. It mints nothing, writes
// nothing, and takes no door actions (re-freeze is Mitch's act at the tag).
//
// Canon parity note: canonical JSON here = recursive sorted keys, no
// whitespace, UTF-8 — byte-parity with gatehouse_contracts.canon for all
// float-free values. Integer-valued floats (1.0) are a declared cross-language
// seam owned by runtime 03; no freeze leaf contains one.

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

export function canonicalJson(obj) {
  if (Array.isArray(obj)) return `[${obj.map(canonicalJson).join(',')}]`;
  if (obj !== null && typeof obj === 'object') {
    const entries = Object.entries(obj)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(obj);
}

export const sha256Hex = (s) => createHash('sha256').update(s, 'utf-8').digest('hex');
export const contentHash = (obj) => sha256Hex(canonicalJson(obj));
export const readJson = (rel) => JSON.parse(readFileSync(path.join(repoRoot, rel), 'utf-8'));
export const readText = (rel) => readFileSync(path.join(repoRoot, rel), 'utf-8');
export const fileByteHash = (rel) =>
  createHash('sha256').update(readFileSync(path.join(repoRoot, rel))).digest('hex');

const SCHEMA_DIR = path.join('packages', 'contracts', 'schema');
const REGISTRY = path.join('packages', 'contracts', 'probes', 'registry.json');
const MANIFEST = path.join('packages', 'contracts', 'CONTRACTS_FROZEN.json');
export const HARNESS_PY = path.join('services', 'verify', 'gatehouse_verify', 'harness.py');

export function loadCorpus() {
  const schemaFiles = readdirSync(path.join(repoRoot, SCHEMA_DIR))
    .filter((f) => f.endsWith('.schema.json'))
    .sort();
  return {
    schemaFiles,
    schemas: Object.fromEntries(schemaFiles.map((f) => [f, readJson(path.join(SCHEMA_DIR, f))])),
    registry: readJson(REGISTRY),
    manifest: readJson(MANIFEST),
    harnessSource: readText(HARNESS_PY),
    watchedFiles: [
      ...schemaFiles.map((f) => path.join(SCHEMA_DIR, f)),
      REGISTRY,
      MANIFEST,
      HARNESS_PY,
    ],
  };
}

// Parse SIGMA_BIT_ORDER straight out of the harness.py source text — the
// Swordsman's FD-1 view must come from the code Mitch reviews, not from the
// manifest under audit.
export function parseSigmaBitOrder(source) {
  const block = source.match(/SIGMA_BIT_ORDER[^{]*\{([\s\S]*?)\}/);
  if (!block) return null;
  const order = {};
  for (const m of block[1].matchAll(/"(sm|sr|sc|mr|mc|rc)":\s*(\d+)/g)) {
    order[m[1]] = Number(m[2]);
  }
  return Object.keys(order).length === 6 ? order : null;
}

export function parseStratumSizes(source) {
  const m = source.match(/STRATUM_SIZES[^(]*\(([\d,\s]+)\)/);
  return m ? m[1].split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n)) : null;
}

// Merkle-style root, parity with freeze.py: leaves sorted by name, raw hash
// bytes concatenated, sha256 over the concatenation.
export function rootFromLeaves(leaves) {
  const sorted = Object.entries(leaves).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const bytes = Buffer.concat(sorted.map(([, h]) => Buffer.from(h, 'hex')));
  return createHash('sha256').update(bytes).digest('hex');
}

// Mage (proposer): assert the manifest's claims as a candidate, each hash a
// commitment the Swordsman never trusts.
export const Mage = {
  propose(manifest) {
    return {
      version: manifest.version,
      schemas: { ...manifest.schemas },
      registryHash: manifest.registryHash,
      harnessInterface: manifest.harnessInterface,
      harnessInterfaceHash: manifest.harnessInterfaceHash,
      fd1SigmaBitOrder: { ...manifest.fd1SigmaBitOrder },
      rootHash: manifest.rootHash,
    };
  },
};

// Swordsman (prover): re-derive every claim from the corpus bytes across the
// Gap. Rejects on the first class of forgery it can prove; signs otherwise.
export function Swordsman(corpus) {
  return {
    prove(claim) {
      const reject = (reason, detail) => ({ signed: false, reason, detail });

      const claimedNames = Object.keys(claim.schemas).sort();
      if (JSON.stringify(claimedNames) !== JSON.stringify(corpus.schemaFiles)) {
        return reject('schema-census-drift', { claimed: claimedNames, onDisk: corpus.schemaFiles });
      }
      for (const name of corpus.schemaFiles) {
        const derived = contentHash(corpus.schemas[name]);
        if (derived !== claim.schemas[name]) {
          return reject('schema-hash-drift', { schema: name, derived, claimed: claim.schemas[name] });
        }
      }

      const registryDerived = contentHash(corpus.registry);
      if (registryDerived !== claim.registryHash) {
        return reject('registry-hash-drift', { derived: registryDerived, claimed: claim.registryHash });
      }

      const ifaceDerived = contentHash(claim.harnessInterface);
      if (ifaceDerived !== claim.harnessInterfaceHash) {
        return reject('interface-hash-forged', { derived: ifaceDerived });
      }

      // FD-1 across the Gap: harness.py source text is the authority.
      const sourceFd1 = parseSigmaBitOrder(corpus.harnessSource);
      if (!sourceFd1) return reject('fd1-unparseable-from-source');
      const fd1Views = [claim.fd1SigmaBitOrder, claim.harnessInterface.constants.SIGMA_BIT_ORDER];
      for (const view of fd1Views) {
        if (canonicalJson(view) !== canonicalJson(sourceFd1)) {
          return reject('fd1-drift-from-harness-source', { source: sourceFd1, claimed: view });
        }
      }
      const weights = Object.values(sourceFd1).sort((a, b) => b - a);
      if (JSON.stringify(weights) !== JSON.stringify([32, 16, 8, 4, 2, 1])) {
        return reject('fd1-weights-not-a-lattice-basis', { weights });
      }

      const sourceStrata = parseStratumSizes(corpus.harnessSource);
      if (JSON.stringify(sourceStrata) !== JSON.stringify(claim.harnessInterface.constants.STRATUM_SIZES)) {
        return reject('stratum-sizes-drift-from-source', { source: sourceStrata });
      }

      const derivedRoot = rootFromLeaves({
        ...claim.schemas,
        'probes/registry.json': claim.registryHash,
        'harness-interface': claim.harnessInterfaceHash,
      });
      if (derivedRoot !== claim.rootHash) {
        return reject('root-forged', { derived: derivedRoot, claimed: claim.rootHash });
      }

      return {
        signed: true,
        version: claim.version,
        rootHash: derivedRoot,
        leafCount: corpus.schemaFiles.length + 2,
      };
    },
  };
}

// One turn of the dream cycle: load, propose, prove. The watch advances only
// on a signature.
export function dreamCycleTurn(corpus = loadCorpus()) {
  const claim = Mage.propose(corpus.manifest);
  const verdict = Swordsman(corpus).prove(claim);
  return { corpus, claim, verdict };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { verdict } = dreamCycleTurn();
  console.log('freeze-watch:', JSON.stringify(verdict, null, 2));
  process.exit(verdict.signed ? 0 : 1);
}
