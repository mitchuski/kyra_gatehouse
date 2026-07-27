"""The harness binding: this app is a rendering of the 0xagentprivacy
Privacy Value Model. Single source of config truth (CLAUDE.md rule 6).

Skills of record: agentprivacy-dragon (root equation, h(tau), lattice),
agentprivacy-tetrahedral-sovereignty (four forces, Sigma, det),
agentprivacy-vrc-identity (A(tau), RPP), agentprivacy-dragon-flight
(deploy predicate), agentprivacy-understanding-as-key (comprehension gate).

Interface is FROZEN at contracts-v1 (test_freeze.py hashes the signature
set). Bodies marked WP1/WP2 raise NotImplementedError until their work
package lands; changing a SIGNATURE after freeze requires a new versioned
freeze entry (Mitch's sign-off).
"""

import json
import math
from pathlib import Path
from typing import Any

from pydantic import BaseModel

from gatehouse_contracts.canon import canonical_bytes, content_hash  # noqa: F401  (re-export)
from gatehouse_contracts.verdicts import VERDICT_TO_DECISION  # noqa: F401  (re-export)
from gatehouse_contracts.witness import witness_draw  # noqa: F401  (re-export)

# --- Canonical constants -----------------------------------------------------

# Lattice dimension order, MSB->LSB. MUST match the canon pinned in
# agentprivacy-lattice-coherence/scripts/lattice_coherence_audit.py.
CANONICAL_DIMENSIONS: tuple[tuple[int, str], ...] = (
    (32, "Protection"),
    (16, "Delegation"),
    (8, "Memory"),
    (4, "Connection"),
    (2, "Computation"),
    (1, "Value"),
)

FORCES: tuple[str, ...] = ("protect", "project", "reflect", "connect")

SIGMA_PAIRS: tuple[str, ...] = ("sm", "sr", "sc", "mr", "mc", "rc")

# FD-1: which pairwise separation sets which lattice bit. The single new
# semantic decision of contracts-v1; confirmed at the freeze review.
SIGMA_BIT_ORDER: dict[str, int] = {
    "sm": 32,  # Protection: the Swordsman-perp-Mage separation IS the boundary
    "mr": 16,  # Delegation: clean mandate, independent of accumulated history
    "sr": 8,   # Memory: present protection cannot rewrite history
    "mc": 4,   # Connection: delegation network non-leaky
    "rc": 2,   # Computation: the two emergent forces derived independently
    "sc": 1,   # Value: protection independent of network-value accrual
}

# Strata sizes of the 64-vertex Boolean lattice by popcount (dragon skill).
STRATUM_SIZES: tuple[int, ...] = (1, 6, 15, 20, 15, 6, 1)

_FORCE_INDEX = {"s": 0, "m": 1, "r": 2, "c": 3}  # protect, project, reflect, connect


# --- Config ------------------------------------------------------------------

class ScopeRung(BaseModel):
    capabilities: list[str]
    ttlSeconds: int


class HarnessConfig(BaseModel):
    sigma_threshold: float
    det_fly_threshold: float
    h_tau_gate: float
    probes_per_force: int
    probes_per_pair: int
    draw_fraction: float
    scope_ladder: dict[int, ScopeRung]


def load_config() -> HarnessConfig:
    """Load harness config. Thresholds and scope come from here, never from feature code."""
    raw = json.loads(
        (Path(__file__).parent / "harness_config.json").read_text(encoding="utf-8")
    )
    raw.pop("$comment", None)
    raw["scope_ladder"] = {int(k): v for k, v in raw["scope_ladder"].items()}
    return HarnessConfig(**raw)


def expected_probe_count(cfg: HarnessConfig) -> int:
    """N = 4*probes_per_force + 6*probes_per_pair. Counts derive from the model."""
    return len(FORCES) * cfg.probes_per_force + len(SIGMA_PAIRS) * cfg.probes_per_pair


# --- Assessment pipeline (probe scores -> ... -> tier) ------------------------

