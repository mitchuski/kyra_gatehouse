# @gatehouse/audit — content-addressed audit ledger (WP4)

Append-only, hash-chained event store. Every state transition in the system
emits an `AuditEvent` (see `packages/contracts/schema/audit-event.schema.json`):
the event's id IS the sha256 of its canonical bytes, and each event carries the
prior event's hash. Any tamper breaks verification; audit verification is the
integrity fraction h(τ).

## Lineage

The same-bytes-same-hash discipline follows the UOR content-addressing work
(reference implementation in Rust: `UOR-Framework/foundation/src/kernel/address.rs`).
UOR is cited as lineage, not a dependency — the ledger here is implemented
against the frozen contract using stdlib hashing only.

Implementation lands in WP4 (Python service side + this TS mirror for the
supervisor UI's client-side verification).
