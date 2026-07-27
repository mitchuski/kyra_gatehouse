# Chronicle — Session 8: demo excellence 1–6 (the agent acts, the mirage talks, the pool heals)

**Date:** 2026-07-18 · **Trigger:** Mitch: *"lets do the first 3 options"*,
then mid-session: real signatures ("should defs use real signatures"), the
queue as a theme, animations + pretty-up, no auto-clicker — so items 1–6 of
the demo-excellence list, all landed. · **Outcome:** `pnpm verify` ALL GREEN
(64 pytest + 8 vitest + 85 runtime checks; freeze root untouched); the FULL
two-act loop verified over live HTTP.

## What was built

**1 · The synthetic agent.** The keyhole (:5174) is now an ACTOR: in
autonomous mode the selected agent approaches the gate by itself and answers
open challenges from its OWN knowledge base, composed from the prompt alone —
the new server-side keyhole endpoint (`/a/{aid}/keyhole/{did}`) exposes only
subject-visible fields, so the rubric/anchors/draw CANNOT leak to the agent
even in code. A narration log ("I am asked… I answer in my own words") gives
the video its agent-side voice.

**2 · The seeded MIRAGE.** Two demo agents ship with real did:key identities:
AURORA (sovereign profile) and MIRAGE (plausible but shallow). The mirage
preset scores σ_sm 0.7 / σ_mr 0.6 / rest 0.3 → det ≈ 0.095, stratum 2: it
TALKS its way through the challenge (its knowledge base answers plausibly —
deliberately), both gates open, and the volume still sandboxes it —
credential-less, scope caged to `sandbox.*` via the new
`issuance.sandbox_manifest` (vrcDigest = the zero digest = "no credential";
schema-validated). The line: *"It talks well. The instruments are not
listening to the talk."*

**3 · Act II — two-authority pooling (the differentiator).** API v3: two
Gatehouse instances (alpha/beta), each with its own real keypair, ledger,
revocation list, agent queue, outbox/inbox. `pooling.py`: the demo census
(counts→thresholds 17→">=10", timestamps→"2026-Q3", enums→cardinalities,
IOCs→one digest), bundles carrying the three face parameters, assembly gated
on a FLYING manifest, verification from the bytes + ONE public status lookup,
and `pool/reverify` for the propagation beat: alpha revokes → beta's next
verification refuses the stale bundle, on beta's ledger with a propagation
rationale. Illustrative disclosure ratio ≈ 0.096 reported on the bundle face;
the formal R < 1 stays honestly OPEN.

**4 · Real signatures.** `keys.py`: real ed25519 (cryptography lib, installed
to the venv), REAL did:key identities (multicodec 0xed01 + base58btc — the
DID is the key, no resolver), deterministic demo seeds. Both VRC proofs now
sign the credential body's canonical bytes; `verify_vrc(require_signatures=
True)` refuses tampered credentials and imposter keys. Custody is honest:
demo keys are service-custodial; production custody = the adapter lane
(tracked OPEN on the Evidence page).

**5 · The queue as theme.** The dashboard's first scene is now the gate
queue: per-agent cards with mini-rails, states, verdicts; authority tabs
(Alpha/Beta) switch the whole cockpit including the audit rail.

**6 · Animations + polish.** The witness-draw cards DEAL themselves
(staggered flip-in); the det gauge animates through a lerp hook; a live
wireframe TETRAHEDRON stands at full volume and sinks flat as det → 0; the
located vertex pulses; the REVOKED stamp slams in; scenes fade in; chain
blocks slide in; gradient panels + verdict-coloured credential card.

## Decisions of record

- Display-only fields (`displayName`, `profile`) are stripped server-side at
  approach, so the canonical identity bytes (and therefore the witness draw)
  are identical however the agent arrives.
- The mirage KNOWS the answers: its challenge passes by design, because the
  demo's argument is that assessment evidence — not conversational fluency —
  decides deployment.
- "Offline verification" in Act II = bundle bytes + one PUBLIC lookup (the
  issuer's revocation status list) — exactly the rail an ERC-8004 anchor
  would ride; the adapter lane note already says so.

## Verified

64 pytest (9 new: bilateral real signatures, tamper/imposter refusal,
minimisation by construction, raw-field smuggling refused, sandboxed carrier
refused at the pool, revocation propagation, mirage manifest schema-valid) +
8 vitest + 85 runtime checks; both apps build; full two-act loop exercised
over live HTTP (autonomous answer scored 1.0 → fly → bundle accepted at beta
→ revoke → propagation refusal). Site Evidence updated (pooling + signatures
→ PROVEN; custody + formal R < 1 → OPEN); runbook rewritten for the new demo;
readiness items 7/10/11 flipped to BUILT.

## State

Uncommitted per the standing ruling (no git until acceptance — refresh the
dated backup). Doors: Mitch's browser QA + video capture; pooling-census
freeze sign-off; gate-1 items unchanged.
