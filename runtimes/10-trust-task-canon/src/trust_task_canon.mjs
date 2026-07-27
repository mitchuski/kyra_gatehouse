// Runtime 10 · trust-task-canon — the vendored ToIP schema family under audit.
//
// Frozen artifacts audited: the byte-identical agent-admission/* payload
// schemas vendored at apps/agent-client/src/adapters/trust-tasks/schemas/
// plus their SCHEMAS_PROVENANCE.md. The Mage proposes the family as one canon
// bundle; the Swordsman proves the ceremony's rules survive in schema form —
// closed verdict lexicon, two-gates-exactly, closed payloads, resolvable refs,
// digests that match the provenance table. Zero deps, like every fold here.

import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, "..", "..", "..");
export const SCHEMA_DIR = path.join(REPO, "apps", "agent-client", "src", "adapters", "trust-tasks", "schemas");

export const TASKS = ["apply", "respond", "approve", "issue", "revoke", "status"];

const sha256File = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

export function loadBundle() {
  const files = {};
  for (const t of TASKS) {
    files[`agent-admission/${t}.0.1.payload.schema.json`] = path.join(SCHEMA_DIR, "agent-admission", `${t}.0.1.payload.schema.json`);
  }
  files["agent-admission/_shared/admission.0.1.schema.json"] = path.join(SCHEMA_DIR, "agent-admission", "_shared", "admission.0.1.schema.json");
  files["_framework/framework.0.1.schema.json"] = path.join(SCHEMA_DIR, "_framework", "framework.0.1.schema.json");

  const bundle = { files, present: {}, json: {}, provenance: null };
  for (const [rel, abs] of Object.entries(files)) {
    bundle.present[rel] = existsSync(abs);
    if (bundle.present[rel]) bundle.json[rel] = JSON.parse(readFileSync(abs, "utf8"));
  }
  const provPath = path.join(SCHEMA_DIR, "SCHEMAS_PROVENANCE.md");
  if (existsSync(provPath)) bundle.provenance = readFileSync(provPath, "utf8");
  return bundle;
}

