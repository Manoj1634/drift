"use client";

import { useState } from "react";
import Link from "next/link";
import type { AgentRun, Market } from "@/lib/markets";
import { Shell } from "../../shell";

function Sparkline({
  data,
  color,
  height = 72,
}: {
  data: number[];
  color: string;
  height?: number;
}) {
  const w = 320;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const span = max - min || 1;
  const d = data
    .map((y, i) => {
      const x = (i * w) / (data.length - 1);
      const py = height - 4 - ((y - min) / span) * (height - 8);
      return `${i === 0 ? "M" : "L"}${x},${py}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="h-full w-full">
      <path d={d} fill="none" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function VolumeBars({ data }: { data: number[] }) {
  const max = Math.max(...data);
  return (
    <div className="flex h-12 items-end gap-0.5">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-blue/50"
          style={{ height: `${Math.max(12, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export function MarketView({ market }: { market: Market }) {
  const [runs, setRuns] = useState(market.runs);
  const [running, setRunning] = useState(false);
  const [taken, setTaken] = useState(false);

  async function runAgain() {
    if (running) return;
    setRunning(true);
    await new Promise((r) => setTimeout(r, 1100));
    const next: AgentRun = {
      id: `live-${Date.now()}`,
      at: "Just now",
      insight: market.call
        ? "Live run: gap still open. Same call stands."
        : "Live run: still aligned. No new call.",
      edge: market.call ? "yes" : "none",
    };
    setRuns((r) => [next, ...r]);
    setRunning(false);
  }

  return (
    <Shell>
      <Link href="/" className="text-xs text-muted hover:text-text">
        ← All markets
      </Link>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <p className="text-xs uppercase tracking-wide text-muted">
            Polymarket · {market.category}
          </p>
          <h1 className="mt-1 text-[22px] font-semibold leading-snug">
            {market.question}
          </h1>

          <div className="mt-4 rounded-xl border border-line bg-elevated p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted">Odds · {market.favorite}</span>
              <span className="text-lg font-semibold">{market.favoriteOdds}%</span>
            </div>
            <div className="mt-2 h-[88px]">
              <Sparkline data={market.oddsSeries} color="#2E6CFF" height={88} />
            </div>
            <div className="mt-4 flex gap-6 text-sm">
              <div>
                <div className="text-muted">Favorite</div>
                <div>
                  {market.favorite} · {market.favoriteOdds}%
                </div>
              </div>
              <div>
                <div className="text-muted">Other</div>
                <div>
                  {market.longshot} · {market.longshotOdds}%
                </div>
              </div>
            </div>
          </div>

          <div className="mt-3 w-48 rounded-xl border border-line bg-elevated p-3">
            <div className="text-[11px] uppercase tracking-wide text-muted">
              Volume
            </div>
            <div className="mt-1 text-sm font-medium">{market.volume}</div>
            <div className="mt-2">
              <VolumeBars data={market.volumeSeries} />
            </div>
          </div>
        </section>

        <aside>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">Agent runs</h2>
            <button
              onClick={runAgain}
              disabled={running}
              className="text-xs text-blue hover:underline disabled:opacity-50"
            >
              {running ? "Running…" : "Run now"}
            </button>
          </div>
          <ol className="space-y-3">
            {runs.map((run) => (
              <li
                key={run.id}
                className="rounded-xl border border-line bg-elevated p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted">{run.at}</span>
                  <span
                    className={`text-[11px] font-medium uppercase tracking-wide ${
                      run.edge === "yes"
                        ? "text-yes"
                        : run.edge === "fading"
                          ? "text-no"
                          : "text-muted"
                    }`}
                  >
                    {run.edge === "yes"
                      ? "Edge"
                      : run.edge === "fading"
                        ? "Faded"
                        : "No edge"}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6">{run.insight}</p>
              </li>
            ))}
          </ol>
        </aside>
      </div>

      <div className="sticky bottom-4 mt-8">
        {market.call ? (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-yes/30 bg-yes-bg px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-yes">
                Recommendation
              </div>
              <div className="text-sm font-medium">
                {market.call.side} {market.call.contract} @ {market.call.price}
              </div>
              <div className="text-xs text-muted">{market.call.why}</div>
            </div>
            <button
              onClick={() => setTaken(true)}
              className="rounded-lg bg-yes px-4 py-2 text-sm font-semibold text-black"
            >
              {taken ? "Logged (mock)" : "Take call"}
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-line bg-elevated px-4 py-3 text-sm text-muted">
            No call. Last run found no edge.
          </div>
        )}
      </div>
    </Shell>
  );
}
