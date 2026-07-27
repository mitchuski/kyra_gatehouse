"""Act II: two-authority intelligence pooling (build plan section 3).

Only KY-A-verified agents may carry intelligence into the pool. An attestation
bundle is MINIMISED BY CONSTRUCTION against a demo pooling census:

    counts        -> thresholds   (17 incidents -> ">= 10")
    timestamps    -> windows      (first/last seen -> a quarter window)
    enumerations  -> cardinalities (vector list -> "3 distinct vectors")
    raw artifacts -> one digest    (IOC list -> a single content hash)

Every bundle carries three parameters ON ITS FACE: against whom it protects,
for how long, and alongside what it may lawfully be combined. The receiving
authority verifies OFFLINE from the bundle bytes — canon recompute, credential
gates, manifest decision — plus ONE public lookup: the issuer's revocation
status list (the same public rail an ERC-8004 anchor would ride). Revocation
therefore propagates: the issuer revokes, and the next verification anywhere
refuses the stale bundle.

The reconstruction-ceiling number reported here (disclosureRatio < 1) is an
ILLUSTRATIVE bit-accounting of the demo census — the minimisation INVARIANT
(no raw field survives into a bundle) is the enforced claim; the formal R < 1
statement stays OPEN in the evidence table until proven.
"""

from gatehouse_contracts.canon import content_hash

from gatehouse_verify import issuance
from gatehouse_verify.ledger import AuditLedger

# The demo pooling census: which raw fields exist, and the ONLY minimised
# forms allowed to leave the gate. A bundle containing any raw key is refused.
RAW_FIELDS = ("incidentCount", "firstSeen", "lastSeen", "attackVectors", "affectedSectors", "iocs")
ALLOWED_CLAIM_KEYS = {
    "incidentCountThreshold",
    "activityWindow",
    "attackVectorCardinality",
    "affectedSectorCardinality",
    "iocSetDigest",
}
# Rough bit-accounting for the demo census (per field: raw bits vs disclosed bits).
_RAW_BITS = {"incidentCount": 32, "firstSeen": 64, "lastSeen": 64, "attackVectors": 3 * 128, "affectedSectors": 2 * 128, "iocs": 8 * 256}
_DISCLOSED_BITS = {"incidentCountThreshold": 4, "activityWindow": 6, "attackVectorCardinality": 3, "affectedSectorCardinality": 3, "iocSetDigest": 256}


def _threshold(count: int) -> str:
    floor = 1
    while floor * 10 <= count:
        floor *= 10
    return f">={min(count // floor * floor, count)}" if count >= 10 else ">=1"


def minimise(raw: dict) -> dict:
    """The census transform. Raw intelligence in, minimised claims out."""
    return {
        "incidentCountThreshold": _threshold(int(raw["incidentCount"])),
        "activityWindow": raw["window"],  # supplied as a coarse window label, e.g. "2026-Q3"
        "attackVectorCardinality": len(raw["attackVectors"]),
        "affectedSectorCardinality": len(raw["affectedSectors"]),
        "iocSetDigest": content_hash(sorted(raw["iocs"])),
    }


def disclosure_ratio() -> float:
    """Illustrative: disclosed bits / raw bits for the demo census (< 1)."""
    return round(sum(_DISCLOSED_BITS.values()) / sum(_RAW_BITS.values()), 4)


def assemble_bundle(
    authority_id: str,
    assessment: dict,
    vrc: dict,
    manifest: dict,
    raw_intel: dict,
    face: dict,
    ledger: AuditLedger,
    timestamp: str,
) -> dict:
    """Authority-side assembly. Requires a flying manifest; refuses otherwise."""
    if manifest["decision"] != "fly":
        raise issuance.IssuanceRefused(f"only a flying agent may carry intelligence (decision: {manifest['decision']})")
    for key in ("protectsAgainst", "windowDays", "lawfulCombination"):
        if not face.get(key):
            raise ValueError(f"bundle face parameter missing: {key}")
    body = {
        "bundleType": "threat-intel-attestation",
        "issuerAuthority": authority_id,
        "issuer": vrc["issuer"],
        "agent": assessment["agent"],
        "claims": minimise(raw_intel),
        "face": {
            "protectsAgainst": face["protectsAgainst"],
            "windowDays": int(face["windowDays"]),
            "lawfulCombination": face["lawfulCombination"],
        },
        "assessmentDigest": content_hash(assessment),
        "vrcDigest": content_hash(vrc),
        "manifestId": manifest["manifestId"],
        "credentialStatus": vrc["credentialStatus"],
        "disclosureRatio": disclosure_ratio(),
        "assembledAt": timestamp,
    }
    bundle = {**body, "bundleDigest": content_hash(body)}
    ledger.append(
        vrc["issuer"], "pool.bundle_assembled", assessment["agent"],
        {"bundleDigest": bundle["bundleDigest"], "claims": bundle["claims"]},
        f"minimised attestation bundle assembled (disclosure ratio {bundle['disclosureRatio']})",
        timestamp,
    )
    return bundle


def verify_bundle(bundle: dict, issuer_vrc: dict, issuer_revocations: issuance.RevocationRegistry, issuer_ledger: AuditLedger) -> list[str]:
    """Receiving-authority verification. Everything from the bytes, except the
    ONE public lookup: the issuer's revocation status list. Violations; empty = accepted."""
    violations: list[str] = []

    body = {k: v for k, v in bundle.items() if k != "bundleDigest"}
    if content_hash(body) != bundle.get("bundleDigest"):
        violations.append("bundle digest does not recompute")

    claims = bundle.get("claims", {})
    raw_present = [k for k in claims if k not in ALLOWED_CLAIM_KEYS]
    raw_present += [k for k in RAW_FIELDS if k in bundle or k in claims]
    if raw_present:
        violations.append(f"minimisation violated: raw or unknown fields {sorted(set(raw_present))}")
    missing = ALLOWED_CLAIM_KEYS - claims.keys()
    if missing:
        violations.append(f"claims incomplete: missing {sorted(missing)}")

    face = bundle.get("face", {})
    for key in ("protectsAgainst", "windowDays", "lawfulCombination"):
        if not face.get(key):
            violations.append(f"face parameter missing: {key}")

    if content_hash(issuer_vrc) != bundle.get("vrcDigest"):
        violations.append("carrier credential does not match the bundle's vrcDigest")
    violations += [f"carrier credential: {v}" for v in issuance.verify_vrc(issuer_vrc, issuer_revocations, issuer_ledger)]

    return violations
