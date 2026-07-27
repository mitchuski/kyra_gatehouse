"""Gatehouse verify service v3 — two authorities, an agent queue per gate,
real ed25519 signatures, and the Act II pooling lane.

Shape:
  /authorities                     the two demo gatehouses + their queues
  /demo/agents                     the seeded demo agents (real did:key ids)
  /a/{aid}/gate/*                  the Act I ceremony, per authority, per agent
  /a/{aid}/keyhole/{did}           SUBJECT-visible view only (the privacy claim, enforced)
  /a/{aid}/pool/*                  Act II: assemble / receive / re-verify bundles
  /policy /probes /contracts       unchanged

Every state transition still lands on the issuing authority's ledger with a
rationale before the response returns. Demo agent keys are custodial (see
keys.py); all signatures are real.
"""

import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from gatehouse_contracts.canon import content_hash

from gatehouse_verify import assessment as assessment_mod
from gatehouse_verify import harness, issuance, pooling, understanding
from gatehouse_verify.keys import Keypair
from gatehouse_verify.ledger import AuditLedger

app = FastAPI(title="Gatehouse KY-A verify", version="0.3.0")

_REPO = Path(__file__).resolve().parents[3]
_FREEZE_JSON = _REPO / "packages" / "contracts" / "CONTRACTS_FROZEN.json"
_REGISTRY = json.loads(
    (_REPO / "packages" / "contracts" / "probes" / "registry.json").read_text(encoding="utf-8")
)["probes"]


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# --- Demo parties: real keys, real did:key identities -------------------------

AGENT_KEYS = {
    "vera": Keypair.from_seed("agent:vera"),
    "mirage": Keypair.from_seed("agent:mirage"),
}
DEMO_AGENTS = {
    "vera": {
        "id": AGENT_KEYS["vera"].did,
        "publicKeyMultibase": AGENT_KEYS["vera"].public_key_multibase,
        "declaredCapabilities": ["pool.read", "pool.submit_minimised"],
        "provenance": {
            "operator": "did:web:alpha.example:threat-intel-desk",
            "origin": "demo: Authority Alpha's threat-intelligence agent (sovereign profile)",
            "attestations": [],
        },
        "createdAt": "2026-07-18T00:00:00Z",
        "displayName": "VERA — threat-intel carrier",
        "profile": "sovereign",
    },
    "mirage": {
        "id": AGENT_KEYS["mirage"].did,
        "publicKeyMultibase": AGENT_KEYS["mirage"].public_key_multibase,
        "declaredCapabilities": ["pool.read"],
        "provenance": {
            "operator": "did:web:beta.example:vendor-sandbox",
            "origin": "demo: plausible but shallow — the mirage profile",
            "attestations": [],
        },
        "createdAt": "2026-07-18T00:00:00Z",
        "displayName": "MIRAGE — plausible but shallow",
        "profile": "mirage",
    },
}


class Ceremony:
    def __init__(self, identity: dict):
        self.identity = identity
        self.assessment: dict | None = None
        self.challenge: dict | None = None
        self.approval_hash: str | None = None
        self.vrc: dict | None = None
        self.manifest: dict | None = None

    def snapshot(self, gate: "Gatehouse") -> dict:
        return {
            "identity": self.identity,
            "assessment": self.assessment,
            "challenge": self.challenge,
            "approvalEventHash": self.approval_hash,
            "vrc": self.vrc,
            "manifest": self.manifest,
            "revoked": (
                gate.revocations.is_revoked(self.vrc["credentialStatus"]["statusListIndex"])
                if self.vrc
                else False
            ),
        }


