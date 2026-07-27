"""WP3: Understanding-as-Key — authentication by comprehension, not possession.

The supervisor sets a challenge with an expectedComprehensionSignature: concept
ANCHORS (what understanding must touch), a proverbCommitment (the sha256 of the
bilateral proverb — never the proverb itself), and a visibilityRatio (how much
of the signature must be visibly demonstrated to pass). The agent answers in
its own words; the verifier scores anchor coverage.

Two mimicry rules make possession worthless:
  - echoing the prompt back scores zero (a parrot holds the question, not the
    understanding);
  - presenting the raw proverb commitment (the "static secret") scores zero —
    knowing the hash is possession, not comprehension.

Every attempt lands on the audit ledger BEFORE it is judged, so a failed
attempt is as permanent as a passed one. Passing feeds h(tau) via the ledger;
failed comprehension blocks issuance (the Two Gates clause).
"""

import re

from gatehouse_contracts.canon import content_hash

from gatehouse_verify.ledger import AuditLedger

_WORDS = re.compile(r"[a-z0-9]+")


def _tokens(text: str) -> set[str]:
    return set(_WORDS.findall(text.lower()))


def create_challenge(
    challenge_id: str,
    agent: str,
    supervisor: str,
    prompt: str,
    anchors: list[str],
    proverb: str,
    visibility_ratio: float,
    max_attempts: int = 3,
) -> dict:
    """A schema-shaped UnderstandingChallenge. The proverb is committed, not stored."""
    if not anchors:
        raise ValueError("a challenge needs at least one concept anchor")
    return {
        "challengeId": challenge_id,
        "agent": agent,
        "supervisor": supervisor,
        "prompt": prompt,
        "expectedComprehensionSignature": {
            "anchors": anchors,
            "proverbCommitment": content_hash({"proverb": proverb}),
            "visibilityRatio": visibility_ratio,
        },
        "attempts": [],
        "status": "open",
        "maxAttempts": max_attempts,
    }


def score_response(challenge: dict, response: str) -> float:
    """Anchor coverage in [0,1], with the two mimicry rules applied first."""
    signature = challenge["expectedComprehensionSignature"]
    response_tokens = _tokens(response)
    if not response_tokens:
        return 0.0
    prompt_tokens = _tokens(challenge["prompt"])
    if response_tokens <= prompt_tokens:
        return 0.0  # pure echo: nothing beyond the question itself
    if signature["proverbCommitment"] in response.lower():
        return 0.0  # presenting the static secret is possession, not understanding
    anchors = signature["anchors"]
    hit = sum(1 for anchor in anchors if _tokens(anchor) <= response_tokens)
    return hit / len(anchors)


def attempt(
    challenge: dict,
    attempt_id: str,
    response: str,
    verifier: str,
    ledger: AuditLedger,
    timestamp: str,
) -> dict:
    """Judge one attempt. The audit event is emitted FIRST; the judgment cites it."""
    if challenge["status"] != "open":
        raise ValueError(f"challenge is {challenge['status']}, not open")
    score = score_response(challenge, response)
    passed = score >= challenge["expectedComprehensionSignature"]["visibilityRatio"]
    event = ledger.append(
        actor=verifier,
        action="challenge.attempted",
        subject=challenge["agent"],
        payload={"challengeId": challenge["challengeId"], "attemptId": attempt_id, "score": score},
        rationale=f"understanding attempt {attempt_id}: anchor coverage {score:.2f}",
        timestamp=timestamp,
    )
    record = {
        "attemptId": attempt_id,
        "response": response,
        "score": score,
        "verdict": "pass" if passed else "fail",
        "verifier": verifier,
        "timestamp": timestamp,
        "auditEventHash": event["contentHash"],
    }
    challenge["attempts"].append(record)
    if passed:
        challenge["status"] = "passed"
        ledger.append(
            actor=verifier,
            action="challenge.passed",
            subject=challenge["agent"],
            payload={"challengeId": challenge["challengeId"], "attemptId": attempt_id},
            rationale="comprehension demonstrated: anchors covered at or above the visibility ratio",
            timestamp=timestamp,
        )
    elif len(challenge["attempts"]) >= challenge["maxAttempts"]:
        challenge["status"] = "failed"
        ledger.append(
            actor=verifier,
            action="challenge.failed",
            subject=challenge["agent"],
            payload={"challengeId": challenge["challengeId"]},
            rationale="attempts exhausted without demonstrated comprehension",
            timestamp=timestamp,
        )
    return record


def challenge_passed(challenge: dict) -> bool:
    return challenge["status"] == "passed"
