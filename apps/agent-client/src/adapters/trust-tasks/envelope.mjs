// The trust-task envelope module — session 14 lane (TT-2), adapters lane only.
//
// Mints and verifies ToIP Trust Task documents (id / type / payload / issuer /
// recipient / threadId / issuedAt / proof) for the agent-admission family, and
// validates payloads against the vendored schemas in ./schemas (byte-identical
// upstream copies — see schemas/SCHEMAS_PROVENANCE.md; their relative $refs are
// resolved here via REF_MAP, never rewritten on disk).
//
// Zero runtime deps (node:crypto, Node >= 20). Canonicalisation is a parity
// copy of @gatehouse/audit canonicalJson / canon.py canonical_bytes — parity
// is exercised end-to-end in scripts/e2e.mjs beat 13, where evidence digests
// computed here must equal ledger contentHashes computed by the engine.
//
// Custody note (honest, mirrors services/verify/gatehouse_verify/keys.py):
// demo keys derive from the same deterministic demo seeds the engine uses
// ("gatehouse-demo-seed:<label>"), so the bridge signs AS the demo parties.
// The signatures are real ed25519; only the custody is demo-grade. Production
// custody enters through the AgentIdentityProvider seam beside this file.

import {
  createHash,
  createPrivateKey,
  createPublicKey,
  randomUUID,
  sign as edSign,
  verify as edVerify,
} from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_DIR = path.join(HERE, "schemas");

// --- canonical JSON (canon.py / @gatehouse/audit parity) ---------------------

