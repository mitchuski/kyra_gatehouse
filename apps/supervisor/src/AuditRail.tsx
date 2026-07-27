// The always-on audit rail (app-flow.md scene 7): the hash chain from genesis,
// recomputed IN THE BROWSER via @gatehouse/audit — the tamper inspector edits
// a client-side COPY and watches the chain break live. The server is never
// asked whether the tampered copy is valid; the supervisor's own machine says.
import { useEffect, useMemo, useState } from "react";
import { checkChain, type AuditEventLike, type LinkCheck } from "@gatehouse/audit";
import type { AuditEvent } from "@gatehouse/contracts";
import type { LedgerView } from "./api";

export function AuditRail({ ledger }: { ledger: LedgerView }) {
  const [tampered, setTampered] = useState<AuditEvent[] | null>(null);
  const [checks, setChecks] = useState<LinkCheck[]>([]);
  const [open, setOpen] = useState<number | null>(null);
  const events = tampered ?? ledger.events;

  useEffect(() => {
    let live = true;
    checkChain(events as unknown as AuditEventLike[]).then((c) => live && setChecks(c));
    return () => {
      live = false;
    };
  }, [events]);

  const okCount = useMemo(() => checks.filter((c) => c.hashOk && c.lineageOk).length, [checks]);
  const hTauLocal = events.length ? okCount / events.length : 1;

  const tamper = () => {
    if (!ledger.events.length) return;
    const copy: AuditEvent[] = JSON.parse(JSON.stringify(ledger.events));
    const mid = copy[Math.floor(copy.length / 2)]!;
    mid.rationale = mid.rationale + " [tampered]";
    setTampered(copy);
  };

  return (
    <section className="rail">
      <header>
        <h3>audit rail</h3>
        <span className={`htau ${hTauLocal === 1 ? "fly" : "hold"}`}>h(τ) = {hTauLocal.toFixed(2)}</span>
        <span className={hTauLocal === 1 ? "fly" : "hold"}>
          {tampered ? (hTauLocal === 1 ? "copy verifies" : "TAMPER DETECTED — a broken chain voids deployment") : "chain verified"}
        </span>
        <span className="spacer" />
        {tampered ? (
          <button onClick={() => setTampered(null)}>restore honest chain</button>
        ) : (
          <button onClick={tamper} disabled={!ledger.events.length}>
            tamper demo: flip one byte (client-side copy)
          </button>
        )}
      </header>
      <div className="chain">
        <span className="genesis" title="genesis">0×64</span>
        {events.map((e, i) => {
          const c = checks[i];
          const bad = c && (!c.hashOk || !c.lineageOk);
          return (
            <button
              key={i}
              className={`block${bad ? " bad" : ""}${open === i ? " open" : ""}`}
              onClick={() => setOpen(open === i ? null : i)}
              title={e.rationale}
            >
              {e.action}
            </button>
          );
        })}
      </div>
      {open !== null && events[open] && (
        <pre className="event-detail">{JSON.stringify(events[open], null, 2)}</pre>
      )}
    </section>
  );
}
