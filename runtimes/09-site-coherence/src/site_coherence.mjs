// Runtime 09 · site-coherence — the site's own claims under audit.
//
// The site asserts things nothing else watches: that its navigation resolves,
// that every page wears the Kyra Gate lockup, that the guide's wiki-links all
// land, and — most driftable of all — NUMBERS ("N checks green"). This watch
// recomputes the numbers from the test suites themselves: when a suite grows
// and the landing forgets, this runtime fails, not a reader's trust.
//
// Corpus: site/*.html + the three suites (guardrails/*.py test functions,
// the vitest spec's it() blocks, every runtimes/*/test.mjs check() call —
// including this file's own: the count is self-referential and stable).

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { repoRoot, readText } from '../../01-freeze-watch/src/freeze_watch.mjs';

const SITE = path.join(repoRoot, 'site');
export const PAGES = ['index.html', 'how-it-works.html', 'mathematics.html', 'demo.html', 'evidence.html', 'guide.html'];

export function loadCorpus() {
  const html = Object.fromEntries(PAGES.map((p) => [p, readFileSync(path.join(SITE, p), 'utf-8')]));
  return { html };
}

export function navTargets(page) {
  return [...page.matchAll(/href="([^"]+)"/g)]
    .map((m) => m[1])
    .filter((h) => h.endsWith('.html') && !h.startsWith('http'));
}

export function guideGraph(guideHtml) {
  const slugs = [...guideHtml.matchAll(/^\s*"([a-z0-9-]+)":\s*\{/gm)].map((m) => m[1]);
  const links = {};
  for (const slug of slugs) links[slug] = [];
  // Story links: [[Title]] → slug, per the renderer's transform.
  const bodyOf = {};
  const parts = guideHtml.split(/^\s*"([a-z0-9-]+)":\s*\{/m);
  for (let i = 1; i < parts.length; i += 2) bodyOf[parts[i]] = parts[i + 1].split(/^\s*"[a-z0-9-]+":\s*\{/m)[0];
  for (const slug of slugs) {
    for (const m of (bodyOf[slug] ?? '').matchAll(/\[\[([^\]]+)\]\]/g)) {
      links[slug].push(m[1].toLowerCase().replace(/\s+/g, '-'));
    }
  }
  return { slugs, links };
}

export function countChecks() {
  const guardrails = path.join(repoRoot, 'guardrails');
  let pytest = 0;
  for (const f of readdirSync(guardrails).filter((f) => f.endsWith('.py'))) {
    pytest += (readFileSync(path.join(guardrails, f), 'utf-8').match(/^def test_/gm) ?? []).length;
  }
  const vitest = (readText(path.join('guardrails', 'ts', 'contracts.spec.ts')).match(/\bit\(/g) ?? []).length;
  let runtimes = 0;
  const rtDir = path.join(repoRoot, 'runtimes');
  for (const d of readdirSync(rtDir, { withFileTypes: true }).filter((d) => d.isDirectory() && /^\d\d-/.test(d.name))) {
    const t = path.join(rtDir, d.name, 'test.mjs');
    if (existsSync(t)) runtimes += (readFileSync(t, 'utf-8').match(/\bcheck\(\s*['"`]/g) ?? []).length;
  }
  return { pytest, vitest, runtimes, total: pytest + vitest + runtimes };
}

// Evidence-page source references that look like repo paths must exist.
export function danglingSources(evidenceHtml) {
  const refs = [...evidenceHtml.matchAll(/<code>([^<]+)<\/code>/g)]
    .map((m) => m[1])
    .filter((r) => r.includes('/') && /\.(py|ts|mjs|json|md|lexon)$/.test(r));
  return refs.filter((r) => {
    const candidates = [r, path.join('services', 'verify', r), path.join('guardrails', r)];
    return !candidates.some((c) => existsSync(path.join(repoRoot, c)));
  });
}

export const Mage = {
  propose(corpus) {
    const landing = corpus.html['index.html'];
    const claimed = landing.match(/<b>(\d+)<\/b><span>checks green/);
    const evNote = corpus.html['evidence.html'].match(/(\d+)\s*pytest[^·]*·\s*(\d+)\s*vitest[^·]*·\s*(\d+)\s*zero-dep/);
    return {
      claimedTotal: claimed ? Number(claimed[1]) : null,
      claimedLanes: evNote ? { pytest: Number(evNote[1]), vitest: Number(evNote[2]), runtimes: Number(evNote[3]) } : null,
    };
  },
};

export function Swordsman(corpus) {
  return {
    prove(claim) {
      const reject = (reason, detail) => ({ signed: false, reason, detail });

      for (const [name, html] of Object.entries(corpus.html)) {
        for (const target of navTargets(html)) {
          if (!existsSync(path.join(SITE, target))) return reject('nav-target-missing', { page: name, target });
        }
        if (!html.includes('KYRA GATE')) return reject('brand-lockup-missing', { page: name });
        if (name !== 'index.html' && !html.includes('Gatehouse KY-A')) return reject('formal-name-missing', { page: name });
      }

      const g = guideGraph(corpus.html['guide.html']);
      for (const [from, targets] of Object.entries(g.links)) {
        for (const t of targets) {
          if (!g.slugs.includes(t)) return reject('guide-link-dangling', { from, target: t });
        }
      }
      const reached = new Set(['welcome-visitors']);
      const queue = ['welcome-visitors'];
      while (queue.length) {
        for (const t of g.links[queue.shift()] ?? []) {
          if (!reached.has(t)) { reached.add(t); queue.push(t); }
        }
      }
      const orphans = g.slugs.filter((s) => !reached.has(s));
      if (orphans.length) return reject('guide-pages-unreachable', { orphans });

      const counted = countChecks();
      if (claim.claimedTotal !== counted.total) {
        return reject('landing-check-count-drift', { claimed: claim.claimedTotal, counted: counted.total });
      }
      if (
        !claim.claimedLanes ||
        claim.claimedLanes.pytest !== counted.pytest ||
        claim.claimedLanes.vitest !== counted.vitest ||
        claim.claimedLanes.runtimes !== counted.runtimes
      ) {
        return reject('evidence-lane-count-drift', { claimed: claim.claimedLanes, counted });
      }

      const dangling = danglingSources(corpus.html['evidence.html']);
      if (dangling.length) return reject('evidence-source-dangling', { dangling });

      return { signed: true, counted, guidePages: g.slugs.length };
    },
  };
}

export function dreamCycleTurn(corpus = loadCorpus()) {
  const claim = Mage.propose(corpus);
  return { corpus, claim, verdict: Swordsman(corpus).prove(claim) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { verdict } = dreamCycleTurn();
  console.log('site-coherence:', JSON.stringify(verdict, null, 2));
  process.exit(verdict.signed ? 0 : 1);
}
