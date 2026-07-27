"""Core stays register-neutral and ecosystem-free: nothing under packages/ or
services/ may name an ecosystem, a submission, or a deadline. Expressions are
late-bound through render/expressions.yaml (CLAUDE.md, Expressions stay open)."""

from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
CORE = [REPO / "packages", REPO / "services"]

# Ecosystem / submission vocabulary that must never enter core.
FORBIDDEN = (
    "hearthold",
    "archon",
    "emissary",
    "cdir",
    "nayaone",
    "bgin",
    "block 15",
    "block15",
    "hitchhiker",
    "game of 42",
    "city of mages",
    "vouch.finance",
    "gdc",
    # Session 14: the ToIP trust-task bridge is an adapters-lane expression;
    # the envelope vocabulary stays out of core just like every ecosystem.
    "trusttasks",
    "trust-task",
)

SCANNED_SUFFIXES = {".py", ".ts", ".tsx", ".mjs", ".json", ".md", ".toml", ".yaml", ".yml"}
SKIP_DIRS = {"node_modules", ".venv", "__pycache__", ".codegen-tmp", "dist"}


def _core_files():
    for root in CORE:
        for path in root.rglob("*"):
            if path.is_file() and path.suffix in SCANNED_SUFFIXES:
                if not any(part in SKIP_DIRS for part in path.parts):
                    yield path


def test_core_is_ecosystem_free():
    hits = []
    for path in _core_files():
        text = path.read_text(encoding="utf-8", errors="replace").lower()
        for word in FORBIDDEN:
            if word in text:
                hits.append(f"{path.relative_to(REPO)}: {word!r}")
    assert not hits, "ecosystem vocabulary leaked into core:\n" + "\n".join(hits)
