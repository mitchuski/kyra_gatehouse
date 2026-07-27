"""WP1 service face: build a complete AssessmentResult from raw probe scores.

The supervisor scores probes in the dashboard; everything else DERIVES —
the witness draw from the agent's own canonicalised identity, the force and
sigma aggregates from the tagged registry, det/psd/vertex/stratum/tier from
the harness pipeline. By construction the result passes validate_assessment:
the dashboard can never hand-edit a derived number.
"""

from gatehouse_contracts.witness import witness_draw

from gatehouse_verify import harness


def build_assessment(
    agent_identity: dict,
    supervisor: str,
    probe_scores: dict[str, float],
    registry: list[dict],
    cfg: harness.HarnessConfig,
    timestamp: str,
    rationales: dict[str, str] | None = None,
) -> dict:
    """probe_scores maps EVERY registry probe id to a [0,1] score."""
    ids = {p["id"] for p in registry}
    missing = sorted(ids - probe_scores.keys())
    extra = sorted(probe_scores.keys() - ids)
    if missing or extra:
        raise ValueError(f"probe scores must cover the registry exactly (missing {missing}, unknown {extra})")

    k = round(len(registry) * cfg.draw_fraction)
    draw = witness_draw(agent_identity, registry, k)
    drawn = set(draw["drawnProbeIds"])
    rationales = rationales or {}
    probe_results = [
        {
            "probeId": p["id"],
            "score": float(probe_scores[p["id"]]),
            "rationale": rationales.get(p["id"], "supervisor-scored at the gate"),
            "method": "deep" if p["id"] in drawn else p["evidenceKind"],
        }
        for p in registry
    ]

    forces = harness.force_scores(probe_results, registry)
    sigma = harness.sigma_from_probes(probe_results, registry)
    m = harness.sigma_matrix(sigma)
    vertex = harness.sovereignty_vertex(sigma, cfg)
    stratum = harness.stratum(vertex)
    assessment = {
        "assessmentId": f"assessment-{draw['canonHash'][:12]}",
        "agent": agent_identity["id"],
        "supervisor": supervisor,
        "timestamp": timestamp,
        "probeResults": probe_results,
        "witnessDraw": draw,
        "forceScores": forces,
        "sigma": sigma,
        "detSigma": harness.det_sigma(m),
        "psd": harness.is_psd(m),
        "sovereignty": {
            "vertex": vertex,
            "bits": harness.sovereignty_bits(vertex),
            "bitOrder": [name for _, name in harness.CANONICAL_DIMENSIONS],
        },
        "stratum": stratum,
        "tier": harness.tier(stratum),
    }
    violations = harness.validate_assessment(assessment, registry, cfg)
    if violations:  # cannot happen by construction; a failure here is an engine bug
        raise RuntimeError(f"built assessment does not self-validate: {violations}")
    return assessment
