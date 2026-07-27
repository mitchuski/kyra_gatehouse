// The one-command acceptance runner: build -> codegen drift -> pytest -> vitest -> freeze.
// Usage: pnpm verify  (add --pre-freeze to allow a missing freeze manifest)
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const venvPython = path.join(
  repo,
  ".venv",
  process.platform === "win32" ? "Scripts" : "bin",
  process.platform === "win32" ? "python.exe" : "python",
);
const preFreeze = process.argv.includes("--pre-freeze");

const steps = [
  ["workspace build", "pnpm", ["-r", "build"]],
  ["ts codegen drift", "node", [path.join("packages", "contracts", "scripts", "codegen.mjs"), "--check"]],
  ["py codegen drift", venvPython, [path.join("packages", "contracts", "scripts", "codegen.py"), "--check"]],
  ["guardrails (pytest)", venvPython, ["-m", "pytest", "guardrails", "-q"]],
  ["guardrails (vitest)", "pnpm", ["--dir", path.join("guardrails", "ts"), "test"]],
];
if (!preFreeze || existsSync(path.join(repo, "packages", "contracts", "CONTRACTS_FROZEN.json"))) {
  steps.push(["freeze check", venvPython, [path.join("packages", "contracts", "scripts", "freeze.py"), "--check"]]);
  steps.push(["runtimes (dream folds)", "node", [path.join("runtimes", "run.mjs")]]);
  steps.push(["e2e (the two-act ceremony)", "node", [path.join("scripts", "e2e.mjs")]]);
  steps.push(["interop (impl #2 × 3 expressions)", "node", [path.join("interop", "run.mjs")]]);
}

for (const [name, cmd, args] of steps) {
  console.log(`\n=== ${name} ===`);
  const r = spawnSync(cmd, args, { cwd: repo, stdio: "inherit", shell: process.platform === "win32" });
  if (r.status !== 0) {
    console.error(`\nVERIFY FAILED at: ${name}`);
    process.exit(r.status ?? 1);
  }
}
console.log("\nVERIFY: all green");
