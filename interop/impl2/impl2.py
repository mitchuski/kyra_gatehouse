"""Implementation #2 of the ToIP `agent-admission/*` Trust Task family.

INDEPENDENCE RULES (what makes the interop claim real):
  - shares NO code with Kyra Gate: no gatehouse_contracts, no gatehouse_verify,
    no @gatehouse imports — Python stdlib + the `cryptography` package only;
  - shares only the STANDARD: the vendored payload schemas (byte-identical
    upstream copies, see the bridge's SCHEMAS_PROVENANCE.md) and the envelope
    discipline (id/type/issuer/recipient/threadId/issuedAt/payload/proof);
  - has its OWN admission policy (a risk-rubric, not the PVM), its own event
    log, its own key custody namespace ("impl2-demo-seed:*") — different
    parties, different gate logic, same wire language.

Three EXPRESSIONS skin the same implementation (persona data in
./expressions/*.json — names, voices, criteria; never wire semantics).

W-1 RULE (enforced): envelope payloads carry digests, strings, integers and
booleans — never bare floats. Cross-writer JSON float rendering differs
("1.0" vs "1"), so a float in a signed payload breaks signatures across
languages. `mint_envelope` refuses floats outright.

CLI:
  python impl2.py mint   --expression expressions/risk-mastery.json --out t.json
  python impl2.py verify t.json          # verifies ANY family transcript
"""

import hashlib
import json
import re
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[1]
SCHEMA_DIR = REPO / "apps" / "agent-client" / "src" / "adapters" / "trust-tasks" / "schemas"
TYPE_BASE = "https://trusttasks.org/spec"
TASKS = ("apply", "respond", "approve", "issue", "revoke", "status")
HEX64 = re.compile(r"^[0-9a-f]{64}$")

# --- canonical JSON + hashing (independent re-derivation, not an import) ------

def canonical_json(obj) -> str:
    if isinstance(obj, list):
        return "[" + ",".join(canonical_json(x) for x in obj) + "]"
    if isinstance(obj, dict):
        items = sorted(obj.items(), key=lambda kv: kv[0])
        return "{" + ",".join(json.dumps(k) + ":" + canonical_json(v) for k, v in items) + "}"
    return json.dumps(obj, ensure_ascii=False)


