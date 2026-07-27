# Chronicle — Session 7: the site, local at :1337 · the git ruling

**Date:** 2026-07-18 · **Rulings from Mitch:** (1) *"we dont start the git
until ive been accepted to the hack"* — git history is deliberately deferred;
the gate-1 review items stand, the commit/tag waits for acceptance. Interim
protection = a dated backup copy of the tree outside the working dir,
refreshed per session. (2) *"build this locally at localhost1337"* — the WP9
site, built now, local only.

## What was built

`site/` — the full five-page WP9 site as zero-dependency static HTML/CSS,
served by `scripts/serve-site.mjs` at **http://localhost:1337** (`pnpm
site`). Standards register throughout; no deploy anywhere until acceptance
(the registry note records this).

| Page | Carries |
|---|---|
| Home | the CDIR pooling question verbatim, the one-line answer, the two-act loop side by side (Act I "runs today" / Act II "build week"), the ceremony rail |
| How it works | the seven stations prose + the four-guardrails-as-mechanisms table |
| The mathematics | Σ = 1−σ and det thresholds, the 64-vertex lattice / tier-is-stratum, A(τ) = α·ln(1+|τ|)·h(τ), the witness-draw formula, R < 1 marked openly as Act-II work |
| Live demo | the three local surfaces (:5173 / :5174 / :8000), start commands, runbook pointer |
| Evidence | the tiered claims table — 10 PROVEN, 3 DERIVED, 4 OPEN — every row resolving to a source file / check, honest OPEN rows included (R<1, pooling, proof values, σ_mr) |

Smoke: all five pages + CSS answer 200 on :1337. `expressions.yaml`
`gatehouse-site` moved idea→drafting with the local-build note (registry
edit flagged to Mitch). CLAUDE.md layout gained the `site/` line.
hack-readiness updated: item 2 now 🟡 local-complete; the no-git risk
reframed as a standing ruling with the backup mitigation.

## Why site-first serves the note

The concept note (31 July) must cite a live URL; the site's five pages ARE
the note's skeleton — Home ≈ abstract + schematic, How-it-works ≈ method,
Mathematics ≈ formal core, Evidence ≈ claims register. Drafting the note now
becomes harvesting, and the deploy at acceptance time is a single act on an
already-finished artifact.

## State

Site live locally; engine/apps untouched this session; verify unaffected.
Doors: acceptance → deploy + first commit/tag (Mitch) · note draft harvest ·
browser QA of the React apps · Act II build.
