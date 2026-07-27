// The sovereignty instrument triptych (app-flow.md scene 4), animated: the Σ
// heatmap on 1−σ, the det(Σ) volume gauge with a live COLLAPSING TETRAHEDRON,
// and the 64-vertex lattice with the located vertex pulsing. Values animate
// through a small lerp hook — the UI still renders only engine-derived numbers.
import { useEffect, useRef, useState } from "react";
import type { AssessmentResult } from "@gatehouse/contracts";
import type { PolicyView } from "./api";

const FORCE_LABELS = ["S", "M", "R", "C"] as const;
const FORCE_NAMES = ["Protect", "Project", "Reflect", "Connect"] as const;

/** Smoothly approach a target value (for gauges and the tetrahedron). */
function useAnimated(target: number, ms = 700): number {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = performance.now();
    const begin = from.current;
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      const eased = 1 - (1 - k) ** 3;
      setValue(begin + (target - begin) * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

export function SigmaHeatmap({ matrix }: { matrix: number[][] }) {
  return (
    <div className="instrument">
      <h4>Σ — residual correlation (1−σ)</h4>
      <table className="sigma">
        <thead>
          <tr>
            <th />
            {FORCE_LABELS.map((l, i) => (
              <th key={l} title={FORCE_NAMES[i]}>{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <th title={FORCE_NAMES[i]}>{FORCE_LABELS[i]}</th>
              {row.map((v, j) => (
                <td
                  key={j}
                  className="cell"
                  style={{ background: i === j ? "#2c3440" : `rgba(224, 108, 84, ${v.toFixed(3)})` }}
                  title={i === j ? "unit diagonal" : `residual correlation ${v.toFixed(3)}`}
                >
                  {v.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** The tetrahedron whose volume IS det(Σ): full at 1, flat at 0. */
function Tetrahedron({ det }: { det: number }) {
  const d = Math.max(0, Math.min(1, det));
  // Base triangle fixed; the apex sinks toward the base centroid as det -> 0.
  const base: [number, number][] = [[12, 86], [108, 86], [60, 64]];
  const apex: [number, number] = [60, 82 - 68 * d];
  const cls = det <= 0 ? "hold" : "fly";
  return (
    <svg className="tetra" viewBox="0 0 120 96" width="120" height="96" aria-label={`tetrahedron volume ${det.toFixed(3)}`}>
      <polygon points={base.map((p) => p.join(",")).join(" ")} className="tetra-base" />
      {base.map((p, i) => (
        <line key={i} x1={apex[0]} y1={apex[1]} x2={p[0]} y2={p[1]} className={`tetra-edge ${cls}`} />
      ))}
      <circle cx={apex[0]} cy={apex[1]} r="2.5" className={`tetra-apex ${cls}`} />
    </svg>
  );
}

export function DetGauge({ det, policy }: { det: number; policy: PolicyView | null }) {
  const fly = policy?.config.det_fly_threshold ?? 0.15;
  const animated = useAnimated(Math.max(0, Math.min(1, det)));
  const decision = det <= 0 ? "hold" : det < fly ? "sandbox" : "fly";
  return (
    <div className="instrument">
      <h4>det(Σ) — sovereignty volume</h4>
      <Tetrahedron det={animated} />
      <div className="gauge">
        <div className={`gauge-fill ${decision}`} style={{ width: `${animated * 100}%` }} />
        <div className="gauge-marker" style={{ left: `${fly * 100}%` }} title={`fly threshold ${fly}`} />
      </div>
      <div className="gauge-legend">
        <span className="hold">≤0 hold</span>
        <span className="sandbox">&lt;{fly} sandbox</span>
        <span className="fly">≥{fly} fly</span>
        <strong className={decision}>{det.toFixed(4)} → {decision}</strong>
      </div>
    </div>
  );
}

const STRATA = [1, 6, 15, 20, 15, 6, 1];
const popcount = (v: number) => v.toString(2).split("1").length - 1;

export function Lattice({ assessment }: { assessment: AssessmentResult }) {
  const vertex = assessment.sovereignty.vertex;
  const byStratum: number[][] = STRATA.map(() => []);
  for (let v = 0; v < 64; v++) byStratum[popcount(v)]!.push(v);
  return (
    <div className="instrument">
      <h4>the 64-vertex lattice — stratum {assessment.stratum} · tier {assessment.tier}</h4>
      <div className="lattice">
        {byStratum
          .map((vs, s) => (
            <div className="stratum" key={s} title={`stratum ${s}: ${vs.length} vertices`}>
              <span className="stratum-label">{s}</span>
              {vs.map((v) => (
                <span key={v} className={`vertex${v === vertex ? " lit" : ""}`} title={`vertex ${v}`} />
              ))}
            </div>
          ))
          .reverse()}
      </div>
      <div className="bits">
        {assessment.sovereignty.bits.split("").map((bit, i) => (
          <span key={i} className={`bit${bit === "1" ? " on" : ""}`}>
            {assessment.sovereignty.bitOrder[i]} {bit}
          </span>
        ))}
      </div>
    </div>
  );
}
