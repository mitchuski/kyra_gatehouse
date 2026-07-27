// Runtime 07 · probe-coverage — the PVM-native probe registry under audit.
//
// The registry is a freeze leaf (runtime 01 watches its bytes); this runtime
// watches its SEMANTICS: the derived count N = 4·probes_per_force +
// 6·probes_per_pair, full force and pair coverage, id-pattern conformance,
// taxonomy consistency (a separation probe carries exactly its pair's two
// forces), and the deep-verifiability surface the witness-draw needs.
//
// Two lanes inside the fold, after lexon_pvm runtime 01:
//   structural rules  — violations REJECT the registry (the gate is broken);
//   findings          — signed observations that do not break the gate but
//                       belong on the review-gate table (e.g. a σ pair with
//                       no deep probe cannot be deep-drawn: deep-coverage-gap).
// The Swordsman re-derives every finding from the registry bytes and refuses
// any finding it cannot re-derive (no hallucinated drift).

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readJson, contentHash } from '../../01-freeze-watch/src/freeze_watch.mjs';

export const FORCES = ['protect', 'project', 'reflect', 'connect'];
export const PAIR_FORCES = {
  sm: ['protect', 'project'],
  sr: ['protect', 'reflect'],
  sc: ['protect', 'connect'],
  mr: ['project', 'reflect'],
  mc: ['project', 'connect'],
  rc: ['reflect', 'connect'],
};
export const EVIDENCE_KINDS = ['declared', 'witnessed', 'deep'];
export const ID_PATTERN = /^(force\.(protect|project|reflect|connect)|sigma\.(sm|sr|sc|mr|mc|rc))\.[0-9]+$/;

export function loadCorpus() {
  return {
    registry: readJson(path.join('packages', 'contracts', 'probes', 'registry.json')).probes,
    config: readJson(path.join('services', 'verify', 'gatehouse_verify', 'harness_config.json')),
  };
}

// Structural audit: violations = the registry itself does not hold.
export function structuralViolations(registry, config) {
  const violations = [];
  const ids = registry.map((p) => p.id);
  if (new Set(ids).size !== ids.length) violations.push('duplicate-probe-id');
  for (const p of registry) {
    if (!ID_PATTERN.test(p.id)) violations.push(`id-pattern:${p.id}`);
    if (!EVIDENCE_KINDS.includes(p.evidenceKind)) violations.push(`evidence-kind:${p.id}`);
    if (p.kind === 'force') {
      if (p.forces.length !== 1 || p.sigmaPairs) violations.push(`force-taxonomy:${p.id}`);
    } else if (p.kind === 'separation') {
      const pair = p.sigmaPairs?.[0];
      const expected = PAIR_FORCES[pair];
      if (!expected || p.sigmaPairs.length !== 1) violations.push(`pair-taxonomy:${p.id}`);
      else if (JSON.stringify([...p.forces].sort()) !== JSON.stringify([...expected].sort())) {
        violations.push(`pair-forces:${p.id}`);
      }
    } else violations.push(`unknown-kind:${p.id}`);
  }
  const expectedN = 4 * config.probes_per_force + 6 * config.probes_per_pair;
  if (registry.length !== expectedN) violations.push(`count:${registry.length}!=${expectedN}`);
  for (const f of FORCES) {
    const n = registry.filter((p) => p.kind === 'force' && p.forces[0] === f).length;
    if (n !== config.probes_per_force) violations.push(`force-coverage:${f}:${n}`);
  }
  for (const pair of Object.keys(PAIR_FORCES)) {
    const n = registry.filter((p) => p.kind === 'separation' && p.sigmaPairs?.[0] === pair).length;
    if (n !== config.probes_per_pair) violations.push(`pair-coverage:${pair}:${n}`);
  }
  return violations;
}

// Findings audit: signed observations for the review-gate table.
export function deriveFindings(registry) {
  const findings = [];
  for (const f of FORCES) {
    if (!registry.some((p) => p.kind === 'force' && p.forces[0] === f && p.evidenceKind === 'deep')) {
      findings.push({ kind: 'deep-coverage-gap', subject: `force.${f}` });
    }
  }
  for (const pair of Object.keys(PAIR_FORCES)) {
    if (!registry.some((p) => p.kind === 'separation' && p.sigmaPairs?.[0] === pair && p.evidenceKind === 'deep')) {
      findings.push({ kind: 'deep-coverage-gap', subject: `sigma.${pair}` });
    }
  }
  return findings.map((f) => ({ ...f, evidenceDigest: contentHash(f) }));
}

// Mage (proposer): derive the audit claim — structure + findings — from the
// registry, each finding committed to a digest.
export const Mage = {
  propose(registry, config) {
    return {
      structuralViolations: structuralViolations(registry, config),
      findings: deriveFindings(registry),
      registryHash: contentHash({ version: 1, ids: registry.map((p) => p.id).sort() }),
    };
  },
};

// Swordsman (prover): re-derive everything from the corpus bytes; refuse
// forged digests and hallucinated findings.
export function Swordsman(corpus) {
  return {
    prove(claim) {
      const reject = (reason, detail) => ({ signed: false, reason, detail });

      const violations = structuralViolations(corpus.registry, corpus.config);
      if (JSON.stringify(violations) !== JSON.stringify(claim.structuralViolations)) {
        return reject('violations-not-derivable', { derived: violations });
      }
      if (violations.length > 0) return reject('registry-structurally-broken', { violations });

      const derived = deriveFindings(corpus.registry);
      const derivedDigests = new Set(derived.map((f) => f.evidenceDigest));
      for (const f of claim.findings) {
        const { evidenceDigest, ...body } = f;
        if (contentHash(body) !== evidenceDigest) return reject('evidence-digest-mismatch', { finding: f });
        if (!derivedDigests.has(evidenceDigest)) return reject('finding-not-derivable-from-corpus', { finding: f });
      }
      if (claim.findings.length !== derived.length) return reject('findings-census-short', { derived });

      return { signed: true, findings: derived, probeCount: corpus.registry.length };
    },
  };
}

export function dreamCycleTurn(corpus = loadCorpus()) {
  const claim = Mage.propose(corpus.registry, corpus.config);
  const verdict = Swordsman(corpus).prove(claim);
  return { corpus, claim, verdict };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { verdict } = dreamCycleTurn();
  console.log('probe-coverage:', JSON.stringify(verdict, null, 2));
  process.exit(verdict.signed ? 0 : 1);
}
