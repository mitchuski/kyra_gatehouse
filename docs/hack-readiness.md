# Hack readiness — what remains, against the real deadlines

As of 2026-07-18. Deadlines are data from
[`../render/expressions.yaml`](../render/expressions.yaml); this page just
reads them. Two horizons matter:

- **31 July (13 days):** `cdir-track4-note` (1,500 words + schematic, cites a
  live site URL + claims register) · `gatehouse-site` skeleton (Home +
  How-it-works) · two GDC session materials (`gdc-wallet-assurance`,
  `gdc-vulnerability-handling`).
- **8 September:** `cdir-pooling-demo` — prototype + 5-minute video, and the
  registry is explicit that **Act II two-authority pooling is the
  differentiator**.

## Critical path to 31 July

| # | Item | Holder | State |
|---|---|---|---|
| 1 | **Review gate 1**: confirm FD-1, dispose σ_mr deep-gap, ratify Σ=1−σ + VALIDATED-only issuance. **Git ruling (2026-07-18): no git until hack acceptance** — so protect the tree another way meanwhile: keep a dated zip/copy of `~/gatehouse-kya` outside the working dir | **Mitch** | ⬜ gate items open; git deliberately deferred |
| 2 | **WP9 site** — BUILT LOCALLY at `http://localhost:1337` (`pnpm site`): all five pages (Home · How-it-works · Mathematics · Live-demo · Evidence with the tiered claims table). Deploys to gatehouse.agentprivacy.ai only after acceptance; the note cites the URL at send time | build ✅ local / **Mitch** deploys | 🟡 local-complete |
| 3 | **Concept-note draft** (`render/cdir-track4-note/out/`): 1,500 words + schematic; the pitch narrative + architecture page + Act-I screenshots feed it | build session drafts → **Mitch** sends | ⬜ registry says "drafting"; no draft file exists yet |
| 4 | **Visual QA + screenshot set**: run the apps in a real browser, fix paper cuts, capture the 7 scenes (each screenshot doubles as note schematic material and site imagery) | build session (+ Mitch eyes) | ⬜ apps build & serve; never yet rendered in a browser |
| 5 | Two **GDC materials** (scope-ladder/custody framing; cyber-risk guardrail section) — registry notes say they harvest paragraphs from the note | build session → **Mitch** | ⬜ |
| 6 | **Deploy**: site + (optionally) the demo behind it. Deploys/pushes | **Mitch** | ⬜ |

Realistic order: 1 → 4 → 2+3 in parallel (site and note share prose) → 5 → 6,
with 2–3 sessions of build work in it. The engine itself needs nothing for
the note beyond what is green today.

## Critical path to 8 September

| # | Item | Holder | State |
|---|---|---|---|
| 7 | **Act II — two-authority pooling** (THE differentiator): multi-authority API (alpha/beta), minimised bundles by construction, offline verification + one public status lookup, revocation propagation — all tested (`test_pooling_and_signatures.py`) and clickable in the dashboard's pool scene | build | ✅ BUILT (2026-07-18) |
| 8 | **Pooling census freeze** — the demo census lives in `pooling.py` (RAW_FIELDS → ALLOWED_CLAIM_KEYS); freezing it as a versioned artifact is a one-session job on the existing freeze machinery | build + **Mitch** sign-off | ⬜ before build week |
| 9 | **5-minute video** capture per the runbook (Act I ~3 min + Act II ~90 s) | **Mitch** records | ⬜ everything it needs now runs |
| 10 | **Real signatures** — ed25519 throughout: real did:key identities, both VRC proofs signed over canonical bytes, imposters and tampering refused. Remaining OPEN: agent-side custody (keys are demo-custodial; production custody = the adapter) | build | ✅ BUILT (2026-07-18) |
| 11 | Site: five pages live locally; Evidence updated with the pooling + signature rows | build | ✅ local (deploy at acceptance) |
| 12 | Optional polish: mock ERC-8004 provider (anchor chip + pool predicate), probe-prompt refinement (re-freeze) | build, **Mitch**-gated where frozen | ⬜ optional |

## What is NOT needed (already strong)

Engine correctness (three verification lanes, 148 checks), the freeze
discipline, the guardrail story, the documentation suite, the Act-3
narrative. Judges probing "is this real?" hit tested, recomputable answers —
that is the differentiated ground; the remaining work is expression, not
foundation.

## Standing risks

- **No commits — now a standing ruling** (no git until hack acceptance), so
  the mitigation is a dated backup copy outside the working tree, refreshed
  after each session, until acceptance lands and the first commit/tag seals
  contracts-v1.
- **Single evening of browser QA** stands between "builds green" and
  "demos well" — schedule it before prose-polishing anything.
- Act II touches the frozen contracts only via a NEW pooling artifact —
  keep it additive so `contracts-v1` never re-opens under deadline.