/** Parse the provenance table: rel-path → declared sha256. */
export function provenanceDigests(provenance) {
  const out = {};
  for (const line of provenance.split("\n")) {
    const m = line.match(/^\|\s*`([^`]+)`\s*\|\s*`([0-9a-f]{64})`\s*\|/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

/** Recompute file digests and compare with the provenance table. */
export function digestsMatch(bundle) {
  const declared = provenanceDigests(bundle.provenance ?? "");
  const mismatches = [];
  for (const [rel, abs] of Object.entries(bundle.files)) {
    if (!declared[rel]) mismatches.push(`${rel}: not in provenance table`);
    else if (sha256File(abs) !== declared[rel]) mismatches.push(`${rel}: digest drift`);
  }
  return { ok: mismatches.length === 0, mismatches, declaredCount: Object.keys(declared).length };
}

/** Every external $ref used by the family must resolve into a vendored file. */
export function refsResolve(bundle) {
  const targets = {
    "../../_shared/0.1/admission.schema.json": bundle.json["agent-admission/_shared/admission.0.1.schema.json"],
    "../../../_framework/0.1/framework.schema.json": bundle.json["_framework/framework.0.1.schema.json"],
  };
  const failures = [];
  const walk = (node, doc, at) => {
    if (!node || typeof node !== "object") return;
    if (typeof node.$ref === "string" && !node.$ref.startsWith("#")) {
      const [file, fragment = ""] = node.$ref.split("#");
      const base = targets[file];
      if (!base) {
        failures.push(`${at}: unmapped ref ${node.$ref}`);
        return;
      }
      let target = base;
      for (const part of fragment.split("/").filter((p) => p)) {
        target = target?.[part];
      }
      if (target === undefined) failures.push(`${at}: dangling fragment ${node.$ref}`);
    }
    for (const [k, v] of Object.entries(node)) walk(v, doc, `${at}/${k}`);
  };
  for (const t of TASKS) walk(bundle.json[`agent-admission/${t}.0.1.payload.schema.json`], null, t);
  return { ok: failures.length === 0, failures };
}

/** Object schemas with properties must close (additionalProperties: false) — except the framework Ext, open by design. */
export function payloadsClosed(bundle) {
  const open = [];
  const walk = (node, at) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    if (node.type === "object" && node.properties && node.additionalProperties !== false) {
      open.push(at);
    }
    for (const [k, v] of Object.entries(node)) {
      if (k === "description") continue;
      walk(v, `${at}/${k}`);
    }
  };
  for (const t of TASKS) walk(bundle.json[`agent-admission/${t}.0.1.payload.schema.json`], t);
  walk(bundle.json["agent-admission/_shared/admission.0.1.schema.json"], "_shared");
  const ext = bundle.json["_framework/framework.0.1.schema.json"]?.$defs?.Ext;
  return { ok: open.length === 0, open, extOpenByDesign: ext?.additionalProperties === true };
}

export function familyRules(bundle) {
  const shared = bundle.json["agent-admission/_shared/admission.0.1.schema.json"];
  const issue = bundle.json["agent-admission/issue.0.1.payload.schema.json"];
  const status = bundle.json["agent-admission/status.0.1.payload.schema.json"];
  const verdict = shared?.$defs?.Verdict?.enum ?? [];
  return {
    verdictClosed:
      verdict.length === 3 && ["validated", "failedHeldOut", "blocked"].every((v) => verdict.includes(v)),
    twoGatesExactly: issue?.properties?.gates?.minItems === 2 && issue?.properties?.gates?.maxItems === 2,
    responsesAnchored: TASKS.every(
      (t) => bundle.json[`agent-admission/${t}.0.1.payload.schema.json`]?.$defs?.Response?.$anchor === "response",
    ),
    idsCanonical: TASKS.every(
      (t) =>
        bundle.json[`agent-admission/${t}.0.1.payload.schema.json`]?.$id ===
        `https://trusttasks.org/spec/agent-admission/${t}/0.1`,
    ),
    statusNeedsASubject: Array.isArray(status?.anyOf) && status.anyOf.length >= 2,
    gateKindsDistinctByEnum: (shared?.$defs?.GateResult?.properties?.gate?.enum ?? []).length === 2,
  };
}

/**
 * W-1 (session 14 reflection): the cross-language canon seam renders
 * integer-valued floats differently (Python `1.0`, JS `1`), so envelope
 * payloads must never carry bare floats across the wire. The family keeps a
 * known quarantine — respond's optional score/threshold — which the bridge
 * deliberately never emits. This inventories every number-typed (non-integer)
 * property so the quarantine cannot grow silently.
 */
export function bareFloatSurface(bundle) {
  const found = [];
  const walk = (node, at) => {
    if (!node || typeof node !== "object" || Array.isArray(node)) return;
    if (node.type === "number") found.push(at);
    for (const [k, v] of Object.entries(node)) {
      if (k === "description") continue;
      walk(v, `${at}/${k}`);
    }
  };
  for (const t of TASKS) walk(bundle.json[`agent-admission/${t}.0.1.payload.schema.json`], t);
  walk(bundle.json["agent-admission/_shared/admission.0.1.schema.json"], "_shared");
  const quarantine = [
    "respond/$defs/Response/properties/score",
    "respond/$defs/Response/properties/threshold",
  ];
  return {
    found,
    quarantined: found.length === quarantine.length && quarantine.every((q) => found.includes(q)),
  };
}

export function provenanceNamesUpstream(bundle) {
  return /\b[0-9a-f]{40}\b/.test(bundle.provenance ?? "") && /trustoverip\/dtgwg-trust-tasks-tf/.test(bundle.provenance ?? "");
}
