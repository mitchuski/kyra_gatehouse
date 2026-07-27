// TS codegen: JSON Schema (schema/) -> src/generated/*.ts + src/types.ts barrel.
// --check regenerates to a temp dir and diffs (CI drift gate).
import { compileFromFile } from "json-schema-to-typescript";
import fg from "fast-glob";
import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaDir = path.join(pkgRoot, "schema");
const check = process.argv.includes("--check");
const outDir = check
  ? path.join(pkgRoot, ".codegen-tmp", "ts")
  : path.join(pkgRoot, "src");

const HEADER =
  "/* GENERATED FILE - do not edit. Source: packages/contracts/schema. Regenerate: pnpm codegen */\n";

// Main type name per schema file (must match each schema's title).
const MAIN = {
  "agent-identity": "AgentIdentity",
  "probe": "Probe",
  "assessment-result": "AssessmentResult",
  "vrc": "VerifiableRelationshipCredential",
  "audit-event": "AuditEvent",
  "understanding-challenge": "UnderstandingChallenge",
  "deployment-manifest": "DeploymentManifest",
};

const files = (await fg("*.schema.json", { cwd: schemaDir })).sort();
await rm(path.join(pkgRoot, ".codegen-tmp"), { recursive: true, force: true });
await mkdir(path.join(outDir, "generated"), { recursive: true });

const barrel = [HEADER];
for (const file of files) {
  const stem = file.replace(".schema.json", "");
  if (stem === "defs") continue; // shared $defs are inlined per module
  const ts = await compileFromFile(path.join(schemaDir, file), {
    cwd: schemaDir,
    bannerComment: HEADER.trimEnd(),
    additionalProperties: false,
    style: { singleQuote: false },
  });
  await writeFile(path.join(outDir, "generated", `${stem}.ts`), ts, "utf-8");
  const main = MAIN[stem];
  if (!main) throw new Error(`no main type registered for schema ${file}`);
  barrel.push(`export type { ${main} } from "./generated/${stem}";`);
}
barrel.push("");
await writeFile(path.join(outDir, "types.ts"), barrel.join("\n"), "utf-8");

if (check) {
  let dirty = [];
  for (const rel of ["types.ts", ...files.filter((f) => f !== "defs.schema.json").map((f) => `generated/${f.replace(".schema.json", ".ts")}`)]) {
    const committed = path.join(pkgRoot, "src", rel);
    const fresh = path.join(outDir, rel);
    const a = existsSync(committed) ? await readFile(committed, "utf-8") : "";
    const b = await readFile(fresh, "utf-8");
    if (a !== b) dirty.push(rel);
  }
  await rm(path.join(pkgRoot, ".codegen-tmp"), { recursive: true, force: true });
  if (dirty.length) {
    console.error(`codegen drift in src/: ${dirty.join(", ")} - run: pnpm codegen`);
    process.exit(1);
  }
  console.log("ts codegen: no drift");
} else {
  console.log(`ts codegen: wrote ${files.length - 1} modules + types.ts`);
}
