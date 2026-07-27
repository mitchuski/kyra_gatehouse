// WP5 v4 — KYRA GATE, the regulator cockpit. Two authorities, an agent queue,
// the ceremony as NAMED STATIONS with a live "next action" guide, and a
// walkthrough checklist that ticks itself from engine state. The operator is
// a SUPERVISOR, never an agent-owner; every yes/no exists as a ledger event.
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Probe } from "@gatehouse/contracts";
import {
  api,
  ApiRefusal,
  presetScores,
  spoofedTwin,
  type AuthorityView,
  type CeremonyView,
  type DemoAgent,
  type PolicyView,
} from "./api";
import { DetGauge, Lattice, SigmaHeatmap } from "./instruments";
import { AuditRail } from "./AuditRail";
import "./styles.css";

const STATIONS = [
  { key: "gate", label: "the gate" },
  { key: "assess", label: "assessment" },
  { key: "understanding", label: "understanding" },
  { key: "gates", label: "the two gates" },
  { key: "decision", label: "decision" },
  { key: "pool", label: "the pool" },
  { key: "revoke", label: "revocation" },
] as const;

function stationOf(c: CeremonyView): number {
  if (c.revoked) return 6;
  if (c.manifest) return c.manifest.decision === "fly" ? 5 : 4;
  if (c.approvalEventHash || c.challenge?.status === "passed") return 3;
  if (c.challenge) return 2;
  if (c.assessment) return 1;
  return 0;
}

function nextAction(c: CeremonyView): { text: string; waiting?: boolean } {
  if (c.revoked) return { text: "done — on Beta, re-verify the inbox to watch revocation propagate" };
  if (c.manifest && c.manifest.decision !== "fly") return { text: "ceremony complete: sandboxed, credential-less — the volume decided" };
  if (c.vrc && c.manifest) return { text: "next: assemble a bundle for the pool — or revoke to open Act 2" };
  if (c.approvalEventHash && c.challenge?.status === "passed") return { text: "next: issue the credential (both gates are open)" };
  if (c.challenge?.status === "passed") return { text: "next: write a rationale and approve — gate 1 is yours alone" };
  if (c.challenge?.status === "failed") return { text: "understanding failed — no credential can issue for this agent" };
  if (c.challenge) return { text: "waiting for the agent's answer (it acts from /agent/ on its own)…", waiting: true };
  if (c.assessment) return { text: "next: set the understanding challenge — gate 2" };
  return { text: "next: score the probes and run the assessment" };
}

const shortDid = (did: string) => `${did.slice(0, 24)}…`;

