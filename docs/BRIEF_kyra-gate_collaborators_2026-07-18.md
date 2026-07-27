# Kyra Gate — presentation brief for collaborators

**Kyra Gate (formally Gatehouse KY-A — "Know Your Agent")** · 2026-07-18 ·
status: complete working prototype, local-only, pre-release
· prepared for collaborator review; distribution is the operator's decision.

---

## One paragraph

Kyra Gate is a checkpoint for AI agents, operated by a human supervisor —
never by the agent's owner. An agent is admitted by proving **understanding,
not possession of a key**; a credential exists only when two gates pass (a
human approval on the record, and a passed comprehension challenge) *and*
the mathematics of the assessment clears a threshold; every step lands on a
tamper-evident audit chain; revocation fails the credential everywhere,
immediately — including across organisational boundaries. The name is the
acronym: KY-A, said aloud, is "Kyra."

## The question it answers

> *How can authorities enable secure, dynamic data-sharing frameworks to
> rapidly pool intelligence on AI threats without violating privacy laws?*

**Answer:** verified agents carrying minimised, offline-verifiable
attestations — with revocation that propagates, and a ceiling on what
pooling can reconstruct.

## What is built and running (all of it demonstrable today)

One command (`pnpm host`) serves everything on one local origin: a public
site, a supervisor dashboard, an autonomous agent client, and the
verification engine behind them.

**Act I — the gate.** A spoofed identity is refused *before* assessment, on
the record. An admitted agent faces 24 probes derived from a formal model
(four behavioural forces + six pairwise separations); six probes are chosen
for deep verification by a draw seeded from the hash of the agent's **own
submission** — deterministic to any auditor, unpredictable to the agent, so
it cannot rehearse its own audit. Scores become a 4×4 matrix whose
determinant is the "sovereignty volume"; six thresholded bits locate the
agent on a 64-vertex lattice whose stratum *is* its tier — rank is located,
not assigned. The understanding challenge is answered by the agent itself,
in its own words (echoing the question scores zero; the expected-answer
rubric is provably unreachable from the agent's side). When human approval,
passed understanding, and sufficient volume align, a W3C VC 2.0 credential
issues carrying **two real ed25519 signatures over the same canonical
bytes** — issuer and subject, unforgeable alone.

The demo's sharpest beat: two seeded agents, **VERA** (sovereign — vera: Latin, "true") and
**MIRAGE** (plausible but shallow). Both talk fluently; both can pass the
conversation. The instruments separate them — MIRAGE ends sandboxed,
credential-less, scope caged. *No interview can tell them apart. The
instruments can.*

**Act II — the pool.** Two authorities, each running a gate. Only a
credentialed, "flying" agent may carry threat intelligence, and bundles are
**minimised by construction**: 17 incidents → "≥10", timestamps → a quarter,
enumerations → cardinalities, artifact lists → one digest — with three
parameters on every bundle's face (against whom it protects, for how long,
what it may lawfully be combined with). The receiving authority verifies
offline from the bytes plus exactly one public lookup (the issuer's
revocation status list). When the issuer revokes its agent, the receiver's
next verification refuses the stale bundle: **revocation propagates; the
pool heals itself.**

**Verdicts are a closed lexicon** — VALIDATED → fly, MIRAGE → sandbox,
BLOCKED → hold — and every refusal is itself an audit event with a written
rationale. The gate never says yes or no off the record.

## Standards posture (receipts, not claims)

| Surface | How Kyra Gate speaks it |
|---|---|
| **ToIP Trust Tasks** | The admission ceremony exists as a six-member Trust Task family (`agent-admission/*`: apply · respond · approve · issue · revoke · status), validating green in the reference registry's own build. The running gate **emits and accepts these envelopes**: signed, thread-chained, schema-conformant, with the agent counter-signing the issue response — bilaterality visible on the wire. Vendored schemas carry byte-digest provenance. |
| **W3C Verifiable Credentials 2.0** | The credential is VC 2.0-shaped, bilateral (exactly two proofs), revocable via a status list. |
| **DIDs / ed25519** | All demo parties hold real `did:key` identities (the DID *is* the key — no resolver); all proofs are real ed25519 over canonical bytes. |
| **ToIP TSP** | The ceremony is framed as relationship formation between two VIDs in named TSP roles (issuer / subject). |
| **Lexon (policy-as-law)** | The five governing clauses exist as controlled natural language, and the engine *prints the same clauses from its live configuration* — the numbers that gate deployment are the words a regulator reads. Correspondence is machine-tested. |
| **ERC-8004 (opt-in lane)** | A chain-registry adapter is seated for agents that want on-chain visibility: the anchor is evidence, never authority; digests and tier only; revocation mirrors. Pool admission may compose (valid credential) ∧ (live anchor). |