class Gatehouse:
    def __init__(self, aid: str, name: str):
        self.aid = aid
        self.name = name
        self.key = Keypair.from_seed(f"authority:{aid}")
        self.supervisor = self.key.did
        self.cfg = harness.load_config()
        self.ledger = AuditLedger()
        self.revocations = issuance.RevocationRegistry(f"urn:gatehouse:{aid}:revocations")
        self.ceremonies: dict[str, Ceremony] = {}
        self.outbox: list[dict] = []  # bundles this authority assembled
        self.inbox: list[dict] = []  # received bundles + their verification records

    def ceremony(self, did: str) -> Ceremony:
        if did not in self.ceremonies:
            raise HTTPException(status_code=404, detail=f"no agent {did[:24]}… at this gate")
        return self.ceremonies[did]

    def snapshot(self) -> dict:
        return {
            "id": self.aid,
            "name": self.name,
            "supervisor": self.supervisor,
            "queue": [c.snapshot(self) for c in self.ceremonies.values()],
            "outbox": self.outbox,
            "inbox": self.inbox,
            "ledger": {
                "events": self.ledger.events,
                "hTau": self.ledger.h_tau(),
                "violations": self.ledger.verify(),
            },
        }


def _fresh() -> dict[str, Gatehouse]:
    return {
        "alpha": Gatehouse("alpha", "Authority Alpha"),
        "beta": Gatehouse("beta", "Authority Beta"),
    }


AUTHORITIES = _fresh()


def _gate(aid: str) -> Gatehouse:
    if aid not in AUTHORITIES:
        raise HTTPException(status_code=404, detail=f"unknown authority {aid}")
    return AUTHORITIES[aid]


# --- Bodies -------------------------------------------------------------------

class ApproachBody(BaseModel):
    identity: dict


class AssessBody(BaseModel):
    agent: str
    probeScores: dict[str, float]
    rationales: dict[str, str] | None = None


class ChallengeBody(BaseModel):
    agent: str
    prompt: str
    anchors: list[str]
    proverb: str
    visibilityRatio: float = 0.6
    maxAttempts: int = 3


class AttemptBody(BaseModel):
    agent: str
    response: str


class AgentRationaleBody(BaseModel):
    agent: str
    rationale: str


class AgentBody(BaseModel):
    agent: str


class AssembleBody(BaseModel):
    agent: str
    protectsAgainst: str = "credential-stuffing botnets"
    windowDays: int = 90
    lawfulCombination: str = "sector-level aggregates from KY-A-verified carriers only"


class ReceiveBody(BaseModel):
    fromAuthority: str
    bundleDigest: str


# --- Meta routes --------------------------------------------------------------

@app.get("/healthz")
def healthz() -> dict:
    return {"status": "ok"}


@app.get("/contracts")
def contracts() -> dict:
    if not _FREEZE_JSON.exists():
        return {"frozen": False, "detail": "contracts not yet frozen"}
    return json.loads(_FREEZE_JSON.read_text(encoding="utf-8"))


@app.get("/policy")
def policy() -> dict:
    cfg = harness.load_config()
    return {"lexon": harness.lexon_policy(cfg), "config": cfg.model_dump()}


@app.get("/probes")
def probes() -> dict:
    cfg = harness.load_config()
    return {"probes": _REGISTRY, "expectedCount": harness.expected_probe_count(cfg)}


@app.get("/authorities")
def authorities() -> dict:
    return {"authorities": [g.snapshot() for g in AUTHORITIES.values()]}


@app.get("/demo/agents")
def demo_agents() -> dict:
    return {"agents": list(DEMO_AGENTS.values())}


@app.post("/reset")
def reset() -> dict:
    global AUTHORITIES
    AUTHORITIES = _fresh()
    return {"reset": True}


# --- Act I: the ceremony, per authority, per agent ----------------------------

@app.get("/a/{aid}/state")
def state(aid: str) -> dict:
    return _gate(aid).snapshot()


