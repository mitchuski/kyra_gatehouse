"""Act II pooling + real-signature guardrails.

The pooling claims, as tests: only a flying agent carries intelligence; a
bundle is minimised by construction (a raw field is refused); the receiving
authority verifies from bytes + one public status lookup; revocation
propagates. The signature claims: both VRC proofs are real ed25519 over the
credential body; a tampered credential fails signature verification.
"""

import pytest

from gatehouse_verify import harness, issuance, pooling
from gatehouse_verify.keys import Keypair, verify_signature
from gatehouse_verify.ledger import AuditLedger

T0 = "2026-07-17T00:00:00Z"


@pytest.fixture
def signed_ceremony(ceremony):
    """The happy ceremony re-issued with REAL keys on both sides."""
    parts = ceremony(issue=False)
    issuer_key = Keypair.from_seed("test:authority")
    subject_key = Keypair.from_seed("test:agent")
    # Rebind the assessment parties to the real did:key identities.
    parts["assessment"]["supervisor"] = issuer_key.did
    parts["assessment"]["agent"] = subject_key.did
    parts["challenge"]["agent"] = subject_key.did
    vrc = issuance.issue_vrc(
        parts["assessment"], parts["challenge"], parts["approval_hash"],
        parts["ledger"], parts["registry"], parts["revocations"], parts["cfg"], T0,
        issuer_key=issuer_key, subject_key=subject_key,
    )
    manifest = issuance.deployment_manifest(parts["assessment"], vrc, parts["ledger"], parts["cfg"], T0)
    return {**parts, "vrc": vrc, "manifest": manifest, "issuer_key": issuer_key, "subject_key": subject_key}


def test_signatures_are_real_and_bilateral(signed_ceremony):
    vrc = signed_ceremony["vrc"]
    body = {k: v for k, v in vrc.items() if k != "proof"}
    for proof in vrc["proof"]:
        party = proof["verificationMethod"].split("#")[0]
        assert verify_signature(party, body, proof["proofValue"])
    assert issuance.verify_vrc(vrc, signed_ceremony["revocations"], signed_ceremony["ledger"], require_signatures=True) == []


def test_tampered_credential_fails_signature(signed_ceremony):
    tampered = {**signed_ceremony["vrc"]}
    tampered["credentialSubject"] = {**tampered["credentialSubject"], "tier": 6, "stratum": 6}
    tampered["credentialSubject"]["id"] = signed_ceremony["issuer_key"].did  # subject swap
    violations = issuance.verify_vrc(tampered, signed_ceremony["revocations"], signed_ceremony["ledger"], require_signatures=True)
    assert any("signature" in v for v in violations)


def test_wrong_key_cannot_sign_for_a_party(signed_ceremony):
    body = {k: v for k, v in signed_ceremony["vrc"].items() if k != "proof"}
    imposter = Keypair.from_seed("test:imposter")
    forged = imposter.sign(body)
    assert verify_signature(signed_ceremony["subject_key"].did, body, forged) is False


def test_minimisation_by_construction():
    raw = {
        "incidentCount": 17,
        "window": "2026-Q3",
        "attackVectors": ["a", "b", "c"],
        "affectedSectors": ["payments", "identity"],
        "iocs": ["h1", "h2", "h3"],
    }
    claims = pooling.minimise(raw)
    assert set(claims) == pooling.ALLOWED_CLAIM_KEYS
    assert claims["incidentCountThreshold"] == ">=10"
    assert claims["attackVectorCardinality"] == 3
    assert not any(k in claims for k in pooling.RAW_FIELDS)
    assert 0 < pooling.disclosure_ratio() < 1


def test_bundle_assembles_verifies_and_carries_its_face(signed_ceremony):
    raw = {"incidentCount": 17, "window": "2026-Q3", "attackVectors": ["a", "b", "c"], "affectedSectors": ["s1", "s2"], "iocs": ["h1"]}
    bundle = pooling.assemble_bundle(
        "alpha", signed_ceremony["assessment"], signed_ceremony["vrc"], signed_ceremony["manifest"],
        raw, {"protectsAgainst": "botnets", "windowDays": 90, "lawfulCombination": "aggregates only"},
        signed_ceremony["ledger"], T0,
    )
    assert pooling.verify_bundle(bundle, signed_ceremony["vrc"], signed_ceremony["revocations"], signed_ceremony["ledger"]) == []
    assert signed_ceremony["ledger"].events[-1]["action"] == "pool.bundle_assembled"


