"use client";

import { useMemo, useState } from "react";
import { GapChart } from "@/components/GapChart";

export type ReplayStop = {
  when: string;
  label: string;
  /** Length of series to show at this stop. */
  at: number;
  score: number;
  confidence: number;
  side: string;
  tone: "flag" | "calm" | "mute";
  explain?: string;
};

type Props = {
  title: string;
  venue: string;
  volumeLabel: string;
  ranks: Array<[string, number]>;
  marketSeries: number[];
  evidenceSeries: number[];
  labels?: Array<[number, string]>;
  flagAt: number | null;
  stops: ReplayStop[];
  locked: boolean;
  /** Live correlator snapshot (used when locked or as default at flag stop). */
  liveScore: number;
  liveConfidence: number;
  liveSide: string;
  liveTone: "flag" | "calm" | "mute";
  initialStop?: number;
};

export default function InvestigationBoard({
  title,
  venue,
  volumeLabel,
  ranks,
  marketSeries,
  evidenceSeries,
  labels,
  flagAt,
  stops,
  locked,
  liveScore,
  liveConfidence,
  liveSide,
  liveTone,
  initialStop = 2,
}: Props) {
  const start = locked
    ? 0
    : Math.min(Math.max(0, initialStop), Math.max(0, stops.length - 1));
  const [stopIdx, setStopIdx] = useState(start);

  const upto = useMemo(() => {
    if (locked || stops.length === 0) return marketSeries.length;
    const at = stops[stopIdx]?.at ?? marketSeries.length;
    return Math.max(2, Math.min(marketSeries.length, at));
  }, [locked, stops, stopIdx, marketSeries.length]);

  const m = marketSeries.slice(0, upto);
  const e = evidenceSeries.slice(0, upto);
  const localFlag = flagAt != null && flagAt < upto ? flagAt : null;

  const active =
    !locked && stops[stopIdx]
      ? stops[stopIdx]
      : {
          score: liveScore,
          confidence: liveConfidence,
          side: liveSide,
          tone: liveTone,
          explain: undefined as string | undefined,
        };

  const oddsNow = m[m.length - 1] ?? (ranks[0]?.[1] ?? 0) * 100;
  const evNow = e[e.length - 1] ?? 0;

  return (
    <>
      <section className="card hero" style={{ marginTop: 0 }}>
        <div className="hero-head">
          <div className="hero-title">
            <p className="eyebrow">{venue}</p>
            <p className="market-q">{title}</p>
            <div className="meta">
              <span>
                Volume <b>{volumeLabel}</b>
              </span>
              <span>
                Market <b>{Math.round(oddsNow * 10) / 10}%</b>
              </span>
              <span>
                Evidence <b>{Math.round(evNow)}</b>
              </span>
            </div>
            <div className="ranks">
              {ranks.map(([show, p], i) => (
                <div key={show} className={`rank${i === 0 ? " lead" : ""}`}>
                  <span className="n">{i + 1}</span>
                  <span className="show">{show}</span>
                  <span className="p">{Math.round(p * 1000) / 10}%</span>
                </div>
              ))}
            </div>
          </div>
          <div className="score-block">
            <span className="score">{active.score}</span>
            <div className="score-sub">Divergence</div>
            <div className="score-conf">Confidence {active.confidence}</div>
            <div className={`pill ${active.tone}`}>
              <i className="dot" />
              <span>
                {active.side} · {active.score}
              </span>
            </div>
          </div>
        </div>
        <GapChart
          market={m}
          evidence={e}
          flagAt={localFlag}
          labels={(labels ?? []).filter(([i]) => i < upto)}
        />
      </section>

      <section className="card replay" id="replay">
        <div className="replay-head">
          <h2>Replay last week</h2>
          <p className="lede">
            What Drift would have shown you, before the answer was obvious.
          </p>
        </div>
        {locked || stops.length === 0 ? (
          <div className="locked">
            <i className="dot" style={{ background: "var(--muted)" }} />
            Replay unlocks once this market resolves. Drift needs a known
            outcome to replay against.
          </div>
        ) : (
          <>
            <div className="stops" role="tablist" aria-label="Replay timeline">
              {stops.map((s, i) => (
                <button
                  key={`${s.when}-${s.label}`}
                  type="button"
                  className="stop"
                  role="tab"
                  aria-current={i === stopIdx ? "true" : undefined}
                  onClick={() => setStopIdx(i)}
                >
                  <span className="stop-pin" />
                  <span className="stop-txt">
                    <span className="stop-day">{s.when}</span>
                    <br />
                    {s.label}
                  </span>
                </button>
              ))}
            </div>
            {active.explain ? (
              <p className="lede" style={{ marginTop: 16 }} aria-live="polite">
                {active.explain}
              </p>
            ) : null}
          </>
        )}
      </section>
    </>
  );
}
