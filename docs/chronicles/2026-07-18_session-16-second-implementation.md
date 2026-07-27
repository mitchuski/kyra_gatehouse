# Chronicle — Session 16: implementation #2, three expressions, interop proven both ways

**Date:** 2026-07-18 · **Trigger:** Mitch: *"lets maybe build this second
implementation for Risk Mastery, and Hitchikers or Archon Hearthold"* — then
mid-session: *"all three perhaps as different expressions."* · **Outcome:**
the registry's two-implementation promotion bar is now exercised locally on
every `pnpm verify` — ALL GREEN end to end.

## The shape (his own pattern, applied to the interop seed)

**One independent second implementation, three expression skins.**
`interop/impl2/impl2.py` — Python, stdlib + `cryptography` only, sharing
**no code** with Kyra Gate (independence rules stated at the top of the file
and in `interop/README.md`): its own canonical JSON, its own base58/did:key,
its own structural schema validator, its own envelope minting, its own
content-addressed event log, and its own **admission policy** — a
risk-rubric over criterion answers, not the PVM — because the family
standardises how a gate SPEAKS, not how it decides. What is shared is only
the standard itself: the vendored schemas (byte-digest provenance) and the
envelope member set.

**The three expressions** are persona data (`impl2/expressions/*.json`) —
names, voices, criteria, tier, each with its own key-custody labels; never
wire semantics:

- **risk-mastery** (standards): the Risk Mastery admission desk · a
  portfolio-screening agent · a counterparty risk officer; exposure-ceiling
  rubric.
- **archon-hearthold** (technical): the Warden / Emissary / Sovereign cast
  from the upstream pattern — persona only, no hearthold code imported, the
  seat fence untouched; custody-separation rubric.
- **hitchhikers** (mythopoetic-edges): the Gatekeeper, the Hitchhiker, the
  Innkeeper down the road — the edge register lives ONLY in persona strings;
  the wire documents remain register-neutral standards artifacts.

All three are named in `render/expressions.yaml` (status: drafting) per
registry discipline — the ecosystems entered through the registry, not
through code.

## The interop run (`interop/run.mjs`, new verify step)

- **Direction A — impl2 verifies impl1:** the bridge drives a live ceremony
  on its own engine (:8110); the transcript plus the engine's event log
  travel as a file; the Python implementation independently passes **10/10**
  checks — schemas, every ed25519 envelope proof (cross-language byte-exact),
  thread chaining, two distinct gates, the closed verdict lexicon, evidence
  digests resolving into the travelling log, the log re-verifying from
  genesis, the agent's counter-signature, the revoked status read.
- **Direction B — impl1 verifies impl2, × 3:** each expression mints a full
  ceremony transcript; Kyra Gate's own validator accepts every one —
  schemas, proofs, threads, gates, bilateral credential (two proofs, two
  parties), counter-sign, status.

**Both directions green on the first run** — a direct payoff of session
14's W-1 rule, enforced in code: `mint_envelope` REFUSES bare floats, so
cross-writer float rendering can never break a signature. The one known
consequence is documented rather than hidden: impl2 verifies impl1's inner
engine-signed credential structurally (the engine-side canon parity is
already proven byte-exact in e2e beat 13).

## Surfaced

- `pnpm verify` gains the final step **"interop (impl #2 × 3 expressions)"**
  — the full chain is now: build → codegen drift → pytest (64) → vitest (8)
  → freeze → 10 runtimes (128) → e2e (14 beats) → interop (5 checks incl.
  impl2's 10 inner checks).
- Evidence page: new PROVEN row — *two interoperable implementations,
  verified both directions on every run* (runtime 09 still signs).
- Collaborator brief plug-in point #1 updated: the next bar is an EXTERNAL
  third-party implementation, and the conformance harness it would test
  against already runs.
- `interop/README.md` states the independence rules, the W-1 enforcement,
  and the expression table; `interop/out/` is regenerated artifacts
  (gitignored for the eventual first commit).

## Addendum — the guide completed (same day)

Mitch: *"the fedwiki system guide page is incomplete."* Correct — the guide
predated sessions 15–16. Two pages added to the lineup (now **19 pages**),
woven into the graph so every page stays reachable from Welcome Visitors:

- **The Second Implementation** — the promotion bar, the independence rules,
  both interop directions, and the three expressions told in one breath
  ("the same six documents carry all three worlds"); linked from Speaks
  Trust Tasks, looping home through The Evidence and Kyra Gate.
- **The Registry Anchor** — the opt-in ERC-8004 lane's three rules (evidence
  never authority · digests and tier only · revocation mirrors) and the
  pool-predicate composition; linked from The Pool, linking Revocation and
  The Two Gates.

Runtime 09 re-signed 14/14 after the weave (guide links land, reachability
holds) — the guide is now under the same watch that keeps it complete.

**Second addendum — the links themselves.** Mitch: *"none of the guide pages
are linking or opening new pages."* Root cause class: the renderer's global
`function open(...)` shadowed `window.open` — an override that is flaky
across browsers/extensions (when it silently loses, every wiki-link click
becomes a blocked popup attempt: exactly "nothing happens") — with plain
browser caching able to mask any fix. Rebuilt collision-proof: `openPage`
(no window collision possible), ONE delegated click listener on the lineup
(no per-element wiring to go stale), real `href="#slug"` anchors with
preventDefault (keyboard + semantics), and the host now sends
`Cache-Control: no-store` so a stale page can never hide an edit again.
Host restarted; new renderer confirmed served; runtime 09 still 14/14.
Lesson for the record: runtime 09 audits the guide's SOURCE (links, graph,
reachability) — it cannot execute the page; interaction bugs need a browser
or an executing check.

## State

Local-only, uncommitted per the standing rulings. Doors: Mitch's walk +
video + note harvest (the interop line now belongs in the note: "the
admission ceremony has two interoperable implementations"); D14-5 style
question repeats here — whether any impl2 expression becomes an outward
submission is an expressions-registry decision at Mitchell's hand.