def test_raw_field_in_bundle_is_refused(signed_ceremony):
    raw = {"incidentCount": 17, "window": "2026-Q3", "attackVectors": ["a"], "affectedSectors": ["s"], "iocs": ["h"]}
    bundle = pooling.assemble_bundle(
        "alpha", signed_ceremony["assessment"], signed_ceremony["vrc"], signed_ceremony["manifest"],
        raw, {"protectsAgainst": "x", "windowDays": 30, "lawfulCombination": "y"},
        signed_ceremony["ledger"], T0,
    )
    leaky = {**bundle}
    leaky["claims"] = {**leaky["claims"], "iocs": ["raw-ioc-value"]}  # raw data smuggled in
    from gatehouse_contracts.canon import content_hash

    leaky["bundleDigest"] = content_hash({k: v for k, v in leaky.items() if k != "bundleDigest"})
    violations = pooling.verify_bundle(leaky, signed_ceremony["vrc"], signed_ceremony["revocations"], signed_ceremony["ledger"])
    assert any("minimisation violated" in v for v in violations)


def test_sandboxed_agent_cannot_carry_intelligence(ceremony):
    parts = ceremony(score=0.3, issue=False)
    manifest = issuance.sandbox_manifest(parts["assessment"], parts["ledger"], parts["cfg"], T0)
    assert manifest["decision"] == "sandbox"
    assert manifest["vrcDigest"] == "0" * 64  # credential-less by construction
    with pytest.raises(issuance.IssuanceRefused, match="only a flying agent"):
        pooling.assemble_bundle(
            "alpha", parts["assessment"], {"issuer": "x", "credentialStatus": {}}, manifest,
            {"incidentCount": 1, "window": "w", "attackVectors": [], "affectedSectors": [], "iocs": []},
            {"protectsAgainst": "x", "windowDays": 1, "lawfulCombination": "y"},
            parts["ledger"], T0,
        )


def test_revocation_propagates_to_the_pool(signed_ceremony):
    raw = {"incidentCount": 17, "window": "2026-Q3", "attackVectors": ["a"], "affectedSectors": ["s"], "iocs": ["h"]}
    bundle = pooling.assemble_bundle(
        "alpha", signed_ceremony["assessment"], signed_ceremony["vrc"], signed_ceremony["manifest"],
        raw, {"protectsAgainst": "x", "windowDays": 30, "lawfulCombination": "y"},
        signed_ceremony["ledger"], T0,
    )
    assert pooling.verify_bundle(bundle, signed_ceremony["vrc"], signed_ceremony["revocations"], signed_ceremony["ledger"]) == []
    index = signed_ceremony["vrc"]["credentialStatus"]["statusListIndex"]
    signed_ceremony["revocations"].revoke(
        index, signed_ceremony["assessment"]["supervisor"], signed_ceremony["assessment"]["agent"],
        "act two: issuer revokes its carrier", signed_ceremony["ledger"], T0,
    )
    violations = pooling.verify_bundle(bundle, signed_ceremony["vrc"], signed_ceremony["revocations"], signed_ceremony["ledger"])
    assert any("revoked" in v for v in violations)


def test_mirage_sandbox_manifest_validates(ceremony, validator_for):
    parts = ceremony(score=0.3, issue=False)
    manifest = issuance.sandbox_manifest(parts["assessment"], parts["ledger"], parts["cfg"], T0)
    validator_for("deployment-manifest.schema.json").validate(manifest)
    rung = harness.deployment_scope(parts["assessment"]["detSigma"], parts["assessment"]["stratum"], parts["cfg"])
    assert manifest["scope"]["capabilities"] == list(rung.capabilities)
