// WP4, TS side: the browser mirror of the canon discipline — canonical bytes,
// content addressing, chain verification, h(tau). Parity with
// gatehouse_contracts/canon.py is proven byte-for-byte by the vitest lane and
// runtime 03; this package exists so the SUPERVISOR'S OWN BROWSER can recompute
// the chain (the dashboard's tamper demo trusts no server, including ours).
//
// Async because WebCrypto is async; works in browsers and Node >= 20.
// Contract: packages/contracts/schema/audit-event.schema.json (frozen).

export const GENESIS_HASH = "0".repeat(64);

/** Canonical JSON: recursive sorted keys, no whitespace (canon.py parity). */
export function canonicalJson(obj: unknown): string {
  if (Array.isArray(obj)) return `[${obj.map(canonicalJson).join(",")}]`;
  if (obj !== null && typeof obj === "object") {
    const entries = Object.entries(obj as Record<string, unknown>)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(obj);
}

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const contentHash = (obj: unknown): Promise<string> => sha256Hex(canonicalJson(obj));

export interface AuditEventLike {
  contentHash?: string;
  priorHash?: string;
  rationale?: string;
  [key: string]: unknown;
}

/** The contentHash of an event: hash of the event without its contentHash. */
export async function auditEventHash(event: AuditEventLike): Promise<string> {
  const { contentHash: _drop, ...body } = event;
  return contentHash(body);
}

/** Per-event verification result, for rendering the rail link by link. */
export interface LinkCheck {
  index: number;
  hashOk: boolean;
  lineageOk: boolean;
  recomputed: string;
}

export async function checkChain(events: AuditEventLike[]): Promise<LinkCheck[]> {
  const checks: LinkCheck[] = [];
  let prior = GENESIS_HASH;
  for (let i = 0; i < events.length; i++) {
    const event = events[i]!;
    const recomputed = await auditEventHash(event);
    checks.push({
      index: i,
      hashOk: event.contentHash === recomputed,
      lineageOk: event.priorHash === prior,
      recomputed,
    });
    prior = event.contentHash ?? recomputed;
  }
  return checks;
}

/** Violations list, empty = valid (canon.verify_chain parity). */
export async function verifyChain(events: AuditEventLike[]): Promise<string[]> {
  const checks = await checkChain(events);
  const violations: string[] = [];
  for (const c of checks) {
    if (!c.hashOk) violations.push(`event[${c.index}]: contentHash forged`);
    if (!c.lineageOk) violations.push(`event[${c.index}]: broken lineage`);
  }
  return violations;
}

/** h(tau): the fraction of history that verifies. Empty history is whole. */
export async function hTau(events: AuditEventLike[]): Promise<number> {
  if (events.length === 0) return 1.0;
  const checks = await checkChain(events);
  return checks.filter((c) => c.hashOk && c.lineageOk).length / events.length;
}