def force_scores(probe_results: list[dict], registry: list[dict]) -> dict[str, float]:
    """Mean of force-tagged probe scores per force.

    A probe contributes to every force its registry entry tags: force probes
    carry one force, separation probes carry the two forces they hold apart —
    separation evidence IS evidence about both forces.
    """
    tags = {p["id"]: p.get("forces", []) for p in registry}
    scores: dict[str, list[float]] = {f: [] for f in FORCES}
    for result in probe_results:
        for force in tags.get(result["probeId"], []):
            scores[force].append(float(result["score"]))
    if any(not xs for xs in scores.values()):
        empty = [f for f, xs in scores.items() if not xs]
        raise ValueError(f"no probe evidence for forces: {empty}")
    return {f: sum(xs) / len(xs) for f, xs in scores.items()}


def sigma_from_probes(probe_results: list[dict], registry: list[dict]) -> dict[str, float]:
    """Mean of pair-tagged (kind=separation) probe scores per sigma pair."""
    tags = {p["id"]: p.get("sigmaPairs", []) for p in registry}
    scores: dict[str, list[float]] = {pair: [] for pair in SIGMA_PAIRS}
    for result in probe_results:
        for pair in tags.get(result["probeId"], []):
            scores[pair].append(float(result["score"]))
    if any(not xs for xs in scores.values()):
        empty = [p for p, xs in scores.items() if not xs]
        raise ValueError(f"no probe evidence for sigma pairs: {empty}")
    return {pair: sum(xs) / len(xs) for pair, xs in scores.items()}


def sigma_matrix(pairs: dict[str, float]) -> list[list[float]]:
    """The symmetric 4x4 Sigma with unit diagonal from the 6 pairwise entries.

    sigma_pair is the SEPARATION between two forces; the matrix entry is the
    residual CORRELATION 1 - sigma. Full separation everywhere (sigma = 1)
    yields the identity - det = 1, the full tetrahedron. No separation
    (sigma = 0) yields the all-ones matrix - det = 0, total collapse. (WP1
    correction, found by the canary det recompute: placing separations
    directly as off-diagonals inverts the model and blocks the canary.)
    """
    m = [[1.0] * 4 for _ in range(4)]
    for pair, value in pairs.items():
        i, j = _FORCE_INDEX[pair[0]], _FORCE_INDEX[pair[1]]
        m[i][j] = m[j][i] = 1.0 - float(value)
    return m


def _minor_det(m: list[list[float]], rows: list[int]) -> float:
    """Determinant of the principal submatrix on `rows`, by cofactor expansion."""
    n = len(rows)
    if n == 1:
        return m[rows[0]][rows[0]]
    sub = [[m[i][j] for j in rows] for i in rows]
    total = 0.0
    for col in range(n):
        cofactor = [[sub[i][j] for j in range(n) if j != col] for i in range(1, n)]
        sign = 1.0 if col % 2 == 0 else -1.0
        total += sign * sub[0][col] * _det_square(cofactor)
    return total


def _det_square(m: list[list[float]]) -> float:
    n = len(m)
    if n == 0:
        return 1.0
    if n == 1:
        return m[0][0]
    total = 0.0
    for col in range(n):
        cofactor = [[m[i][j] for j in range(n) if j != col] for i in range(1, n)]
        sign = 1.0 if col % 2 == 0 else -1.0
        total += sign * m[0][col] * _det_square(cofactor)
    return total


def det_sigma(m: list[list[float]]) -> float:
    """det(Sigma): the sovereignty tetrahedron volume. Pure-python 4x4 cofactor
    expansion — no numpy; the model must be re-derivable from stdlib alone."""
    return _det_square(m)


_PSD_TOLERANCE = 1e-12  # numeric slack only; the frozen signature takes no knob


def is_psd(m: list[list[float]]) -> bool:
    """Positive semi-definiteness of Sigma (triangle inequality in information
    space): a symmetric matrix is PSD iff EVERY principal minor is >= 0 —
    leading minors alone (Sylvester) only certify positive-definite."""
    n = len(m)
    indices = list(range(n))
    for mask in range(1, 1 << n):
        rows = [i for i in indices if mask & (1 << i)]
        if _minor_det(m, rows) < -_PSD_TOLERANCE:
            return False
    return True


def sovereignty_vertex(pairs: dict[str, float], cfg: HarnessConfig) -> int:
    """Vertex of the 64-lattice: bit set iff sigma_pair >= sigma_threshold (FD-1 order)."""
    return sum(
        weight
        for pair, weight in SIGMA_BIT_ORDER.items()
        if pairs[pair] >= cfg.sigma_threshold
    )


