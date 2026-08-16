"use client";

import { useEffect, useMemo, useState } from "react";
import { GapChart } from "@/components/GapChart";
import PaperTicket from "@/components/PaperTicket";

type Outcome = { label: string; odds: string; price: number };
type AgentMeta = {
  market: string;
  evidence: string;
  correlator: string;
  investigator: string;
};
type Source = [string, "mk" | "ev", string];
type LogLine = { id: number; text: string; kind: "sys" | "x" | "src" | "ev" | "done" };

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n * 10) / 10));
}

function honestLogs(agents: AgentMeta, sources: Source[]): LogLine[] {
  const lines: LogLine[] = [
    { id: 1, text: `Market Pulse · ${agents.market}`, kind: "sys" },
    { id: 2, text: `Evidence Scout · ${agents.evidence}`, kind: "ev" },
    { id: 3, text: `Correlator · ${agents.correlator}`, kind: "ev" },
    { id: 4, text: `Investigator · ${agents.investigator}`, kind: "done" },
  ];
  sources.slice(0, 3).forEach((s, i) => {
    lines.push({
      id: 10 + i,
      text: `${s[0]} · ${s[2]}`,
      kind: s[1] === "mk" ? "sys" : "src",
    });
  });
  return lines;
}

export default function BetDesk({
  slug,
  title,
  venue,
  volumeLabel,
  marketSeries,
  evidenceSeries,
  labels,
  outcomes,
  sources = [],
  agents,
  scored = false,
  onRescout,
}: {
  slug: string;
  title: string;
  venue: string;
  volumeLabel: string;
  marketSeries: number[];
  evidenceSeries: number[];
  labels?: Array<[number, string]>;
  outcomes: Outcome[];
  sources?: Source[];
  agents: AgentMeta;
  scored?: boolean;
  onRescout?: () => Promise<void>;
}) {
  const baseM = useMemo(() => {
    const src = marketSeries.length ? marketSeries : [50, 50, 50, 50, 50, 50, 50, 50];
    return src.map(clamp);
  }, [marketSeries]);

  const baseE = useMemo(() => {
    if (evidenceSeries.length >= 2) {
      return evidenceSeries.slice(-baseM.length).map(clamp);
    }
    return baseM.slice();
  }, [evidenceSeries, baseM]);

  const lastM = baseM[baseM.length - 1] ?? 50;
  const lastE = baseE[baseE.length - 1] ?? lastM;

  const [phase, setPhase] = useState<"idle" | "running" | "done">(
    scored ? "done" : "idle",
  );
  const [logs, setLogs] = useState<LogLine[]>(() =>
    scored ? honestLogs(agents, sources) : [],
  );

  useEffect(() => {
    if (!scored) return;
    setPhase("done");
    setLogs(honestLogs(agents, sources));
  }, [
    scored,
    slug,
    agents.market,
    agents.evidence,
    agents.correlator,
    agents.investigator,
    sources,
  ]);

  async function runAgents() {
    if (phase === "running") return;
    setPhase("running");
    setLogs([
      { id: Date.now(), text: "Calling Market Pulse + Evidence Scout…", kind: "sys" },
    ]);
    try {
      await onRescout?.();
    } catch {
      /* parent keeps prior row */
    }
    setLogs(honestLogs(agents, sources));
    setPhase("done");
  }

  const gap = Math.round((lastE - lastM) * 10) / 10;
  const gapLabel = `${gap >= 0 ? "+" : ""}${gap}`;
  const lead = outcomes[0] ?? { label: "Leader", odds: `${Math.round(lastM)}%`, price: lastM / 100 };

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
              Fetching live book
            </div>
          ) : null}
          <GapChart
            market={baseM}
            evidence={baseE}
            labels={labels}
            legend={false}
          />
          <div className="yn-dock">
            <div className="yn-cta">
              <span className="yn-gap">{gapLabel}</span>
              <span className="yn-vs">vs market</span>
              <span className="yn-act">
                {lead.label} · {lead.odds} · paper only
              </span>
            </div>
          </div>
        </section>

        {phase !== "done" ? (
          <button
            type="button"
            className="btn run-agents"
            disabled={phase === "running"}
            onClick={() => void runAgents()}
          >
            {phase === "running" ? "Fetching…" : "Run agents"}
          </button>
        ) : null}

        <PaperTicket
          outcomes={outcomes}
          suggestedSide="WATCH"
        />
      </div>

      <aside className="agent-side" aria-label="Agent activity">
        <p className="eyebrow">What ran</p>
        {phase === "idle" ? (
          <p className="agent-idle">
            Run agents to pull Polymarket CLOB and Grok. No scripted Tudum copy.
          </p>
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
            {sources.length > 0 ? (
              sources.slice(0, 4).map((s) => (
                <q key={`${s[0]}-${s[2]}`}>
                  {s[0]}: {s[2]}
                </q>
              ))
            ) : (
              <>
                <q>Polymarket: {agents.market} · last trade {Math.round(lastM)}%.</q>
                <q>Evidence: {agents.evidence} · correlator {agents.correlator}.</q>
              </>
            )}
            <q>
              {slug} · gap {gapLabel} · paper only
            </q>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
