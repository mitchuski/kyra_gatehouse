"""Python codegen: JSON Schema (schema/) -> gatehouse_contracts/models/ package.

One module per schema (shared $defs inlined per module), plus a re-exporting
__init__. --check regenerates to a temp dir and diffs (CI drift gate).

Run with the repo venv:  .venv/Scripts/python packages/contracts/scripts/codegen.py
"""

import filecmp
import shutil
import subprocess
import sys
from pathlib import Path

PKG_ROOT = Path(__file__).resolve().parents[1]
SCHEMA_DIR = PKG_ROOT / "schema"
MODELS_DIR = PKG_ROOT / "python" / "gatehouse_contracts" / "models"
TMP_DIR = PKG_ROOT / ".codegen-tmp" / "py"

HEADER = "# GENERATED FILE - do not edit. Source: packages/contracts/schema. Regenerate: pnpm codegen\n"

MAIN = {
    "agent-identity": "AgentIdentity",
    "probe": "Probe",
    "assessment-result": "AssessmentResult",
    "vrc": "VerifiableRelationshipCredential",
    "audit-event": "AuditEvent",
    "understanding-challenge": "UnderstandingChallenge",
    "deployment-manifest": "DeploymentManifest",
}


def generate(out_dir: Path) -> None:
    out_dir.mkdir(parents=True, exist_ok=True)
    init_lines = [HEADER]
    for schema in sorted(SCHEMA_DIR.glob("*.schema.json")):
        stem = schema.name.replace(".schema.json", "")
        if stem == "defs":
            continue
        module = stem.replace("-", "_")
        out_file = out_dir / f"{module}.py"
        subprocess.run(
            [
                sys.executable, "-m", "datamodel_code_generator",
                "--input", str(schema),
                "--input-file-type", "jsonschema",
                "--output", str(out_file),
                "--output-model-type", "pydantic_v2.BaseModel",
                "--use-annotated",
                "--target-python-version", "3.11",
                "--custom-file-header", HEADER.rstrip("\n"),
                "--disable-timestamp",
            ],
            check=True,
        )
        init_lines.append(f"from gatehouse_contracts.models.{module} import {MAIN[stem]}")
    init_lines.append(
        "\n__all__ = [" + ", ".join(f'"{v}"' for k, v in sorted(MAIN.items())) + "]\n"
    )
    (out_dir / "__init__.py").write_text("\n".join(init_lines), encoding="utf-8")


def main() -> None:
    check = "--check" in sys.argv
    if not check:
        generate(MODELS_DIR)
        print("py codegen: wrote models package")
        return

    shutil.rmtree(TMP_DIR, ignore_errors=True)
    generate(TMP_DIR)
    dirty = []
    for fresh in sorted(TMP_DIR.glob("*.py")):
        committed = MODELS_DIR / fresh.name
        if not committed.exists() or not filecmp.cmp(fresh, committed, shallow=False):
            dirty.append(fresh.name)
    shutil.rmtree(PKG_ROOT / ".codegen-tmp", ignore_errors=True)
    if dirty:
        print(f"py codegen drift: {', '.join(dirty)} - run: pnpm codegen", file=sys.stderr)
        sys.exit(1)
    print("py codegen: no drift")


if __name__ == "__main__":
    main()