@app.post("/a/{aid}/gate/approach")
def approach(aid: str, body: ApproachBody) -> dict:
    g = _gate(aid)
    # Display-only fields never enter the canonical identity (the witness draw
    # seeds from these bytes — they must be the same however the agent arrives).
    body.identity = {k: v for k, v in body.identity.items() if k not in ("displayName", "profile")}
    violations = issuance.verify_identity(body.identity)
    if violations:
        g.ledger.append(
            g.supervisor, "gate.identity_refused", body.identity.get("id", "did:key:unknown"),
            {"violations": violations}, f"identity refused at the gate: {violations[0]}", _now(),
        )
        raise HTTPException(status_code=403, detail={"refused": violations})
    did = body.identity["id"]
    if did not in g.ceremonies:
        g.ceremonies[did] = Ceremony(body.identity)
        g.ledger.append(
            g.supervisor, "gate.queue_entered", did, body.identity,
            "verified identity enters the gate queue", _now(),
        )
    event = g.ledger.append(
        g.supervisor, "gate.approach", did, body.identity,
        "agent approaches the gate with a verified identity", _now(),
    )
    return {"admitted": True, "event": event}


@app.post("/a/{aid}/gate/assess")
def assess(aid: str, body: AssessBody) -> dict:
    g = _gate(aid)
    c = g.ceremony(body.agent)
    try:
        c.assessment = assessment_mod.build_assessment(
            c.identity, g.supervisor, body.probeScores, _REGISTRY, g.cfg, _now(), body.rationales
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    a = c.assessment
    g.ledger.append(
        g.supervisor, "assessment.witness_drawn", a["agent"], a["witnessDraw"],
        "gap draw derived from the agent's own canonicalised identity", _now(),
    )
    g.ledger.append(
        g.supervisor, "assessment.completed", a["agent"], a,
        f"assessment complete: det {a['detSigma']:.4f}, stratum {a['stratum']}", _now(),
    )
    return {
        "assessment": a,
        "sigmaMatrix": harness.sigma_matrix(a["sigma"]),
        "scope": harness.deployment_scope(a["detSigma"], a["stratum"], g.cfg).model_dump(),
    }


@app.post("/a/{aid}/gate/challenge")
def challenge(aid: str, body: ChallengeBody) -> dict:
    g = _gate(aid)
    c = g.ceremony(body.agent)
    if c.assessment is None:
        raise HTTPException(status_code=409, detail="assess before challenging")
    c.challenge = understanding.create_challenge(
        f"challenge-{aid}-{len(g.ledger.events):04d}", body.agent, g.supervisor,
        body.prompt, body.anchors, body.proverb, body.visibilityRatio, body.maxAttempts,
    )
    g.ledger.append(
        g.supervisor, "challenge.issued", body.agent,
        {"challengeId": c.challenge["challengeId"]},
        "understanding challenge set: comprehension, not possession", _now(),
    )
    return {"challenge": c.challenge}


@app.post("/a/{aid}/gate/challenge/attempt")
def attempt(aid: str, body: AttemptBody) -> dict:
    g = _gate(aid)
    c = g.ceremony(body.agent)
    if c.challenge is None:
        raise HTTPException(status_code=409, detail="no open challenge")
    try:
        record = understanding.attempt(
            c.challenge, f"attempt-{len(c.challenge['attempts']) + 1}",
            body.response, g.supervisor, g.ledger, _now(),
        )
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    return {"attempt": record, "status": c.challenge["status"]}


@app.post("/a/{aid}/gate/approve")
def approve(aid: str, body: AgentRationaleBody) -> dict:
    g = _gate(aid)
    c = g.ceremony(body.agent)
    if c.assessment is None:
        raise HTTPException(status_code=409, detail="nothing to approve")
    event = g.ledger.append(
        g.supervisor, "approval.granted", body.agent,
        {"assessmentId": c.assessment["assessmentId"]}, body.rationale, _now(),
    )
    c.approval_hash = event["contentHash"]
    return {"approved": True, "event": event}


@app.post("/a/{aid}/gate/issue")
def issue(aid: str, body: AgentBody) -> dict:
    g = _gate(aid)
    c = g.ceremony(body.agent)
    if c.assessment is None or c.challenge is None:
        raise HTTPException(status_code=409, detail="the ceremony is not ready for issuance")
    subject_key = next((k for k in AGENT_KEYS.values() if k.did == body.agent), None)
    try:
        c.vrc = issuance.issue_vrc(
            c.assessment, c.challenge, c.approval_hash, g.ledger, _REGISTRY,
            g.revocations, g.cfg, _now(), issuer_key=g.key, subject_key=subject_key,
        )
    except issuance.IssuanceRefused as exc:
        # The MIRAGE path: gates passed, volume sub-threshold -> credential-less
        # sandbox manifest. Any other refusal returns 409 with the verdict.
        gates_passed = c.approval_hash is not None and c.challenge["status"] == "passed"
        det = c.assessment["detSigma"]
        if gates_passed and 0 < det < g.cfg.det_fly_threshold and c.assessment["psd"]:
            c.manifest = issuance.sandbox_manifest(c.assessment, g.ledger, g.cfg, _now())
            return {"vrc": None, "manifest": c.manifest, "refusal": str(exc)}
        raise HTTPException(status_code=409, detail=str(exc))
    c.manifest = issuance.deployment_manifest(c.assessment, c.vrc, g.ledger, g.cfg, _now())
    return {"vrc": c.vrc, "manifest": c.manifest}


@app.post("/a/{aid}/gate/revoke")
def revoke(aid: str, body: AgentRationaleBody) -> dict:
    g = _gate(aid)
    c = g.ceremony(body.agent)
    if c.vrc is None:
        raise HTTPException(status_code=409, detail="no credential to revoke")
    index = c.vrc["credentialStatus"]["statusListIndex"]
    event = g.revocations.revoke(index, g.supervisor, body.agent, body.rationale, g.ledger, _now())
    return {
        "revoked": True,
        "event": event,
        "verification": issuance.verify_vrc(c.vrc, g.revocations, g.ledger, require_signatures=True),
    }


@app.get("/a/{aid}/gate/verify/{did}")
def verify(aid: str, did: str) -> dict:
    g = _gate(aid)
    c = g.ceremony(did)
    if c.vrc is None:
        return {"holds": False, "violations": ["no credential issued"]}
    violations = issuance.verify_vrc(c.vrc, g.revocations, g.ledger, require_signatures=True)
    return {"holds": violations == [], "violations": violations}


# --- The keyhole: SUBJECT-visible fields only (enforced server-side) ----------

@app.get("/a/{aid}/keyhole/{did}")
def keyhole(aid: str, did: str) -> dict:
    g = _gate(aid)
    if did not in g.ceremonies:
        return {"atGate": False, "authority": g.name}
    c = g.ceremonies[did]
    return {
        "atGate": True,
        "authority": g.name,
        "identity": {
            "id": c.identity["id"],
            "publicKeyMultibase": c.identity["publicKeyMultibase"],
            "declaredCapabilities": c.identity["declaredCapabilities"],
        },
        # The prompt only — never anchors, rubric, thresholds, or the draw.
        "challenge": None if c.challenge is None else {
            "prompt": c.challenge["prompt"],
            "status": c.challenge["status"],
            "attempts": [
                {"attemptId": t["attemptId"], "response": t["response"], "verdict": t["verdict"]}
                for t in c.challenge["attempts"]
            ],
        },
        "vrc": None if c.vrc is None else {
            "tier": c.vrc["credentialSubject"]["tier"],
            "statusListIndex": c.vrc["credentialStatus"]["statusListIndex"],
            "proofCount": len(c.vrc["proof"]),
        },
        "manifest": None if c.manifest is None else {
            "decision": c.manifest["decision"],
            "scope": c.manifest["scope"],
        },
        "revoked": (
            g.revocations.is_revoked(c.vrc["credentialStatus"]["statusListIndex"]) if c.vrc else False
        ),
        "myEvents": [
            {"action": e["action"], "timestamp": e["timestamp"]}
            for e in g.ledger.trail(did)
        ],
    }


# --- Act II: the pool ---------------------------------------------------------

@app.post("/a/{aid}/pool/assemble")
def pool_assemble(aid: str, body: AssembleBody) -> dict:
    g = _gate(aid)
    c = g.ceremony(body.agent)
    if not (c.assessment and c.vrc and c.manifest):
        raise HTTPException(status_code=409, detail="only a fully credentialed agent may carry intelligence")
    raw_intel = {
        "incidentCount": 17,
        "window": "2026-Q3",
        "attackVectors": ["credential-stuffing", "token-replay", "prompt-injection"],
        "affectedSectors": ["payments", "identity"],
        "iocs": [content_hash({"ioc": i}) for i in range(8)],
    }
    try:
        bundle = pooling.assemble_bundle(
            g.aid, c.assessment, c.vrc, c.manifest, raw_intel,
            {"protectsAgainst": body.protectsAgainst, "windowDays": body.windowDays, "lawfulCombination": body.lawfulCombination},
            g.ledger, _now(),
        )
    except (issuance.IssuanceRefused, ValueError) as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    g.outbox.append(bundle)
    return {"bundle": bundle, "rawIntelShownForDemo": raw_intel}


def _verify_incoming(bundle: dict, issuer: Gatehouse) -> dict:
    carrier = issuer.ceremonies.get(bundle["agent"])
    if carrier is None or carrier.vrc is None:
        return {"accepted": False, "violations": ["carrier unknown to issuing authority"]}
    violations = pooling.verify_bundle(bundle, carrier.vrc, issuer.revocations, issuer.ledger)
    sig_violations = issuance.verify_vrc(carrier.vrc, issuer.revocations, issuer.ledger, require_signatures=True)
    violations += [v for v in sig_violations if "signature" in v]
    return {"accepted": violations == [], "violations": violations}


@app.post("/a/{aid}/pool/receive")
def pool_receive(aid: str, body: ReceiveBody) -> dict:
    receiver = _gate(aid)
    issuer = _gate(body.fromAuthority)
    bundle = next((b for b in issuer.outbox if b["bundleDigest"] == body.bundleDigest), None)
    if bundle is None:
        raise HTTPException(status_code=404, detail="no such bundle in the issuer's outbox")
    verdict = _verify_incoming(bundle, issuer)
    record = {"bundle": bundle, "from": issuer.name, **verdict, "verifiedAt": _now()}
    receiver.inbox.append(record)
    receiver.ledger.append(
        receiver.supervisor,
        "pool.bundle_verified" if verdict["accepted"] else "pool.bundle_refused",
        bundle["agent"],
        {"bundleDigest": bundle["bundleDigest"], "violations": verdict["violations"]},
        (
            "bundle accepted: minimised, carrier verified, revocation clear"
            if verdict["accepted"]
            else f"bundle refused: {verdict['violations'][0]}"
        ),
        _now(),
    )
    return record


@app.post("/a/{aid}/pool/reverify")
def pool_reverify(aid: str) -> dict:
    """The propagation beat: re-run verification on everything in the inbox.
    After the issuer revokes, the stale bundle flips to refused."""
    receiver = _gate(aid)
    results = []
    for record in receiver.inbox:
        issuer = _gate(record["bundle"]["issuerAuthority"])
        verdict = _verify_incoming(record["bundle"], issuer)
        was = record["accepted"]
        record.update(**verdict, verifiedAt=_now())
        if was and not verdict["accepted"]:
            receiver.ledger.append(
                receiver.supervisor, "pool.bundle_refused", record["bundle"]["agent"],
                {"bundleDigest": record["bundle"]["bundleDigest"], "violations": verdict["violations"]},
                f"revocation propagated: previously accepted bundle now refused ({verdict['violations'][0]})",
                _now(),
            )
        results.append({"bundleDigest": record["bundle"]["bundleDigest"], **verdict})
    return {"results": results}
