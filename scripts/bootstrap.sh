#!/usr/bin/env bash
# Gatehouse KY-A bootstrap (POSIX / Git Bash). Run from repo root.
set -euo pipefail

corepack enable
pnpm install

PY=$(command -v python3.12 || command -v python3 || command -v python)
"$PY" -m venv .venv
if [ -f .venv/Scripts/python.exe ]; then VPY=.venv/Scripts/python; else VPY=.venv/bin/python; fi
"$VPY" -m pip install --upgrade pip
"$VPY" -m pip install -e "packages/contracts/python[dev]" -e "services/verify[dev]"

echo "Bootstrap complete."
