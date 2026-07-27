"""The Gap witness-draw.

Deep-verification probes are sampled deterministically from the sha256 of the
agent's OWN canonicalised submission: the agent cannot know which probes will
be probed while it writes. Anti-grooming mechanism; the draw record is itself
an auditable artifact re-derivable by any auditor from the persisted canon
hash and registry hash.
"""

import hashlib
from typing import Any

from gatehouse_contracts.canon import canonical_bytes, content_hash

ALGORITHM = "sha256-canon-v1"


def witness_draw(submission: Any, registry: list[dict], k: int) -> dict:
    """Draw k probe ids from the registry, seeded by the submission's canon hash.

    Counter-mode stream: index_i = sha256(canon_hash_bytes || i) mod remaining,
    sampling without replacement from the lexicographically sorted probe ids.
    """
    if k < 0:
        raise ValueError("k must be >= 0")
    ids = sorted(p["id"] for p in registry)
    if k > len(ids):
        raise ValueError(f"cannot draw {k} from registry of {len(ids)}")

    canon_hash = content_hash(submission)
    seed = bytes.fromhex(canon_hash)

    drawn: list[str] = []
    pool = list(ids)
    for i in range(k):
        digest = hashlib.sha256(seed + i.to_bytes(4, "big")).digest()
        idx = int.from_bytes(digest, "big") % len(pool)
        drawn.append(pool.pop(idx))

    return {
        "canonHash": canon_hash,
        "registryHash": content_hash({"version": 1, "ids": ids}),
        "algorithm": ALGORITHM,
        "drawnProbeIds": drawn,
    }


def rederive_check(submission: Any, registry: list[dict], draw: dict) -> bool:
    """An auditor's re-derivation: does this draw follow from this submission + registry?"""
    fresh = witness_draw(submission, registry, len(draw["drawnProbeIds"]))
    return fresh == draw
