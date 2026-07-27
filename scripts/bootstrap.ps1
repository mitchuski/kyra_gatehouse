# Gatehouse KY-A bootstrap (Windows). Run from repo root.
$ErrorActionPreference = "Stop"

corepack enable
pnpm install

# Python: prefer 3.12 for datamodel-code-generator compatibility; fall back to newest.
$py = "py"
$ver = "-3.12"
try { & $py $ver -c "1" 2>$null } catch { $ver = "-3" }
& $py $ver -m venv .venv
& ".venv\Scripts\python" -m pip install --upgrade pip
& ".venv\Scripts\python" -m pip install -e "packages/contracts/python[dev]" -e "services/verify[dev]"

Write-Host "Bootstrap complete. Activate with .venv\Scripts\Activate.ps1"
