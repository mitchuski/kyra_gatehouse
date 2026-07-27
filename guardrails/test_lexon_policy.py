"""The harness emits its own law: guardrails/lexon/gatehouse.lexon and
harness.lexon_policy(cfg) must state the same clauses. The same config that
gates deployment prints the policy a regulator reads."""

import re
from pathlib import Path

from gatehouse_verify import harness

LEXON_FILE = Path(__file__).resolve().parent / "lexon" / "gatehouse.lexon"

# Clauses the policy must state; Spoof Refusal is file-only until WP6 wires it.
SHARED_CLAUSES = ("Two Gates", "Audit", "Variance", "Revocation")


def _clauses(text: str) -> set[str]:
    return set(re.findall(r"CLAUSE:\s*([^.\n]+)", text))


def test_lexon_file_states_all_clauses():
    clauses = _clauses(LEXON_FILE.read_text(encoding="utf-8"))
    assert set(SHARED_CLAUSES) <= clauses
    assert "Spoof Refusal" in clauses


def test_harness_emits_the_same_clauses():
    cfg = harness.load_config()
    assert set(SHARED_CLAUSES) <= _clauses(harness.lexon_policy(cfg))


def test_harness_policy_carries_live_threshold():
    """The emitted law quotes the live config value - numbers are derived, not prose."""
    cfg = harness.load_config()
    assert str(cfg.det_fly_threshold) in harness.lexon_policy(cfg)