A deliberate collaboration hook: the Trust Task registry's promotion bar is
**two interoperable implementations**. Kyra Gate is implementation #1 of the
`agent-admission` family. A second, independent implementation is the single
most valuable thing a collaborator could build.

## Assurance model — how we know it works

Verification runs in **independent lanes with no shared code**, one command
(`pnpm verify`), currently **214 assertions, all green**:

- **64 pytest checks** — the four guardrails as tests (human-in-the-loop,
  auditability, safety/governance, cyber-risk), the engine, the ceremony,
  pooling, signatures. Includes a *canary*: a reference agent that passes
  every gate by construction — if the canary ever fails, the gate is broken,
  not the candidate.
- **8 TypeScript checks** (independent JSON-Schema validator + byte-parity
  hashing) — the same golden vectors must validate and hash identically in a
  second language.
- **128 zero-dependency runtime checks across 10 auditors** — each re-derives
  a frozen or claimed artifact from raw bytes: the contract freeze (a merkle
  root over 8 schemas + probe registry + engine interface), the lattice from
  first principles, the audit chain, the witness draw byte-for-byte, the
  credential ceremony rules, the policy correspondence, probe coverage, the
  pooling census, **the site's own claims** (its stated check-counts must
  recompute from the suites — marketing cannot drift from evidence), and the
  trust-task envelope discipline.
- **A 14-beat end-to-end run** — spawns its own engine and drives both acts
  over real HTTP, including the trust-task coda. The demo itself is a
  regression test.

Claims are **tiered publicly** on the evidence page: PROVEN (enforced by a
check you can run) · DERIVED (recomputed from the model) · OPEN (stated
honestly, not yet demonstrated — e.g., the formal reconstruction-ceiling
proof, and production key custody, which currently uses demo-custodial keys
with the real-custody interface already defined).

## Seeing it

```
pnpm host          # site + both apps + engine at http://localhost:1337
pnpm verify        # the full assurance run, one command
```

Walk order: the landing page → "Enter the gatehouse" (supervisor cockpit,
with a self-ticking walkthrough of the ten demo beats) → the agent's view in
a second tab (autonomous — it approaches and answers by itself). A
click-by-click script with speak-lines is in `docs/demo-runbook.md`; a
FedWiki-style conceptual guide is the site's Guide tab; the session-by-
session build record (every decision and discovery on the record) is
`docs/chronicles/`.

## Where collaborators can plug in

1. **Third-party implementation of `agent-admission/*`** — an independent
   second implementation (Python, no shared code, its own admission policy)
   now exists in-repo and interop is proven both directions on every verify
   run; an EXTERNAL implementation is the next bar, and the interop harness
   it would test against already runs (`interop/run.mjs`).
2. **Identity adapter** — the `AgentIdentityProvider` interface is defined
   and late-bound; a real client-side custody provider replaces the demo
   custodial signer without touching the core.
3. **Chain-registry provider** — the ERC-8004 lane wants a mock-chain or
   testnet provider behind the seated interface.
4. **The formal R < 1 statement** — the minimisation invariant is enforced
   and an illustrative disclosure ratio computed; the formal
   reconstruction-ceiling proof is open and well-posed.
5. **Relying-party integrations** — the `status` read is a standard,
   signed, verdict + tier + revocation endpoint: anything that can read
   signed JSON can gate on Kyra Gate.

## Status and provenance

Complete two-act prototype; contracts frozen under a published merkle root
(`0c5df807…4908eb`); all work local and pre-release by deliberate policy —
repository history, deployment, and any submission or circulation happen at
the operator's decision. This brief may be shared with collaborators at
their discretion; it contains no credentials, no private infrastructure
detail, and no unpublished third-party material (vendored standard schemas
carry their provenance and digests).