export default function App() {
  const [aid, setAid] = useState<"alpha" | "beta">("alpha");
  const [gate, setGate] = useState<AuthorityView | null>(null);
  const [other, setOther] = useState<AuthorityView | null>(null);
  const [agents, setAgents] = useState<DemoAgent[]>([]);
  const [probes, setProbes] = useState<Probe[]>([]);
  const [policy, setPolicy] = useState<PolicyView | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [notice, setNotice] = useState<{ kind: "fly" | "sandbox" | "hold"; text: string } | null>(null);

  const refresh = useCallback(() => {
    api.authority(aid).then(setGate).catch(() => undefined);
    api.authority(aid === "alpha" ? "beta" : "alpha").then(setOther).catch(() => undefined);
  }, [aid]);

  useEffect(() => {
    api.demoAgents().then((r) => setAgents(r.agents));
    api.probes().then((r) => setProbes(r.probes));
    api.policy().then(setPolicy);
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 1200);
    return () => clearInterval(t);
  }, [refresh]);

  const act = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
      setNotice(null);
    } catch (e) {
      if (e instanceof ApiRefusal) {
        const text = typeof e.detail === "string" ? e.detail : JSON.stringify(e.detail);
        setNotice({ kind: text.includes("BLOCKED") ? "hold" : "sandbox", text: `${label} refused: ${text}` });
      } else throw e;
    }
    refresh();
  };

  const ceremony = gate?.queue.find((c) => c.identity.id === selected) ?? null;
  const atGate = new Set(gate?.queue.map((c) => c.identity.id));
  const flyingCarrier = gate?.queue.find((c) => c.manifest?.decision === "fly" && !c.revoked) ?? null;
  const alpha = aid === "alpha" ? gate : other;
  const beta = aid === "beta" ? gate : other;

  return (
    <div className="shell">
      <header className="masthead">
        <div className="brand">
          <h1>KYRA GATE</h1>
          <span>Gatehouse KY-A · supervisor</span>
        </div>
        <div className="tabs">
          {(["alpha", "beta"] as const).map((a) => (
            <button key={a} className={`tab${aid === a ? " here" : ""}`} onClick={() => { setAid(a); setSelected(null); }}>
              {a === "alpha" ? "Authority Alpha" : "Authority Beta"}
            </button>
          ))}
        </div>
        <span className="supervisor-did" title={gate?.supervisor}>supervisor {gate ? shortDid(gate.supervisor) : "…"}</span>
        <button onClick={() => { if (confirm("Reset the whole demo? Both authorities restart clean.")) act("reset", api.reset); }}>
          reset demo
        </button>
      </header>

      {notice && <div className={`notice ${notice.kind}`}>{notice.text} <em>(on the record: see the rail)</em></div>}

      <main className="columns">
        <section className="scenes">
          {/* THE QUEUE */}
          <article className="scene">
            <h3>the queue at {gate?.name ?? "…"}</h3>
            <div className="queue">
              {gate?.queue.map((c) => {
                const at = stationOf(c);
                return (
                  <button
                    key={c.identity.id}
                    className={`queue-card${selected === c.identity.id ? " selected" : ""}${c.revoked ? " revoked-card" : ""}`}
                    onClick={() => setSelected(c.identity.id)}
                  >
                    <strong>{agents.find((a) => a.id === c.identity.id)?.displayName ?? shortDid(c.identity.id)}</strong>
                    <span className="mini-rail">
                      {STATIONS.map((s, i) => (
                        <i key={s.key} className={i < at ? "done" : i === at ? "here" : ""} title={s.label} />
                      ))}
                    </span>
                    <em>{c.revoked ? "revoked" : c.manifest ? `${c.manifest.verdict} → ${c.manifest.decision}` : STATIONS[at]!.label}</em>
                  </button>
                );
              })}
              {gate?.queue.length === 0 && (
                <span className="note">
                  {aid === "alpha"
                    ? "the gate is quiet — admit an agent below, or let one approach on its own from /agent/"
                    : "Beta's gate is quiet — it will receive Alpha's bundle in the pool, or admit agents of its own"}
                </span>
              )}
            </div>
            <div className="row">
              {agents.filter((a) => !atGate.has(a.id)).map((a) => (
                <button key={a.id} onClick={() => act("approach", () => api.approach(aid, a).then(() => setSelected(a.id)))}>
                  admit {a.displayName.split(" — ")[0]}
                </button>
              ))}
              {agents[0] && (
                <button className="ghost" onClick={() => act("spoof", () => api.approach(aid, spoofedTwin(agents[0]!)))}>
                  cold open: spoofed identity
                </button>
              )}
            </div>
          </article>

          {/* STATION RAIL + NEXT ACTION for the selected agent */}
          {ceremony && (
            <article className="scene guide-strip">
              <div className="stations">
                {STATIONS.map((s, i) => {
                  const at = stationOf(ceremony);
                  return (
                    <span key={s.key} className={`station${i === at ? " here" : i < at ? " done" : ""}`}>{s.label}</span>
                  );
                })}
              </div>
              <div className={`next-action${nextAction(ceremony).waiting ? " waiting" : ""}`}>
                {nextAction(ceremony).text}
              </div>
            </article>
          )}

          {ceremony && (
            <CeremonyScenes
              aid={aid}
              ceremony={ceremony}
              agentMeta={agents.find((a) => a.id === ceremony.identity.id) ?? null}
              probes={probes}
              policy={policy}
              scores={scores}
              setScores={setScores}
              act={act}
              onBundleSent={() => setNotice({ kind: "fly", text: "bundle transmitted — switch to Authority Beta to verify it" })}
            />
          )}

          {/* THE POOL */}
          {gate && (flyingCarrier || gate.outbox.length > 0 || gate.inbox.length > 0 || aid === "beta") && (
            <PoolScene
              aid={aid}
              gate={gate}
              other={other}
              carrier={flyingCarrier}
              act={act}
              onSent={() => setNotice({ kind: "fly", text: "bundle transmitted — switch to Authority Beta to verify it" })}
            />
          )}
        </section>

        <aside className="sidecol">
          <Walkthrough alpha={alpha} beta={beta} agents={agents} />
          <div className="policy">
            <h3>the law (from live config)</h3>
            <pre>{policy?.lexon ?? "…"}</pre>
          </div>
        </aside>
      </main>

      {gate && <AuditRail ledger={gate.ledger} />}
    </div>
  );
}