def sha256_hex(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def content_hash(obj) -> str:
    return sha256_hex(canonical_json(obj))


# --- did:key ed25519 (own custody namespace) ----------------------------------

_B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"


def b58encode(data: bytes) -> str:
    n = int.from_bytes(data, "big")
    out = ""
    while n:
        n, r = divmod(n, 58)
        out = _B58[r] + out
    pad = len(data) - len(data.lstrip(b"\x00"))
    return "1" * pad + out


def b58decode(text: str) -> bytes:
    n = 0
    for ch in text:
        n = n * 58 + _B58.index(ch)
    raw = n.to_bytes((n.bit_length() + 7) // 8, "big")
    pad = len(text) - len(text.lstrip("1"))
    return b"\x00" * pad + raw


class Keypair:
    def __init__(self, label: str):
        seed = hashlib.sha256(f"impl2-demo-seed:{label}".encode()).digest()
        self._sk = Ed25519PrivateKey.from_private_bytes(seed)
        pub = self._sk.public_key().public_bytes(Encoding.Raw, PublicFormat.Raw)
        self.public_key_multibase = "z" + b58encode(b"\xed\x01" + pub)
        self.did = f"did:key:{self.public_key_multibase}"

    def sign(self, obj) -> str:
        return "z" + b58encode(self._sk.sign(canonical_json(obj).encode("utf-8")))


def verify_signature(did_or_mb: str, obj, signature_mb: str) -> bool:
    try:
        mb = did_or_mb.split("did:key:")[-1]
        if not mb.startswith("z"):
            return False
        decoded = b58decode(mb[1:])
        if len(decoded) != 34 or decoded[:2] != b"\xed\x01":
            return False
        pub = Ed25519PublicKey.from_public_bytes(decoded[2:])
        if not signature_mb.startswith("z"):
            return False
        pub.verify(b58decode(signature_mb[1:]), canonical_json(obj).encode("utf-8"))
        return True
    except Exception:
        return False


# --- vendored-schema structural validation (independent port) -----------------

def _load(p: Path):
    return json.loads(p.read_text(encoding="utf-8"))


FAMILY = {t: _load(SCHEMA_DIR / "agent-admission" / f"{t}.0.1.payload.schema.json") for t in TASKS}
SHARED = _load(SCHEMA_DIR / "agent-admission" / "_shared" / "admission.0.1.schema.json")
FRAMEWORK = _load(SCHEMA_DIR / "_framework" / "framework.0.1.schema.json")
REF_MAP = {
    "../../_shared/0.1/admission.schema.json": SHARED,
    "../../../_framework/0.1/framework.schema.json": FRAMEWORK,
}


def _resolve_ref(ref: str, root):
    file, _, fragment = ref.partition("#")
    base = root if file == "" else REF_MAP.get(file)
    if base is None:
        return None, None
    node = base
    for part in [p for p in fragment.split("/") if p]:
        if not isinstance(node, dict) or part not in node:
            return None, None
        node = node[part]
    return node, (root if file == "" else REF_MAP.get(file))


def _validate(schema, value, root, at, errors):
    if not isinstance(schema, dict):
        return
    if "$ref" in schema:
        target, next_root = _resolve_ref(schema["$ref"], root)
        if target is None:
            errors.append(f"{at}: unresolvable $ref {schema['$ref']}")
            return
        _validate(target, value, next_root, at, errors)
        return
    if "const" in schema and value != schema["const"]:
        errors.append(f"{at}: expected const {schema['const']!r}")
    if "enum" in schema and value not in schema["enum"]:
        errors.append(f"{at}: {value!r} not in enum")
    t = schema.get("type")
    if t:
        ok = (
            (t == "object" and isinstance(value, dict))
            or (t == "array" and isinstance(value, list))
            or (t == "string" and isinstance(value, str))
            or (t == "boolean" and isinstance(value, bool))
            or (t == "integer" and isinstance(value, int) and not isinstance(value, bool))
            or (t == "number" and isinstance(value, (int, float)) and not isinstance(value, bool))
        )
        if not ok:
            errors.append(f"{at}: expected {t}")
            return
    if isinstance(value, str) and "pattern" in schema and not re.search(schema["pattern"], value):
        errors.append(f"{at}: does not match {schema['pattern']}")
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if "minimum" in schema and value < schema["minimum"]:
            errors.append(f"{at}: below minimum")
        if "maximum" in schema and value > schema["maximum"]:
            errors.append(f"{at}: above maximum")
    if isinstance(value, list):
        if "minItems" in schema and len(value) < schema["minItems"]:
            errors.append(f"{at}: fewer than {schema['minItems']} items")
        if "maxItems" in schema and len(value) > schema["maxItems"]:
            errors.append(f"{at}: more than {schema['maxItems']} items")
        if "items" in schema:
            for i, v in enumerate(value):
                _validate(schema["items"], v, root, f"{at}[{i}]", errors)
    if isinstance(value, dict):
        props = schema.get("properties", {})
        for req in schema.get("required", []):
            if req not in value:
                errors.append(f"{at}: missing required {req}")
        if "minProperties" in schema and len(value) < schema["minProperties"]:
            errors.append(f"{at}: fewer than {schema['minProperties']} properties")
        pn = schema.get("propertyNames", {}).get("pattern")
        if pn:
            for k in value:
                if not re.search(pn, k):
                    errors.append(f"{at}: bad property name {k}")
        for k, v in value.items():
            if k in props:
                _validate(props[k], v, root, f"{at}.{k}", errors)
            elif schema.get("additionalProperties") is False:
                errors.append(f"{at}: unexpected property {k}")
        if "anyOf" in schema:
            hit = False
            for sub in schema["anyOf"]:
                sub_errors = []
                _validate(sub, value, root, at, sub_errors)
                if not sub_errors:
                    hit = True
                    break
            if not hit:
                errors.append(f"{at}: no anyOf branch satisfied")


def validate_payload(task: str, payload, variant: str = "request"):
    root = FAMILY.get(task)
    if root is None:
        return [f"unknown task {task}"]
    schema = root.get("$defs", {}).get("Response") if variant == "response" else root
    if schema is None:
        return [f"no {variant} schema for {task}"]
    errors = []
    _validate(schema, payload, root, f"{task}#{variant}", errors)
    return errors


# --- envelopes (W-1 enforced) -------------------------------------------------

def _assert_no_floats(value, at="payload"):
    if isinstance(value, float):
        raise ValueError(f"W-1 violation: bare float at {at} — floats break cross-writer signatures")
    if isinstance(value, dict):
        for k, v in value.items():
            _assert_no_floats(v, f"{at}.{k}")
    if isinstance(value, list):
        for i, v in enumerate(value):
            _assert_no_floats(v, f"{at}[{i}]")


def mint_envelope(task, keypair, recipient, payload, variant="request", thread_id=None, issued_at=None, id_seed=None):
    _assert_no_floats(payload)
    suffix = "#response" if variant == "response" else ""
    doc = {
        "id": f"urn:uuid:{uuid.uuid5(uuid.NAMESPACE_URL, id_seed) if id_seed else uuid.uuid4()}",
        "type": f"{TYPE_BASE}/agent-admission/{task}/0.1{suffix}",
        "issuer": keypair.did,
        "recipient": recipient,
        **({"threadId": thread_id} if thread_id else {}),
        "issuedAt": issued_at or datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "payload": payload,
    }
    doc["proof"] = {
        "type": "DataIntegrityProof",
        "cryptosuite": "eddsa-jcs-2022",
        "created": doc["issuedAt"],
        "verificationMethod": f"{keypair.did}#{keypair.public_key_multibase}",
        "proofPurpose": "assertionMethod",
        "proofValue": keypair.sign(doc),
    }
    return doc


def verify_envelope(doc) -> bool:
    if not isinstance(doc, dict) or "proof" not in doc:
        return False
    if not str(doc["proof"].get("verificationMethod", "")).startswith(str(doc.get("issuer"))):
        return False
    body = {k: v for k, v in doc.items() if k != "proof"}
    return verify_signature(doc["issuer"], body, doc["proof"]["proofValue"])


# --- the second gate: a risk-rubric authority ---------------------------------

class EventLog:
    """Impl2's own evidence discipline: content-addressed, chained events."""

    def __init__(self):
        self.events = []

    def append(self, actor, action, subject, payload, rationale, at):
        event = {
            "actor": actor,
            "action": action,
            "subject": subject,
            "payloadDigest": content_hash(payload),
            "priorHash": self.events[-1]["contentHash"] if self.events else "0" * 64,
            "timestamp": at,
            "rationale": rationale,
        }
        event["contentHash"] = content_hash(event)
        self.events.append(event)
        return event


def run_ceremony(expression: dict) -> dict:
    """One full admission ceremony under impl2's OWN policy, as trust tasks."""
    authority = Keypair(expression["authority"]["seed"])
    agent = Keypair(expression["agent"]["seed"])
    relying = Keypair(expression["relying"]["seed"])
    log = EventLog()
    t0 = datetime(2026, 7, 18, 12, 0, tzinfo=timezone.utc)
    clock = [t0]

    def now():
        clock[0] = clock[0] + timedelta(seconds=7)
        return clock[0].strftime("%Y-%m-%dT%H:%M:%SZ")

    documents = []

    def emit(task, keypair, recipient, payload, variant="request", thread_id=None):
        doc = mint_envelope(
            task, keypair, recipient, payload, variant=variant, thread_id=thread_id,
            issued_at=now(), id_seed=f"{expression['id']}:{task}:{variant}:{len(documents)}",
        )
        documents.append({"task": task, "variant": variant, "doc": doc})
        return doc

    # apply
    submission = {"agent": agent.did, "profile": expression["agent"]["label"]}
    submission_digest = content_hash(submission)
    apply_doc = emit("apply", agent, authority.did, {
        "agent": agent.did,
        "policyRef": expression["policyRef"],
        "submissionDigest": submission_digest,
    })
    log.append(authority.did, "gate.approach", agent.did, submission, "agent applies at the second gate", now())

    criteria = expression["criteria"]
    emit("apply", authority, agent.did, {
        "applicationId": agent.did,
        "witnessDraw": {
            "algorithm": "sha256-canonical-json",
            "submissionDigest": submission_digest,
            "criteria": [{"criterionId": c["id"], "prompt": c["prompt"]} for c in criteria],
        },
        "respondBy": (clock[0] + timedelta(minutes=30)).strftime("%Y-%m-%dT%H:%M:%SZ"),
    }, variant="response", thread_id=apply_doc["id"])

    # respond — impl2's own policy: keyword-rubric coverage per criterion
    answers = [{"criterionId": c["id"], "answer": c["agentAnswer"]} for c in criteria]
    respond_doc = emit("respond", agent, authority.did, {
        "agent": agent.did,
        "applicationId": agent.did,
        "answers": answers,
    })

    def rubric_passes(criterion, answer_text):
        tokens = set(re.findall(r"[a-z0-9]+", answer_text.lower()))
        hits = sum(1 for kw in criterion["rubric"] if set(re.findall(r"[a-z0-9]+", kw.lower())) <= tokens)
        return hits * 100 >= criterion["passPercent"] * len(criterion["rubric"])

    passed_all = all(rubric_passes(c, a["answer"]) for c, a in zip(criteria, answers))
    scored = log.append(
        authority.did, "challenge.scored", agent.did, {"answers": answers},
        f"risk rubric scored: {'passed' if passed_all else 'failed'}", now(),
    )
    understanding_gate = {
        "gate": "understandingChallenge",
        "passed": passed_all,
        "at": now(),
        "evidenceDigest": scored["contentHash"],
    }
    emit("respond", authority, agent.did, {
        "applicationId": agent.did,
        "understandingGate": understanding_gate,
    }, variant="response", thread_id=respond_doc["id"])

    # approve (human gate; supervisor == authority in the demo posture)
    approve_doc = emit("approve", authority, authority.did, {
        "applicationId": agent.did,
        "agent": agent.did,
        "decision": "approve",
        "note": expression["voice"]["approveNote"],
    })
    approval = log.append(
        authority.did, "approval.granted", agent.did, {"applicationId": agent.did},
        expression["voice"]["approveNote"], now(),
    )
    supervisor_gate = {
        "gate": "supervisorApproval",
        "passed": True,
        "at": now(),
        "evidenceDigest": approval["contentHash"],
    }
    emit("approve", authority, authority.did, {
        "applicationId": agent.did,
        "supervisorGate": supervisor_gate,
    }, variant="response", thread_id=approve_doc["id"])

    # issue — impl2's own credential (W-1: integers and strings only)
    verdict = "validated" if passed_all else "failedHeldOut"
    tier_grant = {"tier": expression["tierOnPass"] if passed_all else 0, "scopeFunction": expression["policyRef"]}
    credential_body = {
        "@context": ["https://www.w3.org/ns/credentials/v2"],
        "type": ["VerifiableCredential", "AdmissionCredential"],
        "issuer": authority.did,
        "validFrom": now(),
        "credentialSubject": {"id": agent.did, "tier": tier_grant["tier"], "verdict": verdict},
    }
    credential = dict(credential_body)
    credential["proof"] = [
        {
            "type": "DataIntegrityProof",
            "verificationMethod": f"{authority.did}#{authority.public_key_multibase}",
            "created": credential_body["validFrom"],
            "proofPurpose": "assertionMethod",
            "proofValue": authority.sign(credential_body),
        },
        {
            "type": "DataIntegrityProof",
            "verificationMethod": f"{agent.did}#{agent.public_key_multibase}",
            "created": credential_body["validFrom"],
            "proofPurpose": "assertionMethod",
            "proofValue": agent.sign(credential_body),
        },
    ]
    issued_event = log.append(authority.did, "vrc.issued", agent.did, credential, "credential issued at the second gate", now())
    issue_doc = emit("issue", authority, agent.did, {
        "applicationId": agent.did,
        "agent": agent.did,
        "verdict": verdict,
        "tierGrant": tier_grant,
        "gates": [understanding_gate, supervisor_gate],
        "ledgerHead": issued_event["contentHash"],
        "credential": credential,
    })
    credential_digest = content_hash(credential)
    emit("issue", agent, authority.did, {
        "applicationId": agent.did,
        "credentialDigest": credential_digest,
        "counterSigned": True,
    }, variant="response", thread_id=issue_doc["id"])

    # revoke + status
    revoke_doc = emit("revoke", authority, authority.did, {
        "credentialId": credential_digest,
        "agent": agent.did,
        "reason": expression["voice"]["revokeReason"],
    })
    log.append(authority.did, "vrc.revoked", agent.did, {"credentialId": credential_digest},
               expression["voice"]["revokeReason"], now())
    revoked_at = now()
    emit("revoke", authority, authority.did, {
        "credentialId": credential_digest,
        "revoked": True,
        "revokedAt": revoked_at,
        "mirroredAnchors": [],
    }, variant="response", thread_id=revoke_doc["id"])

    status_doc = emit("status", relying, authority.did, {"agent": agent.did})
    emit("status", authority, relying.did, {
        "agent": agent.did,
        "credentialId": credential_digest,
        "verdict": verdict,
        "tierGrant": tier_grant,
        "issuedAt": issue_doc["issuedAt"],
        "revoked": True,
        "revokedAt": revoked_at,
        "anchors": [],
    }, variant="response", thread_id=status_doc["id"])

    return {
        "implementation": "impl2-python (independent second implementation)",
        "expression": {k: expression[k] for k in ("id", "register", "title")},
        "parties": {"authority": authority.did, "agent": agent.did, "relyingParty": relying.did},
        "events": log.events,
        "documents": documents,
    }


# --- transcript verification (works on impl1's transcripts AND our own) -------

def verify_transcript(transcript: dict):
    checks = []
    docs = transcript["documents"]
    ledger_hashes = {e["contentHash"] for e in transcript.get("events", [])}

    schema_errors = []
    for d in docs:
        schema_errors += validate_payload(d["task"], d["doc"]["payload"], d.get("variant", "request"))
    checks.append(("every payload validates against the vendored schemas", not schema_errors))
    checks.append(("every envelope proof verifies (ed25519, did:key)", all(verify_envelope(d["doc"]) for d in docs)))

    requests = {d["task"]: d["doc"]["id"] for d in docs if d.get("variant") == "request"}
    responses = [d for d in docs if d.get("variant") == "response"]
    checks.append(("every response threads to its request", all(d["doc"].get("threadId") == requests.get(d["task"]) for d in responses)))

    issue = next((d["doc"] for d in docs if d["task"] == "issue" and d.get("variant") == "request"), None)
    gates = issue["payload"]["gates"] if issue else []
    checks.append(("issue carries exactly two gates, distinct kinds", len(gates) == 2 and len({g["gate"] for g in gates}) == 2))
    checks.append(("verdict in the closed lexicon", bool(issue) and issue["payload"]["verdict"] in ("validated", "failedHeldOut", "blocked")))
    checks.append((
        "gate evidence digests are 64-hex (and resolve when the log travels)",
        all(HEX64.match(g["evidenceDigest"]) for g in gates)
        and (not ledger_hashes or all(g["evidenceDigest"] in ledger_hashes for g in gates)),
    ))

    credential = (issue or {}).get("payload", {}).get("credential") or {}
    proofs = credential.get("proof", [])
    parties = {str(p.get("verificationMethod", "")).split("#")[0] for p in proofs}
    checks.append(("credential is bilateral: two proofs, two distinct parties", len(proofs) == 2 and len(parties) == 2))

    counter = next((d["doc"] for d in docs if d["task"] == "issue" and d.get("variant") == "response"), None)
    agent_did = issue["payload"]["agent"] if issue else None
    checks.append(("the agent itself counter-signs the issue response", bool(counter) and counter["issuer"] == agent_did and verify_envelope(counter)))

    status = next((d["doc"] for d in docs if d["task"] == "status" and d.get("variant") == "response"), None)
    checks.append(("the relying-party status read shows revoked", bool(status) and status["payload"]["revoked"] is True))

    if transcript.get("events"):
        ok = True
        prior = "0" * 64
        for e in transcript["events"]:
            body = {k: v for k, v in e.items() if k != "contentHash"}
            ok = ok and e["contentHash"] == content_hash(body) and e["priorHash"] == prior
            prior = e["contentHash"]
        checks.append(("the travelling event log re-verifies from genesis", ok))

    return checks


# --- CLI ----------------------------------------------------------------------

def main():
    if len(sys.argv) < 2 or sys.argv[1] not in ("mint", "verify"):
        print(__doc__)
        sys.exit(2)
    if sys.argv[1] == "mint":
        expr_path = Path(sys.argv[sys.argv.index("--expression") + 1])
        out_path = Path(sys.argv[sys.argv.index("--out") + 1])
        expression = json.loads(expr_path.read_text(encoding="utf-8"))
        transcript = run_ceremony(expression)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(transcript, indent=1), encoding="utf-8")
        print(f"impl2 minted: {expression['title']} -> {out_path} ({len(transcript['documents'])} documents)")
        return
    transcript = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
    checks = verify_transcript(transcript)
    for name, ok in checks:
        print(f"  {'PASS' if ok else 'FAIL'} {name}")
    failed = sum(1 for _, ok in checks if not ok)
    print(f"impl2 verify: {len(checks) - failed}/{len(checks)} checks passed")
    sys.exit(0 if failed == 0 else 1)


if __name__ == "__main__":
    main()
