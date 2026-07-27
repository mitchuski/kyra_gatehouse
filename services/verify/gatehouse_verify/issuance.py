"""WP2: VRC issuance, revocation, and the policy gates around them.

The ceremony in one sentence: an agent whose identity verifies (Spoof Refusal),
whose assessment recomputes and flies (Variance), whose understanding passed
(gate two) and whose supervisor approved on the record (gate one), receives a
bilateral W3C-VC-2.0-shaped VRC whose every evidence hash points into the audit
ledger — and the supervisor can revoke it, which fails verification everywhere,
immediately.

Policy decision of record (session 3): a VRC issues ONLY at verdict VALIDATED.
A MIRAGE agent (positive but sub-threshold volume, or an unpassed gate) runs
sandboxed WITHOUT a credential under supervisor watch — sandbox scope comes
from the DeploymentManifest, not from a weaker credential. One credential
class, no asterisks on it.

Cryptographic proofValues are the identity adapter's concern (apps/agent-client,
where the late-bound provider signs); this module enforces STRUCTURE: exactly
two proofs, two distinct parties, both TSP roles.
"""

from gatehouse_contracts.canon import GENESIS_HASH, content_hash
from gatehouse_contracts.verdicts import VERDICT_TO_DECISION

from gatehouse_verify import harness
from gatehouse_verify.keys import Keypair, verify_signature
from gatehouse_verify.ledger import AuditLedger
from gatehouse_verify.understanding import challenge_passed

REVOCATION_LIST_TYPE = "RevocationList2026"
VC_CONTEXT = ["https://www.w3.org/ns/credentials/v2"]
VC_TYPES = ["VerifiableCredential", "VerifiableRelationshipCredential"]


class IssuanceRefused(Exception):
    """Raised with the gate that refused; the reason is audit-rationale-ready."""


def verify_identity(identity: dict) -> list[str]:
    """Spoof Refusal (the fifth Lexon clause): an identity that does not verify
    is refused BEFORE assessment. did:key must bind its own multibase; did:web
    and did:cid are shape-checked here and resolved by the adapter lane."""
    violations: list[str] = []
    did = identity.get("id", "")
    method = did.split(":")[1] if did.count(":") >= 2 else ""
    if method not in ("key", "web", "cid"):
        violations.append(f"unsupported or malformed DID: {did!r}")
        return violations
    if method == "key" and did != f"did:key:{identity.get('publicKeyMultibase', '')}":
        violations.append("did:key does not bind publicKeyMultibase: spoofed identity")
    if not identity.get("publicKeyMultibase"):
        violations.append("identity carries no public key")
    return violations


class RevocationRegistry:
    """The supervisor's revocation list. Revocation is a ledger event, always."""

    def __init__(self, status_list_ref: str):
        self.statusListRef = status_list_ref
        self._revoked: set[int] = set()
        self._next_index = 0

    def allocate(self) -> int:
        index = self._next_index
        self._next_index += 1
        return index

    def is_revoked(self, index: int) -> bool:
        return index in self._revoked

    def revoke(
        self, index: int, supervisor: str, subject: str, rationale: str, ledger: AuditLedger, timestamp: str
    ) -> dict:
        self._revoked.add(index)
        return ledger.append(
            actor=supervisor,
            action="vrc.revoked",
            subject=subject,
            payload={"statusListRef": self.statusListRef, "statusListIndex": index},
            rationale=rationale,
            timestamp=timestamp,
        )


def issue_vrc(
    assessment: dict,
    challenge: dict,
    approval_event_hash: str | None,
    ledger: AuditLedger,
    registry: list[dict],
    revocations: RevocationRegistry,
    cfg: harness.HarnessConfig,
    timestamp: str,
    issuer_key: Keypair | None = None,
    subject_key: Keypair | None = None,
) -> dict:
    """The two-gates ceremony. Raises IssuanceRefused naming the failed gate."""
    violations = harness.validate_assessment(assessment, registry, cfg)
    if violations:
        raise IssuanceRefused(f"assessment does not recompute: {violations}")

    h_tau = ledger.h_tau()
    audit_ok = not ledger.verify() and h_tau >= cfg.h_tau_gate
    approval_event = ledger.find(approval_event_hash) if approval_event_hash else None
    approved = approval_event is not None and approval_event["action"] == "approval.granted"
    passed = challenge_passed(challenge)

    v = harness.verdict(assessment, audit_ok=audit_ok, challenge_ok=passed, approved=approved)
    if v != "VALIDATED":
        refusal = {
            "BLOCKED": "hard constraint violated (collapsed volume or broken chain)",
            "MIRAGE": "a held-out gate did not pass (approval, understanding, or sub-threshold volume)",
        }[v]
        ledger.append(
            actor=assessment["supervisor"],
            action="vrc.refused",
            subject=assessment["agent"],
            payload={"verdict": v, "decision": VERDICT_TO_DECISION[v]},
            rationale=f"issuance refused at verdict {v}: {refusal}",
            timestamp=timestamp,
        )
        raise IssuanceRefused(f"{v}: {refusal}")

    challenge_event_hash = challenge["attempts"][-1]["auditEventHash"]
    status_index = revocations.allocate()
    tau_count = len(ledger.trail(assessment["agent"]))
    signature = challenge["expectedComprehensionSignature"]
    vrc = {
        "@context": VC_CONTEXT,
        "type": VC_TYPES,
        "issuer": assessment["supervisor"],
        "validFrom": timestamp,
        "credentialSubject": {
            "id": assessment["agent"],
            "tier": assessment["tier"],
            "stratum": assessment["stratum"],
            "assessmentDigest": content_hash(assessment),
            "relationship": {
                "tauCount": tau_count,
                "hTau": h_tau,
                "aTau": harness.a_tau(tau_count, h_tau),
                "proverbCommitment": signature["proverbCommitment"],
                "visibilityRatio": signature["visibilityRatio"],
            },
        },
        "evidence": [
            {"type": "SupervisorApproval", "auditEventHash": approval_event_hash},
            {"type": "UnderstandingChallengeAttempt", "auditEventHash": challenge_event_hash},
        ],
        "credentialStatus": {
            "type": REVOCATION_LIST_TYPE,
            "statusListRef": revocations.statusListRef,
            "statusListIndex": status_index,
        },
    }
    # The bilateral proofs. With keys: REAL ed25519 over the credential body's
    # canonical bytes (both parties sign the same bytes — the TSP relationship
    # made cryptographic). Without keys (fixture paths): structural stubs.
    def _proof(party_did: str, key: Keypair | None, fallback: str) -> dict:
        return {
            "type": "DataIntegrityProof",
            "verificationMethod": f"{party_did}#key-1" if key else f"{party_did}#k1",
            "created": timestamp,
            "proofPurpose": "assertionMethod",
            "proofValue": key.sign(vrc) if key else "z" + content_hash(fallback),
        }

    vrc["proof"] = [
        _proof(assessment["supervisor"], issuer_key, approval_event_hash or GENESIS_HASH),
        _proof(assessment["agent"], subject_key, challenge_event_hash),
    ]
    ledger.append(
        actor=assessment["supervisor"],
        action="vrc.issued",
        subject=assessment["agent"],
        payload={"vrcDigest": content_hash(vrc), "statusListIndex": status_index},
        rationale=f"both gates passed at det {assessment['detSigma']}: credential issues at tier {assessment['tier']}",
        timestamp=timestamp,
    )
    return vrc


