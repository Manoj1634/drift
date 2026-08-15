"use client";

import { useEffect, useMemo, useState } from "react";
import { GapChart } from "@/components/GapChart";

type Outcome = { label: string; odds: string };

type LogLine = { id: number; text: string; kind: "sys" | "x" | "src" | "ev" | "done" };

const SCRIPT: Array<{ wait: number; text: string; kind: LogLine["kind"]; bump: number }> = [
  { wait: 420, text: "Spinning Evidence Scout…", kind: "sys", bump: 0 },
  { wait: 700, text: "Scraping Twitter / X", kind: "x", bump: 1.5 },
  { wait: 640, text: "Gathering leads", kind: "x", bump: 1.2 },
  { wait: 720, text: "@tudum · overnight finishers clustering", kind: "src", bump: 1.4 },
  { wait: 680, text: "Scoring chatter vs the book", kind: "ev", bump: 1.6 },
  { wait: 760, text: "Correlator vs CLOB print", kind: "ev", bump: 1.3 },
  { wait: 500, text: "Run complete", kind: "done", bump: 0.8 },
];

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

export default function BetDesk({
  title,
  venue,
  volumeLabel,
  marketSeries,
  evidenceSeries,
  labels,
  outcomes,
}: {
  title: string;
  venue: string;
  volumeLabel: string;
  marketSeries: number[];
  evidenceSeries: number[];
  labels?: Array<[number, string]>;
  outcomes: Outcome[];
}) {
  const baseM = useMemo(() => {
    const src = marketSeries.length ? marketSeries : [50, 50, 50, 50, 50, 50, 50, 50];
    return src.slice(-10);
  }, [marketSeries]);

  const lastM = baseM[baseM.length - 1] ?? 50;
  // Start aligned; mock runs open a small gap (not a 40-pt flag).
  const startE = lastM;
  const targetGap = 8;

  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [ev, setEv] = useState<number[]>(() => baseM.map(() => startE));
  const [marks, setMarks] = useState<number[]>([]);
  const [taken, setTaken] = useState(false);

  useEffect(() => {
    setEv(baseM.map(() => startE));
  }, [baseM, startE]);

  async function runAgents() {
    if (phase === "running") return;
    setPhase("running");
    setLogs([]);
    setMarks([]);
    setTaken(false);
    let series = baseM.map(() => startE);
    setEv(series);

    for (let i = 0; i < SCRIPT.length; i++) {
      const step = SCRIPT[i]!;
      await new Promise((r) => setTimeout(r, step.wait));
      series = [...series];
      const next = clamp((series[series.length - 1] ?? startE) + step.bump);
      series.push(next);
      if (series.length > 14) series = series.slice(-14);
      setEv(series);
      if (step.bump > 0) {
        setMarks((m) => [...m, series.length - 1]);
      }
      setLogs((prev) => [
        { id: Date.now() + i, text: step.text, kind: step.kind },
        ...prev,
      ].slice(0, 12));
    }

    // Pin a small, readable gap vs last market print.
    const pinned = clamp(lastM + targetGap);
    setEv((s) => {
      const n = [...s];
      n[n.length - 1] = pinned;
      return n;
    });
    setPhase("done");
  }

  const mForChart =
    ev.length > baseM.length
      ? [
          ...baseM,
          ...Array.from({ length: ev.length - baseM.length }, () => lastM),
        ]
      : baseM;
  const eNow = ev[ev.length - 1] ?? startE;
  const gap = Math.round((eNow - lastM) * 10) / 10;
  const gapLabel = `${gap >= 0 ? "+" : ""}${gap}`;

  const lead = outcomes[0] ?? { label: "Leader", odds: `${Math.round(lastM)}%` };
  const side = gap >= 0 ? "YES" : "NO";

  return (
    <div className="bet-desk">
      <div className="bet-main">
        <p className="eyebrow">{venue}</p>
        <p className="market-q">{title}</p>
        <div className="meta" style={{ marginBottom: 14 }}>
          <span>
            Vol <b>{volumeLabel}</b>
          </span>
          <span>
            Market <b>{Math.round(lastM * 10) / 10}%</b>
          </span>
        </div>

        <section className={`card hero bet-chart${phase === "running" ? " is-running" : ""}`}>
          {phase === "running" ? (
            <div className="bet-scrim" aria-live="polite">
              <span className="bet-spin" />
              Running agents
            </div>
          ) : null}
          <GapChart
            market={mForChart}
            evidence={ev}
            labels={labels}
            runMarks={marks}
            legend={false}
          />
          {phase === "done" ? (
            <div className="yn-dock">
              <button
                type="button"
                className={`yn-cta${taken ? " on" : ""}`}
                onClick={() => setTaken(true)}
              >
                <span className="yn-gap">{gapLabel}</span>
                <span className="yn-vs">vs market</span>
                <span className="yn-act">
                  {taken
                    ? `Paper ${side} logged`
                    : `Take paper ${side} · ${lead.label}`}
                </span>
              </button>
            </div>
          ) : null}
        </section>

        {phase !== "done" ? (
          <button
            type="button"
            className="btn run-agents"
            disabled={phase === "running"}
            onClick={() => void runAgents()}
          >
            {phase === "running" ? "Running…" : "Run agents"}
          </button>
        ) : null}
      </div>

      <aside className="agent-side" aria-label="Agent activity">
        <p className="eyebrow">Agents</p>
        {phase === "idle" ? (
          <p className="agent-idle">Hit Run agents to scout X and score the book.</p>
        ) : null}
        <ul className="agent-log">
          {logs.map((l) => (
            <li key={l.id} className={`agent-line ${l.kind}`}>
              <i className="dot" />
              {l.text}
            </li>
          ))}
        </ul>
        {phase === "done" ? (
          <div className="agent-sources">
            <p className="eyebrow">Sources</p>
            <q>X cluster: finish-through-the-night mentions, 4h window.</q>
            <q>Web: Tudum ranking chatter, no official print yet.</q>
            <q>CLOB: last trade {Math.round(lastM)}% · gap {gapLabel}.</q>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
