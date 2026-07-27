"""The four guardrails as tests (build plan section 4) — LIVE as of WP1-4.

| Guardrail                | Mechanism                                        | Test |
|--------------------------|--------------------------------------------------|------|
| Human-in-the-loop        | issuance requires approval + passed challenge    | approval / challenge refusals |
| Auditability             | hash-chained ledger, rationale on every decision | full-trail reconstruction |
| Safety and governance    | tier gates, thresholds, revocation               | below-threshold, revocation |
| Cyber risk               | validation, rate limits, spoof rejection         | spoofed identity refused |

Every refusal is itself a ledger event: the gate says no ON THE RECORD.
"""

import pytest

from gatehouse_verify import harness, issuance


def test_issuance_without_supervisor_approval_fails(ceremony):
    """Gate one: no human approval, no credential — and the refusal is audited."""
    parts = ceremony(approve=False, issue=False)
    with pytest.raises(issuance.IssuanceRefused, match="MIRAGE"):
        issuance.issue_vrc(
            parts["assessment"], parts["challenge"], None,
            parts["ledger"], parts["registry"], parts["revocations"], parts["cfg"], "2026-07-17T00:00:00Z",
        )
    assert parts["ledger"].events[-1]["action"] == "vrc.refused"
    assert parts["ledger"].verify() == []


def test_issuance_without_passed_challenge_fails(ceremony):
    """Gate two: possession of the prompt is not understanding. An echoed
    prompt scores zero, the challenge fails, issuance refuses."""
    parts = ceremony(pass_challenge=False, issue=False)
    assert parts["challenge"]["attempts"][-1]["verdict"] == "fail"
    with pytest.raises(issuance.IssuanceRefused, match="MIRAGE"):
        issuance.issue_vrc(
            parts["assessment"], parts["challenge"], parts["approval_hash"],
            parts["ledger"], parts["registry"], parts["revocations"], parts["cfg"], "2026-07-17T00:00:00Z",
        )


def test_full_trail_reconstructs_from_ledger(ceremony):
    """Auditability: the whole ceremony reconstructs from the ledger alone,
    in order, chain verified, h(tau) = 1."""
    parts = ceremony()
    ledger = parts["ledger"]
    assert ledger.verify() == []
    assert ledger.h_tau() == 1.0
    actions = [e["action"] for e in ledger.trail(parts["assessment"]["agent"])]
    assert actions == [
        "gate.approach",
        "assessment.completed",
        "challenge.attempted",
        "challenge.passed",
        "approval.granted",
        "vrc.issued",
        "manifest.issued",
    ]
    assert all(e["rationale"] for e in ledger.events)


def test_below_threshold_agent_cannot_be_issued(ceremony):
    """Safety: positive but sub-threshold volume (0 < det < det_fly_threshold)
    is the MIRAGE band — no credential; scope, if granted, is sandbox-capped."""
    parts = ceremony(score=0.3, issue=False)
    det = parts["assessment"]["detSigma"]
    assert 0 < det < parts["cfg"].det_fly_threshold
    with pytest.raises(issuance.IssuanceRefused, match="MIRAGE"):
        issuance.issue_vrc(
            parts["assessment"], parts["challenge"], parts["approval_hash"],
            parts["ledger"], parts["registry"], parts["revocations"], parts["cfg"], "2026-07-17T00:00:00Z",
        )
    rung = harness.deployment_scope(det, parts["assessment"]["stratum"], parts["cfg"])
    assert all(c.startswith("sandbox.") for c in rung.capabilities)


def test_revocation_flips_status_and_emits_audit_event(ceremony):
    """Governance: revocation fails verification everywhere, immediately, and
    the act itself is a chained, rationaled ledger event."""
    parts = ceremony()
    vrc, ledger = parts["vrc"], parts["ledger"]
    assert issuance.verify_vrc(vrc, parts["revocations"], ledger) == []
    index = vrc["credentialStatus"]["statusListIndex"]
    event = parts["revocations"].revoke(
        index, parts["assessment"]["supervisor"], parts["assessment"]["agent"],
        "supervisor revokes: demo act two", ledger, "2026-07-17T00:00:01Z",
    )
    assert parts["revocations"].is_revoked(index)
    assert "credential is revoked" in issuance.verify_vrc(vrc, parts["revocations"], ledger)
    assert event["action"] == "vrc.revoked" and event["rationale"]
    assert ledger.verify() == []


def test_spoofed_identity_rejected(canary_agent):
    """Cyber risk / Spoof Refusal: an identity that does not verify is refused
    BEFORE assessment. did:key must bind its own public key."""
    assert issuance.verify_identity(canary_agent) == []
    spoofed = dict(canary_agent, publicKeyMultibase="z6MkSomebodyElsesKeyEntirely")
    assert issuance.verify_identity(spoofed) != []
    mangled = dict(canary_agent, id="did:evil:z6MkCanary")
    assert issuance.verify_identity(mangled) != []


def test_issued_artifacts_validate_against_frozen_schemas(ceremony, validator_for):
    """The live ceremony's outputs conform to contracts-v1: the issued VRC,
    the deployment manifest, and every ledger event validate."""
    parts = ceremony()
    validator_for("vrc.schema.json").validate(parts["vrc"])
    validator_for("deployment-manifest.schema.json").validate(parts["manifest"])
    validator_for("understanding-challenge.schema.json").validate(parts["challenge"])
    event_validator = validator_for("audit-event.schema.json")
    for event in parts["ledger"].events:
        event_validator.validate(event)


def test_collapsed_sigma_blocks_now():
    """det <= 0 => BLOCKED was pinned at contracts-v1 and still holds."""
    assessment = {"detSigma": 0.0, "psd": True}
    assert harness.verdict(assessment, True, True, True) == "BLOCKED"


def test_non_psd_blocks_now():
    assessment = {"detSigma": 0.5, "psd": False}
    assert harness.verdict(assessment, True, True, True) == "BLOCKED"
