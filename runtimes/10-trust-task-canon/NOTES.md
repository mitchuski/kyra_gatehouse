# Runtime 10 · trust-task-canon

**Status: 🟢 standing watch (16 checks).**

Session 14's lane made the ceremony speak a second language — the ToIP Trust
Task envelope discipline, as the `agent-admission/*` family vendored
byte-identical at `apps/agent-client/src/adapters/trust-tasks/schemas/`. This
fold audits the FROZEN half of that lane: the schemas and their provenance.
(The LIVE half — envelopes minted on the wire, proofs, ledger-hash equality —
is e2e beats 12–14; runtimes audit artifacts, the e2e audits the wire. Same
division of labour as runtime 03 vs the tamper demo.)

The Mage proposes the vendored bundle as one canon object; the Swordsman
proves, in order: the bundle is whole and **byte-honest** (every file digest
recomputes to the provenance table — drift without a workbench change is
tampering, the provenance file says so itself) → refs resolve inside the
vendored set (the flattened layout never silently loses `_shared` or the
framework `Ext`) → closure discipline (every object schema with properties is
`additionalProperties: false`; the one deliberate opening is the framework
`Ext` slot) → and the ceremony's own laws survive translation: the verdict
lexicon closed at three (CLAUDE.md's VALIDATED→fly / MIRAGE→sandbox /
BLOCKED→hold, spoken as `validated / failedHeldOut / blocked`), issuance
demanding **exactly two gates** of a closed pair of kinds (rule 5, now
`minItems = maxItems = 2` — the same pin runtime 05 proves on the VRC schema),
anchored response schemas, canonical type URIs, and a status query that must
name its subject.

The session-14 reflection's watch items are seated: **W-1** (the canon float
seam) is G2d — bare floats stay in a known two-member quarantine (respond's
optional score/threshold, which the bridge never emits cross-language) and the
quarantine cannot grow silently. **W-2** (deterministic corpus) is this fold's
very shape: it audits the vendored bytes, never the e2e transcript. **R-1**
(full ajv conformance in the vitest lane) stays open at the door.

Door: R-1 above; and if the workbench family revs (new upstream base, new task
version), the refresh path is re-vendor + re-hash + update the provenance
table; this fold then re-signs or names the drift. The bridge module
(`envelope.mjs`) carries the ref map this fold cross-checks.