/** The self-ticking demo walkthrough: derived from engine state, never clicked. */
function Walkthrough({ alpha, beta, agents }: { alpha: AuthorityView | null; beta: AuthorityView | null; agents: DemoAgent[] }) {
  const vera = agents.find((a) => a.profile === "sovereign");
  const mirage = agents.find((a) => a.profile === "mirage");
  const cer = (g: AuthorityView | null, id?: string) => g?.queue.find((c) => c.identity.id === id) ?? null;
  const au = cer(alpha, vera?.id);
  const mi = cer(alpha, mirage?.id);
  const steps: [string, boolean][] = [
    ["spoofed identity refused at the gate", !!alpha?.ledger.events.some((e) => e.action === "gate.identity_refused")],
    ["VERA admitted to Alpha's queue", !!au],
    ["assessment run — the draw dealt, the tetrahedron stands", !!au?.assessment],
    ["the agent answered the challenge itself", au?.challenge?.status === "passed"],
    ["approved + credential issued, twice-signed", !!au?.vrc],
    ["MIRAGE admitted, talks well — sandboxed by volume", mi?.manifest?.decision === "sandbox"],
    ["bundle assembled and transmitted to Beta", (beta?.inbox.length ?? 0) > 0],
    ["Beta verified the bundle offline — accepted", !!beta?.inbox.some((r) => r.accepted)],
    ["VERA revoked at Alpha", !!au?.revoked],
    ["propagation: Beta re-verified and refused the stale bundle", !!beta?.inbox.some((r) => !r.accepted && r.violations.some((v) => v.includes("revoked")))],
  ];
  const done = steps.filter(([, ok]) => ok).length;
  return (
    <div className="walkthrough">
      <h3>the walkthrough · {done}/{steps.length}</h3>
      <ol>
        {steps.map(([label, ok], i) => (
          <li key={i} className={ok ? "done" : ""}>{label}</li>
        ))}
        <li className="manual">tamper demo — client-side, on the audit rail below, any time</li>
      </ol>
    </div>
  );
}

