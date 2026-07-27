"""Canonical bytes and content addressing.

Same bytes, same hash: recursive sorted keys, no whitespace, UTF-8.
This is the discipline shared by the audit ledger, the Gap witness-draw,
and the contracts freeze. UOR content-addressing lineage (reference
implementation in Rust: UOR-Framework/foundation/src/kernel/address.rs);
cited, not a dependency.
"""

import hashlib
import json
from typing import Any

GENESIS_HASH = "0" * 64


def canonical_bytes(obj: Any) -> bytes:
    """Serialize to canonical JSON bytes: sorted keys, no whitespace, UTF-8."""
    return json.dumps(
        obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False
    ).encode("utf-8")


def content_hash(obj: Any) -> str:
    """sha256 hex over canonical bytes."""
    return hashlib.sha256(canonical_bytes(obj)).hexdigest()


def audit_event_hash(event: dict) -> str:
    """The contentHash of an AuditEvent: hash of the event without its contentHash field."""
    body = {k: v for k, v in event.items() if k != "contentHash"}
    return content_hash(body)


def verify_chain(events: list[dict]) -> list[str]:
    """Verify a hash chain of AuditEvents. Returns a list of violations (empty = valid)."""
    violations: list[str] = []
    prior = GENESIS_HASH
    for i, event in enumerate(events):
        expected = audit_event_hash(event)
        if event.get("contentHash") != expected:
            violations.append(
                f"event[{i}]: contentHash {event.get('contentHash')!r} != recomputed {expected!r}"
            )
        if event.get("priorHash") != prior:
            violations.append(
                f"event[{i}]: priorHash {event.get('priorHash')!r} != prior contentHash {prior!r}"
            )
        prior = event.get("contentHash", expected)
    return violations
