"""Same bytes, same hash; any tamper breaks the chain (auditability guardrail)."""

from gatehouse_contracts.canon import (
    audit_event_hash,
    canonical_bytes,
    content_hash,
    verify_chain,
)


def test_canonical_bytes_key_order_invariant():
    assert canonical_bytes({"b": 1, "a": [{"y": 2, "x": 1}]}) == canonical_bytes(
        {"a": [{"x": 1, "y": 2}], "b": 1}
    )


def test_canonical_bytes_no_whitespace():
    assert b" " not in canonical_bytes({"a": 1, "b": [1, 2]})


def test_content_hash_deterministic():
    assert content_hash({"k": "v"}) == content_hash({"k": "v"})


def test_valid_chain_verifies(audit_chain_valid):
    assert verify_chain(audit_chain_valid) == []


def test_tampered_event_is_detected(audit_chain_tampered):
    violations = verify_chain(audit_chain_tampered)
    assert violations, "a mutated event MUST break verification"


def test_event_hash_excludes_content_hash_field(audit_chain_valid):
    event = audit_chain_valid[0]
    assert event["contentHash"] == audit_event_hash(event)
