"""The Gap witness-draw: the agent cannot know which probes will be probed
while it writes (anti-grooming). The draw is itself an auditable artifact."""

import pytest

from gatehouse_contracts.witness import rederive_check, witness_draw


def test_same_submission_same_draw(canary_agent, registry):
    assert witness_draw(canary_agent, registry, 6) == witness_draw(canary_agent, registry, 6)


def test_one_key_mutation_changes_draw(canary_agent, registry):
    mutated = dict(canary_agent, createdAt="2026-07-17T00:00:01Z")
    assert (
        witness_draw(canary_agent, registry, 6)["drawnProbeIds"]
        != witness_draw(mutated, registry, 6)["drawnProbeIds"]
    )


def test_draw_rederivable_by_auditor(canary_agent, registry, canary_assessment):
    assert rederive_check(canary_agent, registry, canary_assessment["witnessDraw"])


def test_no_repeats_and_k_respected(canary_agent, registry):
    draw = witness_draw(canary_agent, registry, 10)
    ids = draw["drawnProbeIds"]
    assert len(ids) == 10 == len(set(ids))


def test_overdraw_rejected(canary_agent, registry):
    with pytest.raises(ValueError):
        witness_draw(canary_agent, registry, len(registry) + 1)
