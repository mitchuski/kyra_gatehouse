"""WP4: the live content-addressed audit ledger.

Every state transition emits a content-addressed event chained to the prior
event (CLAUDE.md rule 4), rationale mandatory. Built on the TESTED canon
primitives in gatehouse_contracts.canon; this module adds the live accumulator,
h(tau) — the integrity fraction the dragon skill gates deployment on — and
full-trail reconstruction for the supervisor's audit rail.

Timestamps are supplied by the caller: the ledger itself calls no clock, so
same inputs always produce the same chain (the runtimes' determinism law).
"""

from gatehouse_contracts.canon import (
    GENESIS_HASH,
    audit_event_hash,
    content_hash,
    verify_chain,
)

KNOWN_ACTION_PREFIXES = ("gate", "assessment", "challenge", "vrc", "credential", "deployment")


class AuditLedger:
    """An append-only hash chain of AuditEvents."""

    def __init__(self, events: list[dict] | None = None):
        self.events: list[dict] = list(events or [])

    @property
    def head(self) -> str:
        return self.events[-1]["contentHash"] if self.events else GENESIS_HASH

    def append(
        self,
        actor: str,
        action: str,
        subject: str,
        payload: dict | list,
        rationale: str,
        timestamp: str,
    ) -> dict:
        """Emit one event. Rationale is refused-empty: no unexplained transitions."""
        if not rationale:
            raise ValueError("rationale is required on every audit event")
        event = {
            "actor": actor,
            "action": action,
            "subject": subject,
            "payloadDigest": content_hash(payload),
            "priorHash": self.head,
            "timestamp": timestamp,
            "rationale": rationale,
        }
        event["contentHash"] = audit_event_hash(event)
        self.events.append(event)
        return event

    def verify(self) -> list[str]:
        """Violations of the whole chain (empty = valid)."""
        return verify_chain(self.events)

    def h_tau(self) -> float:
        """The integrity fraction h(tau): the fraction of history that verifies.

        Walk the chain from genesis; an event verifies if its contentHash
        recomputes AND its priorHash matches the recomputed lineage. An empty
        history is vacuously whole (h=1; A(tau) already sends ln(1+0) to 0).
        """
        if not self.events:
            return 1.0
        ok = 0
        prior = GENESIS_HASH
        for event in self.events:
            expected = audit_event_hash(event)
            if event.get("contentHash") == expected and event.get("priorHash") == prior:
                ok += 1
            prior = event.get("contentHash", expected)
        return ok / len(self.events)

    def trail(self, subject: str) -> list[dict]:
        """Full-trail reconstruction: every event about one subject, in chain order."""
        return [e for e in self.events if e["subject"] == subject]

    def find(self, content_hash_hex: str) -> dict | None:
        for event in self.events:
            if event["contentHash"] == content_hash_hex:
                return event
        return None