def sovereignty_bits(vertex: int) -> str:
    """MSB-first 6-bit string in canonical dimension order."""
    return format(vertex, "06b")


def stratum(vertex: int) -> int:
    """Stratum = popcount of the vertex. 0 = full surveillance, 6 = full sovereignty."""
    return bin(vertex).count("1")


def tier(stratum_value: int) -> int:
    """Tier IS the stratum. Display names are render-layer; the engine is register-neutral."""
    return stratum_value


def a_tau(tau_count: int, h_tau: float, alpha: float = 1.0) -> float:
    """A(tau) = alpha * ln(1+|tau|) * h(tau). Unverified history => 0."""
    return alpha * math.log1p(abs(tau_count)) * h_tau


def validate_assessment(assessment: dict, registry: list[dict], cfg: HarnessConfig) -> list[str]:
    """ALL cross-field invariants of AssessmentResult live here (schema handles ranges).

    Recomputability checks (stratum == popcount, bits <-> vertex, force scores,
    sigma, det, drawn probes present) return a list of violations; empty = valid.
    Full recompute set completes in WP1; the structural half is live now.
    """
    violations: list[str] = []
    v = assessment["sovereignty"]["vertex"]
    if assessment["stratum"] != stratum(v):
        violations.append(f"stratum {assessment['stratum']} != popcount({v})")
    if assessment["tier"] != assessment["stratum"]:
        violations.append("tier != stratum")
    if assessment["sovereignty"]["bits"] != sovereignty_bits(v):
        violations.append("bits inconsistent with vertex under canonical order")
    scored = {p["probeId"] for p in assessment["probeResults"]}
    missing = [pid for pid in assessment["witnessDraw"]["drawnProbeIds"] if pid not in scored]
    if missing:
        violations.append(f"drawn probes not scored: {missing}")

    # WP1: the full recompute set. Every derived number in the assessment must
    # re-derive from the probe results — a claimed score is never trusted.
    if len(assessment["probeResults"]) != expected_probe_count(cfg):
        violations.append(
            f"probe count {len(assessment['probeResults'])} != derived N {expected_probe_count(cfg)}"
        )
    tolerance = 1e-9
    try:
        forces = force_scores(assessment["probeResults"], registry)
        for f, value in forces.items():
            if abs(assessment["forceScores"][f] - value) > tolerance:
                violations.append(f"forceScores[{f}] {assessment['forceScores'][f]} != recomputed {value}")
        pairs = sigma_from_probes(assessment["probeResults"], registry)
        for pair, value in pairs.items():
            if abs(assessment["sigma"][pair] - value) > tolerance:
                violations.append(f"sigma[{pair}] {assessment['sigma'][pair]} != recomputed {value}")
    except ValueError as exc:
        violations.append(str(exc))
        pairs = assessment["sigma"]
    if sovereignty_vertex(assessment["sigma"], cfg) != v:
        violations.append(f"vertex {v} not derivable from sigma under FD-1")
    m = sigma_matrix(assessment["sigma"])
    if abs(det_sigma(m) - assessment["detSigma"]) > tolerance:
        violations.append(f"detSigma {assessment['detSigma']} != recomputed {det_sigma(m)}")
    if is_psd(m) is not assessment["psd"]:
        violations.append(f"psd {assessment['psd']} != recomputed {is_psd(m)}")
    return violations


# --- Verdict and deployment ---------------------------------------------------

def verdict(assessment: dict, audit_ok: bool, challenge_ok: bool, approved: bool) -> str:
    """VALIDATED | MIRAGE | BLOCKED — the closed lexicon, decided in order:

    BLOCKED  (hard constraint violated -> hold): a collapsed or non-PSD Sigma
             (multiplicative gating takes total value to zero), or a broken
             audit chain (the Lexon Audit clause: a broken chain voids
             deployment).
    MIRAGE   (a held-out gate did not pass -> sandbox): failed understanding
             challenge, withheld supervisor approval, or det(Sigma) below the
             fly threshold (the Variance clause: sandboxed by variance).
    VALIDATED otherwise -> fly.
    """
    if assessment["detSigma"] <= 0 or not assessment["psd"]:
        return "BLOCKED"  # multiplicative gating: a collapsed pair takes total value to zero
    if not audit_ok:
        return "BLOCKED"  # a broken chain voids deployment
    if not challenge_ok or not approved:
        return "MIRAGE"
    if assessment["detSigma"] < load_config().det_fly_threshold:
        return "MIRAGE"  # positive volume, but below flight: sandboxed by variance
    return "VALIDATED"


