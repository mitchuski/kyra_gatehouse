# Pitch narrative — the second gatehouse (speculative arc)

**What this document is:** the NARRATIVE, forward-looking section of the
hackathon pitch. Acts 1 and 2 — the KY-A ceremony and the revocation — are
BUILT and demoed live. This is Act 3: where the same gate goes next. Nothing
in this file is scheduled work; it is the story that makes the built thing
legible as a pattern rather than a product. (Any submission that grows out of
it gets named in `render/expressions.yaml`, at Mitchell's hand.)

---

## Act 3 — the agent arrives carrying papers

The gatehouse you just watched vets an agent's **conduct**: what it protects,
what it projects, whether it understands. The next gatehouse vets its
**papers**.

Picture a real-world-asset market — tokenised treasuries, invoices, property
shares. A broker cannot stand at every gate, so the broker delegates: an
agent arrives on their behalf. What it carries is not a password and not a
prospectus PDF. It carries a **delegated-agent token — soulbound**, non-
transferable, minted to this one delegation: inside it, the proof of the
broker agreement, the mandate's limits, the jurisdictions, the custody terms.
The compliance documents ARE the identity. Papers, bound to the bearer, that
cannot be lent to a friend.

**The problem with papers has never been possessing them — it is that nobody
at the gate has read them.** So this gatehouse does what our first one did to
authentication: it replaces possession with understanding, at two levels.

**First, the documents themselves are made executable.** This is the Lexon
harness's move: the same compression discipline that turned our privacy model
into a censused book of controlled-natural-language clauses turns the broker
agreement into contract clauses a regulator can READ and a runtime can RUN.
"The Agent may settle only instruments the Mandate names." "No clause routes
client assets to the Agent." One text, two audiences — exactly how our
deploy policy already works today, where `lexon_policy()` prints the law
from the same numbers that gate deployment.

**Then the clauses become the challenge system.** Every compiled clause is a
probe — our 24-probe assessment, but DERIVED FROM THE CONTRACT: show the
boundary this clause names, demonstrate the refusal it requires. The witness
draw does what it always does: the deep checks are dealt from the hash of the
agent's own token, so a broker's agent cannot rehearse which clauses of its
own agreement it will be audited against. And the understanding gate asks the
one question paperwork never asks: *explain your mandate in your own words.*
An agent that can recite its contract but not apply it is a MIRAGE, and
mirages get sandboxed.

The clauses then keep running after admission — as **gatehouse runtimes**,
the same fold pattern that audits our own freeze today: one seat proposes
compliance claims from the documents, the other re-derives them from the
bytes and refuses everything it cannot prove. A contract that is a runtime
does not wait for the annual audit; it is the audit, continuously.

**And then the architecture inverts, on purpose.** Pass the gate and you
enter a **privacy pool**: inside, positions and flows are private —
minimised disclosure among the admitted, membership provable without
exposure. Outside stands the **trust-graph registry**: the public face,
built from the same bilateral relationship credentials our demo issues —
who is admitted, at what tier, vouched by whom, revoked when. Verifiers
outside see standing without seeing business. Members inside see business
without surveilling each other.

That inversion is not a new idea bolted on — it IS the model the first
gatehouse runs on: protect on the inside, project on the outside, and the
gate as the membrane where the two forces are held apart. Even our demo's
scope ladder already speaks the vocabulary: the capabilities a validated
agent earns today are literally `pool.read`, `pool.submit_minimised`,
`pool.verify`.

## Why this is one engine, not two products

| Act 3 element | Already running in the demo |
|---|---|
| soulbound delegated-agent token | AgentIdentity + evidence discipline (did:cid: a content-addressed identity is a holon) |
| documents → executable clauses | the Lexon binding: `gatehouse.lexon` ⇄ `lexon_policy(cfg)`, correspondence tested |
| clause-derived compliance probes | the probe registry, already derived (N = 4·f + 6·p), never hardcoded |
| can't-rehearse deep audit | the witness draw, seeded from the agent's own bytes |
| contract-as-continuous-audit | the runtimes lane: propose → re-derive across the Gap → sign or refuse |
| privacy pool on the inside | the scope ladder's `pool.*` rungs; minimised submission |
| trust-graph registry outside | VRC edges (bilateral, revocable) — the graph grows one credential at a time |
| exit that means something | revocation: fails verification everywhere, immediately |

## The registry has a name already (addendum, 2026-07-18)

The "trust-graph registry on the outside" is not a standard we would have to
invent: **ERC-8004 ("Trustless Agents")** already proposes exactly the rails
— on-chain identity, reputation, and validation registries for agents. So
the flow composes without a new primitive, and strictly OPT-IN: an agent
that wants blockchain-registry visibility anchors its Gatehouse outcome
there — digests and tier only, never probe content — with Gatehouse acting
as the validator posting the validation entry. The anchor is evidence, never
authority: the verdict is still made at the gate, by the assessment and the
two gates.

And the anchor is the missing **pool predicate**: privacy-pool admission can
require (VALIDATED credential) ∧ (live anchored validation entry), giving the
pool a public, chain-native membership rail while everything inside stays
minimised. Revocation mirrors to the same registry, so on-chain and
off-chain relying parties fail a revoked agent together. In the engine this
costs nothing: it is an adapter lane beside the identity adapter
(`AgentRegistryProvider`), two rows of ledger vocabulary, and zero changes
to the frozen core.

The pitch in one sentence: **we built a gate that makes an agent prove it
understands what it carries — and the same gate, pointed at compliance
paperwork, turns documents into law that runs, with privacy pooled on the
inside and trust registered (ERC-8004-shaped, if the agent opts in) on the
outside.**
