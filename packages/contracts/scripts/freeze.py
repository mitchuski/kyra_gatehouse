"""Generate (or check) the contracts freeze manifest.

"Contracts frozen" concretely means: CONTRACTS_FROZEN.json holds a sha256
over CANONICAL BYTES (sorted keys, no whitespace - formatting- and CRLF-proof)
for every schema, the probe registry, and the harness public interface, plus
a merkle-style root hash. test_freeze.py recomputes every CI run; any
post-freeze drift fails WP7 unless a new versioned freeze entry lands with
Mitch's sign-off. The freeze is sealed by Mitch's local commit + tag.

Usage:
  .venv/Scripts/python packages/contracts/scripts/freeze.py          # write manifest
  .venv/Scripts/python packages/contracts/scripts/freeze.py --check  # verify no drift
"""

import hashlib
import inspect
import json
import sys
from datetime import date
from pathlib import Path

PKG_ROOT = Path(__file__).resolve().parents[1]
REPO = PKG_ROOT.parents[1]
sys.path.insert(0, str(PKG_ROOT / "python"))
sys.path.insert(0, str(REPO / "services" / "verify"))

from gatehouse_contracts.canon import content_hash

FREEZE_JSON = PKG_ROOT / "CONTRACTS_FROZEN.json"
FREEZE_MD = PKG_ROOT / "CONTRACTS_FROZEN.md"
FREEZE_VERSION = "contracts-v1"


def schema_hashes() -> dict[str, str]:
    return {
        p.name: content_hash(json.loads(p.read_text(encoding="utf-8")))
        for p in sorted((PKG_ROOT / "schema").glob("*.schema.json"))
    }


def registry_hash() -> str:
    return content_hash(
        json.loads((PKG_ROOT / "probes" / "registry.json").read_text(encoding="utf-8"))
    )


def harness_interface() -> dict:
    from gatehouse_verify import harness

    functions = {
        name: str(inspect.signature(obj))
        for name, obj in sorted(vars(harness).items())
        if not name.startswith("_")
        and inspect.isfunction(obj)
        and obj.__module__ == harness.__name__
    }
    constants = {
        "CANONICAL_DIMENSIONS": list(map(list, harness.CANONICAL_DIMENSIONS)),
        "FORCES": list(harness.FORCES),
        "SIGMA_PAIRS": list(harness.SIGMA_PAIRS),
        "SIGMA_BIT_ORDER": harness.SIGMA_BIT_ORDER,
        "STRATUM_SIZES": list(harness.STRATUM_SIZES),
        "VERDICT_TO_DECISION": harness.VERDICT_TO_DECISION,
    }
    return {"functions": functions, "constants": constants}


def build_manifest() -> dict:
    schemas = schema_hashes()
    iface = harness_interface()
    iface_hash = content_hash(iface)
    reg_hash = registry_hash()
    leaves = sorted([*schemas.items(), ("probes/registry.json", reg_hash), ("harness-interface", iface_hash)])
    root = hashlib.sha256(
        b"".join(bytes.fromhex(h) for _, h in leaves)
    ).hexdigest()
    return {
        "frozen": True,
        "version": FREEZE_VERSION,
        "schemas": schemas,
        "registryHash": reg_hash,
        "harnessInterfaceHash": iface_hash,
        "harnessInterface": iface,
        "fd1SigmaBitOrder": iface["constants"]["SIGMA_BIT_ORDER"],
        "rootHash": root,
    }


def write_md(manifest: dict) -> None:
    lines = [
        f"# {manifest['version']} — contracts freeze manifest",
        "",
        f"Generated {date.today().isoformat()}. Sealed by Mitch's local commit + tag.",
        "Hashes are sha256 over canonical bytes (sorted keys, no whitespace).",
        "Any post-freeze change fails WP7 unless a new versioned entry lands with sign-off.",
        "",
        f"**Root hash:** `{manifest['rootHash']}`",
        "",
        "## Schemas",
        "",
        "| schema | canonical sha256 |",
        "|---|---|",
        *[f"| {name} | `{h}` |" for name, h in manifest["schemas"].items()],
        "",
        f"**Probe registry:** `{manifest['registryHash']}`",
        f"**Harness interface:** `{manifest['harnessInterfaceHash']}`",
        "",
        "## FD-1 — sigma pair -> lattice bit (confirmed at freeze review)",
        "",
        "| σ pair | bit weight |",
        "|---|---|",
        *[f"| σ_{p} | {w} |" for p, w in manifest["fd1SigmaBitOrder"].items()],
        "",
    ]
    FREEZE_MD.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    manifest = build_manifest()
    if "--check" in sys.argv:
        if not FREEZE_JSON.exists():
            print("freeze check: NOT FROZEN (no manifest)", file=sys.stderr)
            sys.exit(1)
        frozen = json.loads(FREEZE_JSON.read_text(encoding="utf-8"))
        if frozen["rootHash"] != manifest["rootHash"]:
            drift = [
                name
                for name in set(frozen["schemas"]) | set(manifest["schemas"])
                if frozen["schemas"].get(name) != manifest["schemas"].get(name)
            ]
            if frozen["registryHash"] != manifest["registryHash"]:
                drift.append("probes/registry.json")
            if frozen["harnessInterfaceHash"] != manifest["harnessInterfaceHash"]:
                drift.append("harness-interface")
            print(f"freeze check: DRIFT in {drift}", file=sys.stderr)
            sys.exit(1)
        print(f"freeze check: ok ({frozen['version']}, root {frozen['rootHash'][:12]}...)")
        return
    FREEZE_JSON.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    write_md(manifest)
    print(f"froze {FREEZE_VERSION}: root {manifest['rootHash']}")


if __name__ == "__main__":
    main()