export function canonicalJson(obj) {
  if (Array.isArray(obj)) return `[${obj.map(canonicalJson).join(",")}]`;
  if (obj !== null && typeof obj === "object") {
    const entries = Object.entries(obj)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(obj);
}

export const sha256Hex = (text) => createHash("sha256").update(text, "utf8").digest("hex");
export const contentHash = (obj) => sha256Hex(canonicalJson(obj));

// --- base58btc (keys.py parity) ----------------------------------------------

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function b58encode(bytes) {
  let n = 0n;
  for (const b of bytes) n = n * 256n + BigInt(b);
  let out = "";
  while (n > 0n) {
    out = B58[Number(n % 58n)] + out;
    n /= 58n;
  }
  let pad = 0;
  for (const b of bytes) {
    if (b === 0) pad++;
    else break;
  }
  return "1".repeat(pad) + out;
}

export function b58decode(text) {
  let n = 0n;
  for (const ch of text) n = n * 58n + BigInt(B58.indexOf(ch));
  const bytes = [];
  while (n > 0n) {
    bytes.unshift(Number(n % 256n));
    n /= 256n;
  }
  let pad = 0;
  for (const ch of text) {
    if (ch === "1") pad++;
    else break;
  }
  return Uint8Array.from([...Array(pad).fill(0), ...bytes]);
}

// --- ed25519 demo keypairs (keys.py parity, node:crypto) ---------------------

const PKCS8_PREFIX = Buffer.from("302e020100300506032b657004220420", "hex");
const SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

export function keypairFromSeedLabel(label) {
  const seed = createHash("sha256").update(`gatehouse-demo-seed:${label}`, "utf8").digest();
  const privateKey = createPrivateKey({
    key: Buffer.concat([PKCS8_PREFIX, seed]),
    format: "der",
    type: "pkcs8",
  });
  const spki = createPublicKey(privateKey).export({ format: "der", type: "spki" });
  const publicBytes = Uint8Array.from(spki.subarray(spki.length - 32));
  const publicKeyMultibase = "z" + b58encode(Uint8Array.from([0xed, 0x01, ...publicBytes]));
  const did = `did:key:${publicKeyMultibase}`;
  return {
    did,
    publicKeyMultibase,
    sign(obj) {
      const sig = edSign(null, Buffer.from(canonicalJson(obj), "utf8"), privateKey);
      return "z" + b58encode(Uint8Array.from(sig));
    },
  };
}

export function verifySignature(didOrMultibase, obj, signatureMultibase) {
  try {
    const mb = didOrMultibase.split("did:key:").pop();
    if (!mb || !mb.startsWith("z")) return false;
    const decoded = b58decode(mb.slice(1));
    if (decoded.length !== 34 || decoded[0] !== 0xed || decoded[1] !== 0x01) return false;
    const publicKey = createPublicKey({
      key: Buffer.concat([SPKI_PREFIX, Buffer.from(decoded.subarray(2))]),
      format: "der",
      type: "spki",
    });
    if (!signatureMultibase?.startsWith("z")) return false;
    const sig = Buffer.from(b58decode(signatureMultibase.slice(1)));
    return edVerify(null, Buffer.from(canonicalJson(obj), "utf8"), publicKey, sig);
  } catch {
    return false;
  }
}

// --- envelopes ---------------------------------------------------------------

export const TYPE_BASE = "https://trusttasks.org/spec";

export function mintEnvelope({ task, variant, keypair, recipient, payload, threadId, issuedAt }) {
  const type = `${TYPE_BASE}/agent-admission/${task}/0.1${variant === "response" ? "#response" : ""}`;
  const doc = {
    id: `urn:uuid:${randomUUID()}`,
    type,
    issuer: keypair.did,
    recipient,
    ...(threadId ? { threadId } : {}),
    issuedAt: issuedAt ?? new Date().toISOString(),
    payload,
  };
  doc.proof = {
    type: "DataIntegrityProof",
    cryptosuite: "eddsa-jcs-2022",
    created: doc.issuedAt,
    verificationMethod: `${keypair.did}#${keypair.publicKeyMultibase}`,
    proofPurpose: "assertionMethod",
    proofValue: keypair.sign({ ...doc }),
  };
  return doc;
}

const withoutProof = (doc) => {
  const { proof: _drop, ...rest } = doc;
  return rest;
};

export function verifyEnvelope(doc) {
  if (!doc || typeof doc !== "object" || !doc.proof) return false;
  const method = String(doc.proof.verificationMethod ?? "");
  if (!method.startsWith(doc.issuer)) return false;
  return verifySignature(doc.issuer, withoutProof(doc), doc.proof.proofValue);
}

// --- vendored-schema structural validation -----------------------------------

const TASKS = ["apply", "respond", "approve", "issue", "revoke", "status"];
const loadJson = (p) => JSON.parse(readFileSync(p, "utf8"));

const FAMILY = Object.fromEntries(
  TASKS.map((t) => [t, loadJson(path.join(SCHEMA_DIR, "agent-admission", `${t}.0.1.payload.schema.json`))]),
);
const SHARED = loadJson(path.join(SCHEMA_DIR, "agent-admission", "_shared", "admission.0.1.schema.json"));
const FRAMEWORK = loadJson(path.join(SCHEMA_DIR, "_framework", "framework.0.1.schema.json"));

// The vendored copies are flattened, so the upstream relative $refs resolve
// through this explicit map (see SCHEMAS_PROVENANCE.md).
export const REF_MAP = {
  "../../_shared/0.1/admission.schema.json": SHARED,
  "../../../_framework/0.1/framework.schema.json": FRAMEWORK,
};

function resolveRef(ref, rootSchema) {
  const [file, fragment = ""] = ref.split("#");
  const base = file === "" ? rootSchema : REF_MAP[file];
  if (!base) return null;
  let node = base;
  for (const part of fragment.split("/").filter((p) => p && p !== "")) {
    node = node?.[part];
    if (node === undefined) return null;
  }
  return node ?? base;
}

function validateNode(schema, value, rootSchema, at, errors) {
  if (!schema || typeof schema !== "object") return;
  if (schema.$ref) {
    const target = resolveRef(schema.$ref, rootSchema);
    if (!target) {
      errors.push(`${at}: unresolvable $ref ${schema.$ref}`);
      return;
    }
    // External refs validate in their own document's context.
    const nextRoot = schema.$ref.startsWith("#") ? rootSchema : REF_MAP[schema.$ref.split("#")[0]];
    validateNode(target, value, nextRoot, at, errors);
    return;
  }
  if (schema.const !== undefined && value !== schema.const) {
    errors.push(`${at}: expected const ${JSON.stringify(schema.const)}`);
  }
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${at}: ${JSON.stringify(value)} not in enum`);
  }
  if (schema.type) {
    const ok =
      (schema.type === "object" && value !== null && typeof value === "object" && !Array.isArray(value)) ||
      (schema.type === "array" && Array.isArray(value)) ||
      (schema.type === "string" && typeof value === "string") ||
      (schema.type === "boolean" && typeof value === "boolean") ||
      (schema.type === "integer" && Number.isInteger(value)) ||
      (schema.type === "number" && typeof value === "number");
    if (!ok) {
      errors.push(`${at}: expected ${schema.type}`);
      return;
    }
  }
  if (typeof value === "string" && schema.pattern && !new RegExp(schema.pattern).test(value)) {
    errors.push(`${at}: does not match ${schema.pattern}`);
  }
  if (typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${at}: below minimum`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${at}: above maximum`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) errors.push(`${at}: fewer than ${schema.minItems} items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) errors.push(`${at}: more than ${schema.maxItems} items`);
    if (schema.items) value.forEach((v, i) => validateNode(schema.items, v, rootSchema, `${at}[${i}]`, errors));
  }
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const props = schema.properties ?? {};
    for (const req of schema.required ?? []) {
      if (!(req in value)) errors.push(`${at}: missing required ${req}`);
    }
    if (schema.minProperties !== undefined && Object.keys(value).length < schema.minProperties) {
      errors.push(`${at}: fewer than ${schema.minProperties} properties`);
    }
    if (schema.propertyNames?.pattern) {
      const re = new RegExp(schema.propertyNames.pattern);
      for (const k of Object.keys(value)) if (!re.test(k)) errors.push(`${at}: bad property name ${k}`);
    }
    for (const [k, v] of Object.entries(value)) {
      if (k in props) validateNode(props[k], v, rootSchema, `${at}.${k}`, errors);
      else if (schema.additionalProperties === false) errors.push(`${at}: unexpected property ${k}`);
    }
    if (schema.anyOf) {
      const any = schema.anyOf.some((sub) => {
        const subErrors = [];
        validateNode(sub, value, rootSchema, at, subErrors);
        return subErrors.length === 0;
      });
      if (!any) errors.push(`${at}: no anyOf branch satisfied`);
    }
  }
}

/** Validate a payload against a vendored agent-admission schema. Returns error strings ([] = valid). */
export function validatePayload(task, payload, { variant = "request" } = {}) {
  const root = FAMILY[task];
  if (!root) return [`unknown task ${task}`];
  const schema = variant === "response" ? root.$defs?.Response : root;
  if (!schema) return [`no ${variant} schema for ${task}`];
  const errors = [];
  validateNode(schema, payload, root, `${task}#${variant}`, errors);
  return errors;
}

export const familySchemas = () => ({ FAMILY, SHARED, FRAMEWORK });
