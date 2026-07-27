"""The canary reference agent passes every gate BY CONSTRUCTION.

If the canary ever fails, the gate is broken, not the candidate. Without a
canary you cannot distinguish a bad agent from an impossible gate. This file
is the judges' evidence exhibit for the guardrail harness.
"""

import pytest

from gatehouse_contracts.verdicts import VERDICT_TO_DECISION
from gatehouse_contracts.witness import rederive_check
from gatehouse_verify import harness


def test_canary_is_stratum_six(canary_assessment):
    v = canary_assessment["sovereignty"]["vertex"]
    assert v == 63
    assert harness.stratum(v) == 6
    assert harness.tier(harness.stratum(v)) == 6


def test_canary_draw_is_honest(canary_agent, registry, canary_assessment):
    assert rederive_check(canary_agent, registry, canary_assessment["witnessDraw"])


def test_canary_structural_invariants_hold(canary_assessment, registry):
    cfg = harness.load_config()
    assert harness.validate_assessment(canary_assessment, registry, cfg) == []


def test_canary_vertex_from_sigma(canary_assessment):
    cfg = harness.load_config()
    assert harness.sovereignty_vertex(canary_assessment["sigma"], cfg) == 63


def test_canary_verdict_would_fly():
    assert VERDICT_TO_DECISION["VALIDATED"] == "fly"


def test_canary_det_sigma_recomputes(canary_assessment):
    """WP1 landed: full separation (sigma=1) is the identity matrix — det 1,
    the full tetrahedron. (This recompute found the sigma_matrix inversion:
    entries are the correlation complement 1 - sigma, not sigma itself.)"""
    m = harness.sigma_matrix(canary_assessment["sigma"])
    assert harness.det_sigma(m) == pytest.approx(canary_assessment["detSigma"])
    assert harness.is_psd(m) is canary_assessment["psd"]


def test_canary_scores_recompute(canary_assessment, registry):
    assert harness.force_scores(canary_assessment["probeResults"], registry) == canary_assessment["forceScores"]
    assert harness.sigma_from_probes(canary_assessment["probeResults"], registry) == canary_assessment["sigma"]
