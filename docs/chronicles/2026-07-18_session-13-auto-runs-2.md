# Chronicle — Session 13: the second auto-run wave (the census, the site, the ceremony itself)

**Date:** 2026-07-18 · **Trigger:** Mitch: *"any other work we can put an
auto run through for this?"* · **Answer:** three lanes were running
unwatched; all three now watch themselves. `pnpm verify` ALL GREEN: 64
pytest + 8 vitest + **112 runtime checks (9 runtimes)** + the new **e2e
ceremony auto-run (11 beats)**; freeze root untouched.

## What was built

**Runtime 08 · pooling-census (13/13).** Act II's minimisation law audited
from `pooling.py` SOURCE — the census's auditor until its freeze (readiness
item 8) and its watch after. The Mage assembles bundles honestly or
smuggles raw artifacts; the Swordsman re-implements the census in JS from
the stated law: disjoint raw/allowed vocabularies, thresholds and
cardinalities and the one order-invariant digest, forged digests refused,
dropped claims refused, and the R < 1 accounting recomputed independently
from the source's own bit tables.

**Runtime 09 · site-coherence (14/14).** The first runtime whose corpus is
the PRESENTATION layer: navigation must resolve, every page must wear the
KYRA GATE lockup, every guide `[[link]]` must land and every guide page be
reachable from Welcome Visitors, evidence source references must exist on
disk — and the sharpest tooth: **the landing's "N checks green" and the
evidence page's lane counts must recompute from the suites themselves**
(`def test_` / `it(` / `check(`, self-referentially including this
runtime's own). Growing a suite without updating the site now fails
verify. Proven during construction: the watch caught the stale 157 and
forced the correction to 184.

**The e2e ceremony auto-run (`scripts/e2e.mjs`, 11/11 beats).** The demo is
now a regression test: the script spawns its OWN engine on :8100 (never
touching a live demo), drives both acts over real HTTP exactly as the apps
do, and asserts the walkthrough's beats — spoof refused, AURORA admitted /
assessed / answering for itself / issued with verifying ed25519 proofs,
MIRAGE sandboxed credential-less, the keyhole leaking no anchors, the
bundle accepted at Beta, revocation flipping verification, propagation
refusing the stale bundle, both ledgers whole at h(τ) = 1. Wired as the
final `pnpm verify` step.

## Alignment fixes en route

- Runtime 02's G8 if/else double call-site merged to one call so static
  check counts equal dynamic results (a prerequisite for runtime 09's
  counting to be honest).
- Landing and evidence-page numbers corrected 157 → **184** (64 + 8 + 112)
  — by the new watch's own demand.

## The auto-run inventory (complete)

| Lane | Watches | Trigger |
|---|---|---|
| pytest guardrails (64) | the four guardrails, engine, ceremony, pooling, signatures | `pnpm verify` |
| vitest + ajv (8) | schema validity + byte-parity hashing, independently | `pnpm verify` |
| runtimes 01–07 (85) | the frozen contracts, canon, draw, ceremony rules, lexon, probes | `pnpm verify` |
| runtimes 08–09 (27) | the pooling census + the site's own claims | `pnpm verify` |
| e2e (11 beats) | the full two-act ceremony over real HTTP | `pnpm verify` |

One command, 195 assertions, no surface left unwatched — engine, contracts,
census, site, and the demo itself.

## State

Local-only, uncommitted per the standing rulings. Doors unchanged: Mitch's
walk + video + note harvest; census freeze sign-off (runtime 08 is ready to
pin it); gate-1 items.
