# Chronicle — Session 12: the guide, in the federation's idiom, sitting in the interface

**Date:** 2026-07-18 · **Trigger:** Mitch: *"write the fedwiki guide for this
work, but it should just sit in the interface maybe as a new tab."*

## What was built

`site/guide.html` — a new **Guide** tab (added to every nav, landing included)
that reads like a federated wiki without being one: a horizontal LINEUP of
small paper pages, dashed wiki-links that open the target page to the RIGHT
of the page you clicked in (the federation's signature reading motion),
close buttons, a journal line at each page's foot ("sits in the interface ·
forked from the chronicles"). Pure vanilla JS in one file; no wiki server,
no federation, no external anything — the idiom, hosted at :1337 like
everything else.

**Fifteen pages, each FedWiki-small (2–4 paragraphs), every path looping
home:** Welcome Visitors · Kyra Gate · The Ceremony · The Witness Draw ·
The Sovereignty Instrument · Understanding as Key · The Two Gates · The
Verdict Lexicon · Aurora and Mirage · The Audit Rail · The Pool ·
Revocation · The Evidence · Run the Demo · The Engine Room · The Chronicles.

Three reader entry paths are named on the welcome page: regulators start at
The Ceremony, builders at The Engine Room, the three-minute visitor at
Aurora and Mirage. The Chronicles page names the two discoveries worth
telling (the Σ inversion caught by its own strict test; KY-A carrying
"Kyra" since christening) and points at `docs/chronicles/`.

## Why this shape

The guide federation ruling says guide-carries-work; this work's guide
belongs WITH the work — in the interface, one origin, no publish step, no
cookie, no external surface (consistent with local-until-acceptance). If a
real FedWiki expression is wanted later (guide.agentprivacy.ai), these
fifteen pages are already page-shaped: title + story paragraphs + links map
1:1 onto wiki JSON. That is an expressions-registry decision at Mitchell's
door, not a rebuild.

## Verified

`/guide.html` answers 200 through the live host; wiki-links render; the
Guide tab appears on the landing (top nav + footer) and all four inner
pages. Nothing outside `site/` touched; engine, apps, and verify untouched.
