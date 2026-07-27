// Runtime 06 · lexon-policy-sync — the law and the code held to one voice.
//
// Corpus: guardrails/lexon/gatehouse.lexon (the term a regulator reads),
// harness.py's lexon_policy source (the emitter — the same numbers that gate
// deployment print the law), and harness_config.json (the live numbers).
//
// The Mage proposes a correspondence claim: which clauses the emitter emits,
// which clauses the term declares, which config value the Variance clause
// carries. The Swordsman re-derives all three from the bytes and refuses any
// drift: a clause in the emitter missing from the term, a term clause count
// drift, a threshold that no longer traces to config. The fold does not
// duplicate the prose — it proves the SETS and the NUMBER correspond, which
// is the same correspondence guardrails/test_lexon_policy.py pins in Python.

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readJson, readText, contentHash, HARNESS_PY } from '../../01-freeze-watch/src/freeze_watch.mjs';

export const LEXON_TERM = path.join('guardrails', 'lexon', 'gatehouse.lexon');

// Clause names declared in a Lexon-style text: `CLAUSE: <Name>.`
export function clauseNames(text) {
  return [...text.matchAll(/CLAUSE:\s*([A-Za-z ]+?)\./g)].map((m) => m[1].trim());
}

// The emitter's clauses, parsed from the lexon_policy function body in
// harness.py source (its emitted lines are string literals in the source).
export function emitterView(harnessSource) {
  const fn = harnessSource.match(/def lexon_policy[\s\S]*?(?=\n# ---|\nTSP_ROLE|$)/);
  if (!fn) return null;
  const body = fn[0];
  return {
    clauses: clauseNames(body),
    citesDetFlyThreshold: /\{cfg\.det_fly_threshold\}/.test(body),
    hardcodedThreshold: /0\.15/.test(body), // magic numbers are forbidden (rule 6)
  };
}

export function loadCorpus() {
  return {
    term: readText(LEXON_TERM),
    harnessSource: readText(HARNESS_PY),
    config: readJson(path.join('services', 'verify', 'gatehouse_verify', 'harness_config.json')),
  };
}

// Mage (proposer): derive the correspondence claim from the corpus, committing
// to an evidence digest over the parts.
export const Mage = {
  propose(corpus) {
    const emitter = emitterView(corpus.harnessSource);
    const claim = {
      termClauses: clauseNames(corpus.term),
      emitterClauses: emitter ? emitter.clauses : [],
      citesDetFlyThreshold: emitter ? emitter.citesDetFlyThreshold : false,
      hardcodedThreshold: emitter ? emitter.hardcodedThreshold : true,
      detFlyThreshold: corpus.config.det_fly_threshold,
    };
    claim.evidenceDigest = contentHash({ t: claim.termClauses, e: claim.emitterClauses });
    return claim;
  },
};

// Swordsman (prover): re-derive the same views from the bytes and prove the
// correspondence rules across the Gap.
export function Swordsman(corpus) {
  return {
    prove(claim) {
      const reject = (reason, detail) => ({ signed: false, reason, detail });

      const termClauses = clauseNames(corpus.term);
      const emitter = emitterView(corpus.harnessSource);
      if (!emitter) return reject('emitter-unparseable-from-source');
      if (contentHash({ t: termClauses, e: emitter.clauses }) !== claim.evidenceDigest) {
        return reject('evidence-digest-mismatch');
      }

      // 1. every emitted clause exists in the regulator-facing term
      const missing = emitter.clauses.filter((c) => !termClauses.includes(c));
      if (missing.length) return reject('clause-missing-from-term', { missing });

      // 2. the term carries the four guardrails + the schema-level spoof gate
      const expected = ['Two Gates', 'Audit', 'Variance', 'Revocation', 'Spoof Refusal'];
      if (JSON.stringify(termClauses) !== JSON.stringify(expected)) {
        return reject('term-clause-census-drift', { termClauses });
      }

      // 3. the Variance number traces to config, never hardcoded (rule 6)
      if (!emitter.citesDetFlyThreshold) return reject('threshold-not-config-derived');
      if (emitter.hardcodedThreshold) return reject('magic-number-in-emitter');
      if (typeof corpus.config.det_fly_threshold !== 'number') return reject('threshold-absent-from-config');

      return {
        signed: true,
        clauses: termClauses,
        emitted: emitter.clauses,
        detFlyThreshold: corpus.config.det_fly_threshold,
      };
    },
  };
}

export function dreamCycleTurn(corpus = loadCorpus()) {
  const claim = Mage.propose(corpus);
  const verdict = Swordsman(corpus).prove(claim);
  return { corpus, claim, verdict };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { verdict } = dreamCycleTurn();
  console.log('lexon-policy-sync:', JSON.stringify(verdict, null, 2));
  process.exit(verdict.signed ? 0 : 1);
}