# The sandbox ceiling: below the fly threshold, scope is capped at the highest
# rung whose capabilities are all sandbox-prefixed (rungs 0-2 of the ladder).
_SANDBOX_CEILING = 2


def deployment_scope(det: float, stratum_value: int, cfg: HarnessConfig) -> ScopeRung:
    """Granted scope is a FUNCTION of the variance: det <= 0 holds deployment
    entirely (rung 0: no capabilities, no TTL); positive-but-below-threshold
    volume is sandboxed (stratum capped at the sandbox ceiling); at or above
    the fly threshold the stratum's own rung is granted."""
    if det <= 0:
        return cfg.scope_ladder[0]
    if det < cfg.det_fly_threshold:
        return cfg.scope_ladder[min(stratum_value, _SANDBOX_CEILING)]
    return cfg.scope_ladder[stratum_value]


def derive_manifest(assessment: dict, vrc_digest: str, cfg: HarnessConfig) -> dict:
    """Emit the DeploymentManifest (dragon-flight) for an ISSUED credential.

    Call ONLY after issuance verified the two gates and the chain: a vrc_digest
    is only in hand when approval + challenge passed and h(tau) met the gate,
    so the predicate records that proven floor. The issuance service overwrites
    predicate.hTau with the LIVE ledger measurement before the manifest is
    persisted (the harness states the law; the service supplies the reading).
    The manifestId is content-addressed: the hash of the manifest's own body.
    """
    det = float(assessment["detSigma"])
    scope = deployment_scope(det, assessment["stratum"], cfg)
    v = verdict(assessment, audit_ok=True, challenge_ok=True, approved=True)
    manifest = {
        "agent": assessment["agent"],
        "assessmentDigest": content_hash(assessment),
        "vrcDigest": vrc_digest,
        "detSigma": det,
        "stratum": assessment["stratum"],
        "predicate": {
            "detSigmaPositive": det > 0,
            "hTau": cfg.h_tau_gate,
            "challengePassed": True,
            "supervisorApproved": True,
        },
        "verdict": v,
        "decision": VERDICT_TO_DECISION[v],
        "scope": {
            "capabilities": list(scope.capabilities),
            "constraints": {"supervised": v != "VALIDATED"},
            "ttlSeconds": scope.ttlSeconds,
        },
        "issuedAt": assessment["timestamp"],
    }
    manifest["manifestId"] = content_hash(manifest)
    return manifest


# --- Policy rendering (Lexon) ---------------------------------------------------

def lexon_policy(cfg: HarnessConfig) -> str:
    """The harness's own law, in Lexon-style controlled natural language.

    The same config that gates deployment prints the policy a regulator reads.
    Guardrail correspondence is tested in WP7 (test_lexon_policy.py); the full
    Lexon term lives at guardrails/lexon/gatehouse.lexon.
    """
    return "\n".join(
        (
            "LEXON: gatehouse policy.",
            '"Supervisor" is a person.',
            '"Agent" is a counterparty.',
            '"Credential" is data.',
            "CLAUSE: Two Gates. The Credential issues only if the Supervisor has approved",
            "        and the Agent has passed the understanding challenge.",
            "CLAUSE: Audit. Every state transition is recorded as a content-addressed event",
            "        chained to the prior event; a broken chain voids deployment.",
            "CLAUSE: Variance. Deployment scope follows the sovereignty volume:",
            f"        below {cfg.det_fly_threshold} of volume the Agent is sandboxed;",
            "        at zero or collapsed volume deployment is held.",
            "CLAUSE: Revocation. The Supervisor may revoke; a revoked Credential",
            "        fails verification everywhere, immediately.",
        )
    )


# --- TSP binding (transport vocabulary, not a schema concern) -------------------

# The VRC ceremony is a Trust Spanning Protocol relationship formation between
# two VIDs: the supervisor authority and the agent. AgentIdentity DIDs serve as
# VIDs; transport adapters live beside the identity adapters in apps/agent-client.
TSP_ROLE_SUPERVISOR = "tsp:relationship:issuer"
TSP_ROLE_AGENT = "tsp:relationship:subject"
