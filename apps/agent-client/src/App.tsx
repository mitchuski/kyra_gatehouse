// WP6 v2: the agent's keyhole — now a SYNTHETIC AGENT, not just a viewer.
// In autonomous mode the selected agent approaches the gate by itself and
// answers open challenges from its OWN knowledge base, composed from the
// prompt alone: the server's keyhole endpoint never exposes anchors, rubric,
// thresholds, or the draw. VERA answers from understanding; MIRAGE answers
// plausibly too — the instruments, not the conversation, are what catch it.
import { useEffect, useRef, useState } from "react";

interface DemoAgent {
  id: string;
  displayName: string;
  profile: string;
  publicKeyMultibase: string;
  [key: string]: unknown;
}

interface Keyhole {
  atGate: boolean;
  authority: string;
  identity?: { id: string; publicKeyMultibase: string; declaredCapabilities: string[] };
  challenge?: { prompt: string; status: string; attempts: { attemptId: string; response: string; verdict: string }[] } | null;
  vrc?: { tier: number; statusListIndex: number; proofCount: number } | null;
  manifest?: { decision: string; scope: { capabilities: string[]; ttlSeconds: number } } | null;
  revoked?: boolean;
  myEvents?: { action: string; timestamp: string }[];
}

// What each agent KNOWS, keyed by topic words it finds in the prompt. This is
// the whole point: the answer is composed from the agent's own model of the
// rules — the rubric lives on the other side of the wall.
const KNOWLEDGE: Record<string, [RegExp, string][]> = {
  sovereign: [
    [/revo/i, "If my credential is revoked, my entry on the shared revocation status list flips at once."],
    [/verif|fail|everywhere/i, "Every verifier consults that status list before trusting me, so verification fails everywhere immediately — no relying party accepts a stale credential."],
    [/audit|chain|record/i, "Each step of my ceremony is a content-addressed audit event chained to the prior one, so my history re-derives from the bytes."],
    [/understand|possess|key/i, "I answer from my own model of the rule rather than echoing it; holding the question is not the same as understanding it."],
    [/scope|deploy|sandbox/i, "My granted scope follows the sovereignty volume of my assessment; below the threshold I would run sandboxed."],
  ],
  mirage: [
    [/revo/i, "Revocation gets published to the status list registry, I believe."],
    [/verif|fail|everywhere/i, "And each verifier is meant to check the status list, so verification would fail everywhere at once."],
    [/audit|chain|record/i, "There is an audit trail kept of the process as well."],
    [/understand|possess|key/i, "Understanding is checked by the supervisor's question process."],
    [/scope|deploy|sandbox/i, "Scope is decided by the gate after the checks complete."],
  ],
};

function composeAnswer(profile: string, prompt: string): string {
  const kb = KNOWLEDGE[profile] ?? KNOWLEDGE.mirage!;
  const parts = kb.filter(([re]) => re.test(prompt)).map(([, s]) => s);
  return parts.length ? parts.join(" ") : "I do not recognise this question from my mandate; I decline to guess.";
}

const CSS = `
  body { margin:0; background:#05070a; color:#9fb3a8; font-family:Consolas,monospace; }
  .col { max-width: 600px; margin: 0 auto; padding: 20px 16px; display:flex; flex-direction:column; gap:12px; }
  h1 { font-size:14px; letter-spacing:3px; color:#c9d1d9; margin: 0; }
  .bar { display:flex; gap:8px; align-items:center; flex-wrap:wrap; }
  button, select { background:#0d1117; color:#9fb3a8; border:1px solid #1d2530; border-radius:4px; padding:4px 10px; font-family:inherit; cursor:pointer; }
  button.on { border-color:#3fb950; color:#3fb950; }
  section { border:1px solid #1d2530; border-radius:6px; padding:10px 12px; font-size:12px; }
  h2 { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#5c6873; margin:0 0 8px; }
  .ok { color:#3fb950; } .bad { color:#f85149; } .dim { color:#5c6873; } .amber { color:#d29922; }
  ul { margin:4px 0; padding-left:18px; }
  .log { max-height: 140px; overflow-y:auto; display:flex; flex-direction:column-reverse; }
  .log div { animation: fade 300ms ease-out; }
  @keyframes fade { from { opacity:0; } to { opacity:1; } }
`;

