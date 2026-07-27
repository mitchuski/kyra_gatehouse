"""The harness must speak the canonical lattice: bit order 32/16/8/4/2/1 =
Protection/Delegation/Memory/Connection/Computation/Value, strata 1,6,15,20,15,6,1."""

import math
import re
from pathlib import Path

import pytest

from gatehouse_verify import harness

CANON = (
    (32, "Protection"),
    (16, "Delegation"),
    (8, "Memory"),
    (4, "Connection"),
    (2, "Computation"),
    (1, "Value"),
)

EXTERNAL_AUDIT = Path(
    r"C:\Users\mitch\agentprivacy_master\agentprivacy-skills\agentprivacy-skills-v5"
    r"\meta\agentprivacy-lattice-coherence\scripts\lattice_coherence_audit.py"
)


def test_canonical_dimensions_pinned():
    assert harness.CANONICAL_DIMENSIONS == CANON


def test_stratum_sizes_are_binomial():
    assert harness.STRATUM_SIZES == tuple(math.comb(6, k) for k in range(7))
    assert sum(harness.STRATUM_SIZES) == 64


def test_stratum_is_popcount():
    profile = [0] * 7
    for v in range(64):
        profile[harness.stratum(v)] += 1
    assert tuple(profile) == harness.STRATUM_SIZES


def test_sigma_bit_order_is_a_permutation():
    assert sorted(harness.SIGMA_BIT_ORDER.values(), reverse=True) == [32, 16, 8, 4, 2, 1]
    assert set(harness.SIGMA_BIT_ORDER) == set(harness.SIGMA_PAIRS)


def test_bits_string_matches_vertex():
    for v in (0, 1, 21, 42, 63):
        bits = harness.sovereignty_bits(v)
        assert len(bits) == 6
        assert int(bits, 2) == v


@pytest.mark.skipif(not EXTERNAL_AUDIT.exists(), reason="external canon script not present")
def test_matches_external_lattice_coherence_canon():
    """Cross-check against the authoritative encoding in lattice_coherence_audit.py."""
    text = EXTERNAL_AUDIT.read_text(encoding="utf-8", errors="replace")
    for weight, name in CANON:
        pattern = rf"{weight}\D{{0,40}}{name}|{name}\D{{0,40}}{weight}"
        assert re.search(pattern, text), f"canon script does not pair {weight} with {name}"
