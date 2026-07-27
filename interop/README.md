# interop/ — the second implementation (× three expressions)

The Trust Task registry's promotion bar (draft → candidate) is **two
interoperable implementations**. This lane is implementation #2 of the
`agent-admission/*` family, built to make the interop claim real rather than
rhetorical — and exercised on every `pnpm verify`.

## Independence rules

`impl2/impl2.py` shares **no code** with Kyra Gate: no `gatehouse_contracts`,
no `gatehouse_verify`, no `@gatehouse` — Python stdlib + the `cryptography`
package only. Canonical JSON, base58/did:key, the schema validator, the
envelope discipline, and the event-log discipline are all independent
re-derivations. What IS shared is the **standard**: the vendored payload
schemas (byte-digest provenance in the bridge's `SCHEMAS_PROVENANCE.md`) and
the envelope member set. Impl2 also has its **own admission policy** — a
risk-rubric over criterion answers, not the PVM — because the family
deliberately does not mandate how a gate decides, only how it speaks.

**W-1 enforced in code:** envelope payloads carry digests, strings, integers
and booleans — never bare floats (`mint_envelope` refuses them). Cross-writer
JSON float rendering ("1.0" vs "1") breaks signatures across languages; the
known consequence is that impl2 verifies impl1's engine-signed credential
STRUCTURALLY (two proofs, two parties) rather than re-verifying those inner
signatures from a JS-written file — the engine-side canon parity is already
proven byte-exact in e2e beat 13.

## The three expressions

One implementation, three persona skins (`impl2/expressions/*.json` — names,
voices, criteria, tier; never wire semantics; each with its own key custody
labels):

| Expression | Register | Cast |
|---|---|---|
| `risk-mastery` | standards | Risk Mastery admission desk · portfolio-screening agent · counterparty risk officer |
| `archon-hearthold` | technical | Warden authority · Emissary agent · Sovereign relying party (upstream-pattern cast; no hearthold code imported) |
| `hitchhikers` | mythopoetic-edges | the Gatekeeper · the Hitchhiker · the Innkeeper down the road (edge register lives ONLY in persona strings) |

## The run (`node interop/run.mjs`, a `pnpm verify` step)

- **Direction A:** the bridge drives a live ceremony on its own engine
  (:8110) and writes the transcript + the engine's event log; impl2
  independently verifies it — schemas, every ed25519 proof, thread chaining,
  two distinct gates, closed verdict lexicon, evidence digests resolving into
  the travelling log, the log re-verifying from genesis, the agent's
  counter-signature, the revoked status read. 10 checks.
- **Direction B (×3):** impl2 mints a full ceremony transcript under each
  expression; implementation #1's validator accepts it — schemas, proofs,
  threads, gates, bilateral credential, counter-sign, status.

Artifacts land in `interop/out/` (regenerated every run; not source).
A third-party implementation remains the most valuable external
contribution — this lane is also the conformance harness it would test
against.
