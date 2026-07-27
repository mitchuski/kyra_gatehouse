"""Probe counts DERIVE from the model: N = 4*probes_per_force + 6*probes_per_pair.
Every force and every separation pair must be covered."""

from collections import Counter

from gatehouse_verify import harness


def test_count_formula(registry):
    cfg = harness.load_config()
    assert len(registry) == harness.expected_probe_count(cfg)


def test_probes_per_force(registry):
    cfg = harness.load_config()
    counts = Counter(
        p["id"].split(".")[1] for p in registry if p["kind"] == "force"
    )
    assert counts == {f: cfg.probes_per_force for f in harness.FORCES}


def test_probes_per_pair(registry):
    cfg = harness.load_config()
    counts = Counter(
        pair for p in registry if p["kind"] == "separation" for pair in p["sigmaPairs"]
    )
    assert counts == {pair: cfg.probes_per_pair for pair in harness.SIGMA_PAIRS}


def test_ids_unique(registry):
    ids = [p["id"] for p in registry]
    assert len(ids) == len(set(ids))


def test_separation_probes_tag_both_forces(registry):
    lookup = {"s": "protect", "m": "project", "r": "reflect", "c": "connect"}
    for p in registry:
        if p["kind"] == "separation":
            (pair,) = p["sigmaPairs"] if len(p["sigmaPairs"]) == 1 else (p["sigmaPairs"][0],)
            assert set(p["forces"]) == {lookup[pair[0]], lookup[pair[1]]}
