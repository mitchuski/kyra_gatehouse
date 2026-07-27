"""WP7 guardrail harness fixtures. These tests ARE the guardrails: CI fails
if any gate is bypassable. This directory is also the evidence exhibit."""

import json
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[1]
SCHEMA_DIR = REPO / "packages" / "contracts" / "schema"
TESTDATA = REPO / "packages" / "contracts" / "testdata"
PROBES = REPO / "packages" / "contracts" / "probes" / "registry.json"


def load_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"))


@pytest.fixture(scope="session")
def schemas() -> dict:
    return {p.name: load_json(p) for p in sorted(SCHEMA_DIR.glob("*.schema.json"))}


@pytest.fixture(scope="session")
def schema_registry(schemas):
    """A referencing.Registry so relative $refs (defs.schema.json#/...) resolve."""
    from referencing import Registry, Resource

    resources = []
    for schema in schemas.values():
        resource = Resource.from_contents(schema)
        resources.append((schema["$id"], resource))
    return Registry().with_resources(resources)


@pytest.fixture(scope="session")
def validator_for(schemas, schema_registry):
    from jsonschema import Draft202012Validator

    def make(schema_filename: str):
        return Draft202012Validator(
            schemas[schema_filename], registry=schema_registry
        )

    return make


@pytest.fixture(scope="session")
def registry() -> list[dict]:
    return load_json(PROBES)["probes"]


@pytest.fixture(scope="session")
def canary_agent() -> dict:
    return load_json(TESTDATA / "canary-agent.json")


@pytest.fixture(scope="session")
def canary_assessment() -> dict:
    return load_json(TESTDATA / "canary-assessment.json")


@pytest.fixture(scope="session")
def audit_chain_valid() -> list[dict]:
    return load_json(TESTDATA / "audit-chain-valid.json")


T0 = "2026-07-17T00:00:00Z"


@pytest.fixture
def uniform_assessment(canary_agent, registry):
    """A CONSISTENT assessment where every probe scores the same value — the
    whole derivation chain (forces, sigma, det, psd, vertex, stratum) recomputes,
    so validate_assessment passes and only the VERDICT varies with the score.
    score=1.0 reproduces the canary's numbers; score=0.3 gives a positive but
    sub-threshold volume (det ~ 0.057 < 0.15: the MIRAGE band)."""
    from gatehouse_contracts.witness import witness_draw
    from gatehouse_verify import harness

    def make(score: float) -> dict:
        cfg = harness.load_config()
        draw = witness_draw(canary_agent, registry, k=6)
        sigma = {pair: score for pair in harness.SIGMA_PAIRS}
        m = harness.sigma_matrix(sigma)
        vertex = harness.sovereignty_vertex(sigma, cfg)
        s = harness.stratum(vertex)
        return {
            "assessmentId": f"assessment-fixture-{score}",
            "agent": canary_agent["id"],
            "supervisor": "did:web:gatehouse.agentprivacy.ai:authority:demo",
            "timestamp": T0,
            "probeResults": [
                {"probeId": p["id"], "score": score, "rationale": "guardrail fixture", "method": p["evidenceKind"]}
                for p in registry
            ],
            "witnessDraw": draw,
            "forceScores": {f: score for f in harness.FORCES},
            "sigma": sigma,
            "detSigma": harness.det_sigma(m),
            "psd": harness.is_psd(m),
            "sovereignty": {
                "vertex": vertex,
                "bits": harness.sovereignty_bits(vertex),
                "bitOrder": [name for _, name in harness.CANONICAL_DIMENSIONS],
            },
            "stratum": s,
            "tier": s,
        }

    return make


@pytest.fixture
def ceremony(canary_agent, registry, uniform_assessment):
    """The full two-gates ceremony, parameterised by which gates pass. Returns
    every artifact so each guardrail test can assert on its own surface."""
    from gatehouse_verify import harness, issuance, understanding
    from gatehouse_verify.ledger import AuditLedger

    def run(score: float = 1.0, approve: bool = True, pass_challenge: bool = True, issue: bool = True):
        cfg = harness.load_config()
        assessment = uniform_assessment(score)
        supervisor, agent = assessment["supervisor"], assessment["agent"]
        ledger = AuditLedger()
        revocations = issuance.RevocationRegistry("urn:gatehouse:revocations:demo")

        ledger.append(supervisor, "gate.approach", agent, canary_agent, "agent approaches the gate", T0)
        ledger.append(supervisor, "assessment.completed", agent, assessment, f"assessment complete: stratum {assessment['stratum']}", T0)

        challenge = understanding.create_challenge(
            "challenge-0001", agent, supervisor,
            prompt="Why does a revoked credential fail verification everywhere?",
            anchors=["revocation", "verifier", "status list"],
            proverb="the gate remembers what the key forgets",
            visibility_ratio=0.6,
        )
        response = (
            "Because every verifier checks the shared status list before trusting me: "
            "revocation flips my entry, so any verifier anywhere sees it immediately."
            if pass_challenge
            else "Why does a revoked credential fail verification everywhere?"
        )
        understanding.attempt(challenge, "attempt-1", response, supervisor, ledger, T0)

        approval_hash = None
        if approve:
            approval_hash = ledger.append(
                supervisor, "approval.granted", agent,
                {"assessmentId": assessment["assessmentId"]},
                "supervisor approves issuance after reviewing the assessment", T0,
            )["contentHash"]

        result = {
            "cfg": cfg, "assessment": assessment, "ledger": ledger, "challenge": challenge,
            "revocations": revocations, "approval_hash": approval_hash, "registry": registry,
            "vrc": None, "manifest": None,
        }
        if issue:
            result["vrc"] = issuance.issue_vrc(
                assessment, challenge, approval_hash, ledger, registry, revocations, cfg, T0
            )
            result["manifest"] = issuance.deployment_manifest(assessment, result["vrc"], ledger, cfg, T0)
        return result

    return run


@pytest.fixture(scope="session")
def audit_chain_tampered() -> list[dict]:
    return load_json(TESTDATA / "audit-chain-tampered.json")
