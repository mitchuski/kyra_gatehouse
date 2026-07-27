"""Gatehouse KY-A contracts: generated models + canon/witness/verdict utilities.

The schemas in packages/contracts/schema/ are the single source of truth;
models.py is generated from them (pnpm codegen) and committed.
"""

from gatehouse_contracts.canon import canonical_bytes, content_hash
from gatehouse_contracts.verdicts import VERDICT_TO_DECISION
from gatehouse_contracts.witness import witness_draw

__all__ = [
    "canonical_bytes",
    "content_hash",
    "witness_draw",
    "VERDICT_TO_DECISION",
]
