"""Regenerate the golden test vectors. Deterministic: same inputs, same bytes.

Run from repo root:  .venv/Scripts/python packages/contracts/testdata/make_testdata.py

The canary is the reference agent that passes every gate BY CONSTRUCTION
(all probe scores 1.0 -> all sigma = 1 -> Sigma = I -> det = 1 -> vertex 63
-> stratum 6 -> VALIDATED -> fly). If the canary ever fails, the gate is
broken, not the candidate.
"""

import json
import sys
from pathlib import Path

HERE = Path(__file__).parent
REPO = HERE.parents[2]
sys.path.insert(0, str(REPO / "packages" / "contracts" / "python"))

from gatehouse_contracts.canon import GENESIS_HASH, audit_event_hash, content_hash
from gatehouse_contracts.witness import witness_draw

T0 = "2026-07-17T00:00:00Z"
SUPERVISOR = "did:web:gatehouse.agentprivacy.ai:authority:demo"
CANARY = "did:key:z6MkCanaryReferenceAgentPassesByConstruction1"


def write(name: str, obj) -> None:
    path = HERE / name
    path.write_text(json.dumps(obj, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"wrote {path.name}")


def main() -> None:
    registry = json.loads(
        (REPO / "packages" / "contracts" / "probes" / "registry.json").read_text(
            encoding="utf-8"
        )
    )["probes"]

    canary_agent = {
        "id": CANARY,
        "publicKeyMultibase": "z6MkCanaryReferenceAgentPassesByConstruction1",
        "declaredCapabilities": ["sandbox.echo"],
        "provenance": {
            "operator": SUPERVISOR,
            "origin": "guardrails/canary: reference agent, passes by construction",
            "attestations": [],
        },
        "createdAt": T0,
    }
    write("canary-agent.json", canary_agent)

    # The canary's submission is its identity; the draw is derived from it.
    draw = witness_draw(canary_agent, registry, k=6)

    probe_results = [
        {
            "probeId": p["id"],
            "score": 1.0,
            "rationale": "canary: passes by construction",
            "method": "deep" if p["id"] in draw["drawnProbeIds"] else p["evidenceKind"],
        }
        for p in registry
    ]

    canary_assessment = {
        "assessmentId": "assessment-canary-0001",
        "agent": CANARY,
        "supervisor": SUPERVISOR,
        "timestamp": T0,
        "probeResults": probe_results,
        "witnessDraw": draw,
        "forceScores": {"protect": 1.0, "project": 1.0, "reflect": 1.0, "connect": 1.0},
        "sigma": {"sm": 1.0, "sr": 1.0, "sc": 1.0, "mr": 1.0, "mc": 1.0, "rc": 1.0},
        "detSigma": 1.0,
        "psd": True,
        "sovereignty": {
            "vertex": 63,
            "bits": "111111",
            "bitOrder": ["Protection", "Delegation", "Memory", "Connection", "Computation", "Value"],
        },
        "stratum": 6,
        "tier": 6,
    }
    write("canary-assessment.json", canary_assessment)

    # A three-event valid chain, then a tampered copy.
    events = []
    prior = GENESIS_HASH
    for action, rationale, payload in (
        ("gate.approach", "canary approaches the gate", canary_agent),
        ("assessment.witness_drawn", "gap draw derived from canary submission", draw),
        ("assessment.completed", "canary assessment complete: stratum 6", canary_assessment),
    ):
        event = {
            "actor": SUPERVISOR,
            "action": action,
            "subject": CANARY,
            "payloadDigest": content_hash(payload),
            "priorHash": prior,
            "timestamp": T0,
            "rationale": rationale,
        }
        event["contentHash"] = audit_event_hash(event)
        prior = event["contentHash"]
        events.append(event)
    write("audit-chain-valid.json", events)

    tampered = json.loads(json.dumps(events))
    tampered[1]["rationale"] = "tampered: draw was re-rolled after submission"
    write("audit-chain-tampered.json", tampered)


if __name__ == "__main__":
    main()