def verify_vrc(
    vrc: dict,
    revocations: RevocationRegistry,
    ledger: AuditLedger,
    require_signatures: bool = False,
) -> list[str]:
    """Verification a relying party runs. Violations list; empty = the credential holds.

    With require_signatures, both proofs must be REAL ed25519 signatures by
    the did:key parties over the credential body's canonical bytes (fixture
    paths with structural stubs pass require_signatures=False)."""
    violations: list[str] = []
    if require_signatures:
        body = {k: v for k, v in vrc.items() if k != "proof"}
        for proof in vrc.get("proof", []):
            party = proof["verificationMethod"].split("#")[0]
            if not verify_signature(party, body, proof["proofValue"]):
                violations.append(f"signature does not verify for {party[:24]}…")
    status = vrc.get("credentialStatus", {})
    if revocations.is_revoked(status.get("statusListIndex", -1)):
        violations.append("credential is revoked")  # fails everywhere, immediately
    kinds = {e["type"] for e in vrc.get("evidence", [])}
    if not {"SupervisorApproval", "UnderstandingChallengeAttempt"} <= kinds:
        violations.append("evidence does not carry both gates")
    for e in vrc.get("evidence", []):
        if ledger.find(e["auditEventHash"]) is None:
            violations.append(f"evidence not anchored in the ledger: {e['auditEventHash'][:12]}")
    proofs = vrc.get("proof", [])
    parties = {p["verificationMethod"].split("#")[0] for p in proofs}
    if len(proofs) != 2 or len(parties) != 2:
        violations.append("credential is not bilateral")
    if ledger.verify():
        violations.append("the audit chain behind the credential is broken")
    return violations


def sandbox_manifest(
    assessment: dict, ledger: AuditLedger, cfg: harness.HarnessConfig, timestamp: str
) -> dict:
    """The MIRAGE path: both gates passed but the volume is sub-threshold, so
    NO credential issues — instead a credential-less manifest grants the
    sandbox-capped scope (vrcDigest = the zero digest, meaning 'no credential').
    A BLOCKED agent gets nothing at all — that is manifest.held territory."""
    manifest = harness.derive_manifest(assessment, "0" * 64, cfg)
    if manifest["decision"] == "fly":
        raise ValueError("sandbox_manifest called for a flying assessment — issue the credential instead")
    manifest["predicate"]["hTau"] = ledger.h_tau()
    manifest["issuedAt"] = timestamp
    manifest["manifestId"] = content_hash({k: v for k, v in manifest.items() if k != "manifestId"})
    ledger.append(
        assessment["supervisor"],
        "manifest.issued",
        assessment["agent"],
        manifest,
        f"sandbox scope granted WITHOUT credential: verdict {manifest['verdict']} at det {manifest['detSigma']:.4f}",
        timestamp,
    )
    return manifest


def deployment_manifest(
    assessment: dict, vrc: dict, ledger: AuditLedger, cfg: harness.HarnessConfig, timestamp: str
) -> dict:
    """The dragon-flight record: harness states the law, the service supplies
    the live h(tau) reading, and the manifest lands on the ledger."""
    manifest = harness.derive_manifest(assessment, content_hash(vrc), cfg)
    manifest["predicate"]["hTau"] = ledger.h_tau()
    manifest["issuedAt"] = timestamp
    manifest["revocationRef"] = (
        f"{vrc['credentialStatus']['statusListRef']}#{vrc['credentialStatus']['statusListIndex']}"
    )
    manifest["manifestId"] = content_hash({k: v for k, v in manifest.items() if k != "manifestId"})
    ledger.append(
        actor=assessment["supervisor"],
        action="manifest.issued",
        subject=assessment["agent"],
        payload=manifest,
        rationale=f"scope granted as a function of variance: {manifest['decision']} at det {manifest['detSigma']}",
        timestamp=timestamp,
    )
    return manifest