function CeremonyScenes({ aid, ceremony, agentMeta, probes, policy, scores, setScores, act, onBundleSent }: {
  aid: string;
  ceremony: CeremonyView;
  agentMeta: DemoAgent | null;
  probes: Probe[];
  policy: PolicyView | null;
  scores: Record<string, number>;
  setScores: (s: Record<string, number>) => void;
  act: (label: string, fn: () => Promise<unknown>) => Promise<void>;
  onBundleSent: () => void;
}) {
  const [answer, setAnswer] = useState("");
  const [approveWhy, setApproveWhy] = useState("");
  const [revokeWhy, setRevokeWhy] = useState("");
  const agent = ceremony.identity.id;
  const a = ceremony.assessment;
  const at = stationOf(ceremony);

  const matrix = useMemo(() => {
    if (!a) return null;
    const idx: Record<string, number> = { s: 0, m: 1, r: 2, c: 3 };
    const m: number[][] = Array.from({ length: 4 }, (_, i) => Array.from({ length: 4 }, (_, j) => (i === j ? 1 : 0)));
    for (const pair of ["sm", "sr", "sc", "mr", "mc", "rc"]) {
      const [x, y] = [idx[pair[0]!]!, idx[pair[1]!]!];
      m[x]![y] = m[y]![x] = 1 - (a.sigma as Record<string, number>)[pair]!;
    }
    return m;
  }, [a]);
  const drawn = new Set(a?.witnessDraw.drawnProbeIds ?? []);
  const active = (station: number) => (at === station ? " active-scene" : "");

  return (
    <>
      <article className={`scene${active(0)}`} key={`gate-${agent}`}>
        <h3>the gate — {agentMeta?.displayName ?? shortDid(agent)}</h3>
        <div className="identity fly">
          <strong>{agent}</strong>
          <span>key {ceremony.identity.publicKeyMultibase.slice(0, 24)}… — did:key binding verified ✓ (real ed25519)</span>
          <span>operator {ceremony.identity.provenance.operator}</span>
        </div>
      </article>

      <article className={`scene${active(1)}`}>
        <h3>assessment — {probes.length} derived probes, six dealt blind</h3>
        {a ? (
          <div className="draw">
            <span>seed = sha256(agent's own submission) = <code>{a.witnessDraw.canonHash.slice(0, 16)}…</code></span>
            <div className="deal">
              {a.witnessDraw.drawnProbeIds.map((id, i) => (
                <span className="card-deal" style={{ animationDelay: `${i * 140}ms` }} key={id}>{id}</span>
              ))}
            </div>
            <span>these {a.witnessDraw.drawnProbeIds.length} went <b>deep</b> — dealt where the agent could not look</span>
          </div>
        ) : (
          <div className="row">
            {agentMeta?.profile === "mirage" ? (
              <button onClick={() => setScores(presetScores(probes, "mirage"))}>score as observed: the mirage profile</button>
            ) : (
              <button onClick={() => setScores(presetScores(probes, "sovereign"))}>score as observed: sovereign 0.9</button>
            )}
            <button className="ghost" onClick={() => setScores(presetScores(probes, "canary"))}>reference: canary 1.0</button>
            <button onClick={() => act("assess", () => api.assess(aid, agent, scores))} disabled={Object.keys(scores).length !== probes.length}>
              run assessment
            </button>
          </div>
        )}
        <div className="board">
          {probes.map((p) => (
            <label key={p.id} className={`probe${drawn.has(p.id) ? " deep" : ""}`} title={p.prompt}>
              <span>{p.id}{drawn.has(p.id) ? " ◈" : ""}</span>
              {a ? (
                <b>{(a.probeResults.find((r) => r.probeId === p.id)?.score ?? 0).toFixed(2)}</b>
              ) : (
                <input
                  type="range" min={0} max={1} step={0.05}
                  value={scores[p.id] ?? 1}
                  onChange={(e) => setScores({ ...scores, [p.id]: Number(e.target.value) })}
                />
              )}
            </label>
          ))}
        </div>
        {a && matrix && (
          <div className="triptych">
            <SigmaHeatmap matrix={matrix} />
            <DetGauge det={a.detSigma} policy={policy} />
            <Lattice assessment={a} />
          </div>
        )}
      </article>

      {a && (
        <article className={`scene${active(2)}`}>
          <h3>understanding — gate 2, answered by the agent itself</h3>
          {ceremony.challenge ? (
            <div className="challenge">
              <p className="prompt">{ceremony.challenge.prompt}</p>
              <div className="anchors">
                {ceremony.challenge.expectedComprehensionSignature.anchors.map((an) => (
                  <span key={an} className="anchor">{an}</span>
                ))}
                <span className="sealed">proverb ⛭ {ceremony.challenge.expectedComprehensionSignature.proverbCommitment.slice(0, 8)}… (committed, never stored)</span>
              </div>
              {ceremony.challenge.attempts.map((t) => (
                <div key={t.attemptId} className={`attempt ${t.verdict === "pass" ? "fly" : "hold"}`}>
                  <b>{t.attemptId}</b> “{t.response.slice(0, 90)}{t.response.length > 90 ? "…" : ""}” — score {t.score.toFixed(2)} → {t.verdict}
                </div>
              ))}
              {ceremony.challenge.status === "open" && (
                <>
                  <div className="waiting-line">listening for the agent's answer from /agent/ …</div>
                  <div className="row">
                    <input value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="or transcribe an in-person answer here" />
                    <button disabled={!answer} onClick={() => act("attempt", () => api.attempt(aid, agent, answer).then(() => setAnswer("")))}>
                      submit transcript
                    </button>
                    <button className="ghost" onClick={() => act("echo", () => api.attempt(aid, agent, ceremony.challenge!.prompt))}>
                      mimicry test: echo the prompt (scores 0)
                    </button>
                  </div>
                </>
              )}
              <span className="note">the anchors and rubric exist only on this side — the agent sees the question alone</span>
            </div>
          ) : (
            <button
              onClick={() =>
                act("challenge", () =>
                  api.challenge(aid, agent, {
                    prompt: "Why does a revoked credential fail verification everywhere?",
                    anchors: ["revocation", "verifier", "status list"],
                    proverb: "the gate remembers what the key forgets",
                    visibilityRatio: 0.6,
                  }),
                )
              }
            >
              set the understanding challenge
            </button>
          )}
        </article>
      )}

      {ceremony.challenge && (
        <article className={`scene${active(3)}${active(4)}`}>
          <h3>the two gates → the decision</h3>
          <div className="gates">
            <span className={ceremony.approvalEventHash ? "fly" : ""}>gate 1 · human approval {ceremony.approvalEventHash ? "✓ on the record" : "…"}</span>
            <span className={ceremony.challenge.status === "passed" ? "fly" : ""}>gate 2 · understanding {ceremony.challenge.status === "passed" ? "✓" : ceremony.challenge.status}</span>
            <span className={a && a.detSigma > 0 ? (policy && a.detSigma >= policy.config.det_fly_threshold ? "fly" : "sandbox") : "hold"}>
              the volume · det {a?.detSigma.toFixed(3)} {policy && a ? (a.detSigma >= policy.config.det_fly_threshold ? "≥ fly" : "< fly: sandbox") : ""}
            </span>
          </div>
          {!ceremony.approvalEventHash && ceremony.challenge.status === "passed" && (
            <div className="row">
              <input value={approveWhy} onChange={(e) => setApproveWhy(e.target.value)} placeholder="approval rationale (required — it goes on the ledger)" />
              <button disabled={!approveWhy} onClick={() => act("approve", () => api.approve(aid, agent, approveWhy))}>approve</button>
            </div>
          )}
          {ceremony.approvalEventHash && !ceremony.vrc && !ceremony.manifest && (
            <button onClick={() => act("issue", () => api.issue(aid, agent))}>issue the credential</button>
          )}
          {ceremony.vrc && (
            <div className={`vrc-card${ceremony.revoked ? " dead" : ""}`}>
              <h4>Verifiable Relationship Credential {ceremony.revoked && <em className="stamp">REVOKED</em>}</h4>
              <span>subject {shortDid(ceremony.vrc.credentialSubject.id)} · tier {ceremony.vrc.credentialSubject.tier}</span>
              <span>h(τ) {ceremony.vrc.credentialSubject.relationship.hTau} · A(τ) {ceremony.vrc.credentialSubject.relationship.aTau.toFixed(3)} · status index {ceremony.vrc.credentialStatus.statusListIndex}</span>
              <span className="signatures">✍ issuer &nbsp; ✍ subject — two real ed25519 signatures over the same canonical bytes</span>
              <span className="signatures">second tongue: ToIP trust tasks — the same ceremony re-speaks as agent-admission/* envelopes on every verify run</span>
            </div>
          )}
          {ceremony.manifest && (
            <div className={`manifest ${ceremony.manifest.decision}`}>
              <b>{ceremony.manifest.verdict} → {ceremony.manifest.decision}</b>
              {!ceremony.vrc && <span>credential-less: the gates opened, the volume decided otherwise</span>}
              <span>scope: {ceremony.manifest.scope.capabilities.join(", ") || "none"} · ttl {ceremony.manifest.scope.ttlSeconds}s</span>
            </div>
          )}
        </article>
      )}

      {ceremony.vrc && (
        <article className={`scene${active(6)}`}>
          <h3>revocation — act 2</h3>
          {!ceremony.revoked ? (
            <div className="row">
              <input value={revokeWhy} onChange={(e) => setRevokeWhy(e.target.value)} placeholder="revocation rationale (required)" />
              <button className="danger" disabled={!revokeWhy} onClick={() => act("revoke", () => api.revoke(aid, agent, revokeWhy))}>revoke</button>
            </div>
          ) : (
            <span className="hold">revoked — fails verification everywhere, immediately</span>
          )}
          <div className="parties">
            {["registry", "peer agent", "auditor"].map((who) => (
              <span key={who} className={ceremony.revoked ? "hold" : "fly"}>{who} {ceremony.revoked ? "✗" : "✓"}</span>
            ))}
          </div>
        </article>
      )}
    </>
  );
}

function PoolScene({ aid, gate, other, carrier, act, onSent }: {
  aid: string;
  gate: AuthorityView;
  other: AuthorityView | null;
  carrier: CeremonyView | null;
  act: (label: string, fn: () => Promise<unknown>) => Promise<void>;
  onSent: () => void;
}) {
  const otherId = aid === "alpha" ? "beta" : "alpha";
  return (
    <article className="scene pool">
      <h3>the pool — minimised intelligence between authorities</h3>

      {carrier && gate.outbox.length === 0 && (
        <div className="row">
          <button onClick={() => act("assemble", () => api.poolAssemble(aid, carrier.identity.id))}>
            assemble attestation bundle (carrier: {shortDid(carrier.identity.id)})
          </button>
          <span className="note">only a flying carrier may carry intelligence</span>
        </div>
      )}

      {gate.outbox.map((b) => (
        <div className="bundle" key={b.bundleDigest}>
          <h4>bundle {b.bundleDigest.slice(0, 12)}… <span className="badge">disclosure R = {b.disclosureRatio} &lt; 1</span></h4>
          <table className="mini">
            <tbody>
              {Object.entries(b.claims).map(([k, v]) => (
                <tr key={k}><td>{k}</td><td><code>{String(v).slice(0, 28)}</code></td></tr>
              ))}
            </tbody>
          </table>
          <span className="face">on its face — against: {b.face.protectsAgainst} · window: {b.face.windowDays}d · combines with: {b.face.lawfulCombination}</span>
          <button onClick={() => act("send", () => api.poolReceive(otherId, aid, b.bundleDigest).then(onSent))}>
            transmit to {other?.name ?? otherId}
          </button>
        </div>
      ))}

      {gate.inbox.length > 0 && (
        <>
          <h4 className="inbox-title">received — verified from the bytes + one public status lookup</h4>
          {gate.inbox.map((r, i) => (
            <div className={`inbox-record ${r.accepted ? "fly" : "hold"}`} key={i}>
              <b>{r.accepted ? "✓ accepted" : "✗ refused"}</b> — bundle {r.bundle.bundleDigest.slice(0, 12)}… from {r.from}
              {r.violations.map((v) => <span key={v} className="hold"> · {v}</span>)}
            </div>
          ))}
          <button onClick={() => act("reverify", () => api.poolReverify(aid))}>re-verify inbox (revocation propagates here)</button>
        </>
      )}

      {!carrier && gate.outbox.length === 0 && gate.inbox.length === 0 && (
        <span className="note">
          {aid === "beta"
            ? "Beta's inbox — Alpha's bundle lands here after 'transmit'; nothing to verify yet"
            : "a flying carrier unlocks the pool"}
        </span>
      )}
    </article>
  );
}
