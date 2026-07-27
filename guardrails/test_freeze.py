"""The freeze is enforced, not aspirational: recompute every hash every run.
Skips only before the first freeze; after it, drift fails the harness."""

import importlib.util
import json
from pathlib import Path

import pytest

REPO = Path(__file__).resolve().parents[1]
FREEZE_JSON = REPO / "packages" / "contracts" / "CONTRACTS_FROZEN.json"
FREEZE_SCRIPT = REPO / "packages" / "contracts" / "scripts" / "freeze.py"


def _load_freeze_module():
    spec = importlib.util.spec_from_file_location("freeze", FREEZE_SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="module")
def frozen() -> dict:
    if not FREEZE_JSON.exists():
        pytest.skip("contracts not yet frozen (freeze.py has not run)")
    return json.loads(FREEZE_JSON.read_text(encoding="utf-8"))


def test_no_drift_since_freeze(frozen):
    manifest = _load_freeze_module().build_manifest()
    assert manifest["rootHash"] == frozen["rootHash"], (
        "contracts drifted since freeze - a post-freeze change requires a new "
        "versioned freeze entry with Mitch's sign-off"
    )


def test_harness_signature_set_unchanged(frozen):
    manifest = _load_freeze_module().build_manifest()
    assert manifest["harnessInterface"]["functions"] == frozen["harnessInterface"]["functions"]


def test_fd1_table_unchanged(frozen):
    manifest = _load_freeze_module().build_manifest()
    assert manifest["fd1SigmaBitOrder"] == frozen["fd1SigmaBitOrder"]