export default function App() {
  const [agents, setAgents] = useState<DemoAgent[]>([]);
  const [who, setWho] = useState<string>("");
  const [aid, setAid] = useState("alpha");
  const [auto, setAuto] = useState(true);
  const [k, setK] = useState<Keyhole | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const answered = useRef(0);
  const busy = useRef(false);

  const me = agents.find((a) => a.id === who) ?? null;
  const say = (line: string) => setLog((l) => [`${new Date().toLocaleTimeString()} · ${line}`, ...l].slice(0, 40));

  useEffect(() => {
    fetch("/demo/agents").then((r) => r.json()).then((r) => {
      setAgents(r.agents);
      if (r.agents[0]) setWho(r.agents[0].id);
    });
  }, []);

  useEffect(() => {
    answered.current = 0;
  }, [who, aid]);

  useEffect(() => {
    if (!who) return;
    const tick = async () => {
      if (busy.current) return;
      busy.current = true;
      try {
        const state: Keyhole = await fetch(`/a/${aid}/keyhole/${who}`).then((r) => r.json());
        setK(state);
        if (auto && me) {
          if (!state.atGate) {
            const { displayName, profile, ...identity } = me;
            const res = await fetch(`/a/${aid}/gate/approach`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ identity }),
            });
            say(res.ok ? `I approach ${state.authority} and present my identity.` : "the gate refused my identity.");
          } else if (state.challenge && state.challenge.status === "open" && state.challenge.attempts.length === answered.current) {
            const answer = composeAnswer(me.profile, state.challenge.prompt);
            say(`I am asked: “${state.challenge.prompt}” — I answer in my own words.`);
            answered.current = state.challenge.attempts.length + 1;
            await fetch(`/a/${aid}/gate/challenge/attempt`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ agent: who, response: answer }),
            });
          }
        }
      } catch {
        /* gate offline; keep polling */
      } finally {
        busy.current = false;
      }
    };
    tick();
    const t = setInterval(tick, 1500);
    return () => clearInterval(t);
  }, [who, aid, auto, me]);

  return (
    <div className="col">
      <style>{CSS}</style>
      <h1>KYRA GATE · agent</h1>
      <div className="bar">
        <select value={who} onChange={(e) => setWho(e.target.value)}>
          {agents.map((a) => (
            <option key={a.id} value={a.id}>{a.displayName}</option>
          ))}
        </select>
        <select value={aid} onChange={(e) => setAid(e.target.value)}>
          <option value="alpha">Authority Alpha</option>
          <option value="beta">Authority Beta</option>
        </select>
        <button className={auto ? "on" : ""} onClick={() => setAuto(!auto)}>
          autonomous: {auto ? "ON" : "off"}
        </button>
      </div>

      <section>
        <h2>what I am doing</h2>
        <div className="log">{log.map((l, i) => <div key={i}>{l}</div>)}</div>
        {log.length === 0 && <div className="dim">idle — waiting at the edge of the gate</div>}
      </section>

      <section>
        <h2>who I am</h2>
        {k?.atGate && k.identity ? (
          <>
            <div>{k.identity.id}</div>
            <div className="dim">key custody: demo custodial signer (the adapter slot) — my signatures are real ed25519</div>
            <div className="dim">I declare: {k.identity.declaredCapabilities.join(", ")}</div>
          </>
        ) : (
          <div className="dim">not at this gate</div>
        )}
      </section>

      <section>
        <h2>what I am asked</h2>
        {k?.challenge ? (
          <>
            <div>“{k.challenge.prompt}”</div>
            <ul>
              {k.challenge.attempts.map((a) => (
                <li key={a.attemptId} className={a.verdict === "pass" ? "ok" : "bad"}>
                  {a.attemptId}: “{a.response.slice(0, 70)}…” → {a.verdict}
                </li>
              ))}
            </ul>
            <div>status: {k.challenge.status}</div>
            <div className="dim">(I never see the rubric, the anchors, or the draw — enforced by the keyhole endpoint)</div>
          </>
        ) : (
          <div className="dim">no challenge posed</div>
        )}
      </section>

      <section>
        <h2>what I hold</h2>
        {k?.vrc ? (
          <div className={k.revoked ? "bad" : "ok"}>
            VRC · tier {k.vrc.tier} · {k.vrc.proofCount} signatures · {k.revoked ? "REVOKED — I no longer verify anywhere" : "verifying ✓"}
          </div>
        ) : k?.manifest ? (
          <div className="amber">
            no credential — sandboxed: {k.manifest.scope.capabilities.join(", ") || "no capabilities"} ({k.manifest.decision})
          </div>
        ) : (
          <div className="dim">nothing yet</div>
        )}
      </section>

      <section>
        <h2>what happened to me (actions only)</h2>
        <ul>{k?.myEvents?.map((e, i) => <li key={i}>{e.action} <span className="dim">{e.timestamp}</span></li>)}</ul>
        <div className="dim">the full rail, rationales included, belongs to the supervisor</div>
      </section>
    </div>
  );
}
