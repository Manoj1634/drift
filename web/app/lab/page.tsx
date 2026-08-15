"use client";

import { useState } from "react";
import Link from "next/link";
import { MarketChart } from "@/components/MarketChart";
import type { LabResult, LabStep } from "@/lib/lab-types";
import type { Market } from "../../../shared/types/contract";

function Badge({ step }: { step: LabStep }) {
  const tone = !step.ok
    ? "bg-[#3a1515] text-[#ff8b8b]"
    : step.source === "live"
      ? "bg-[#1a3d2c] text-[#3dd68c]"
      : step.source === "skipped"
        ? "bg-[#2a2a2a] text-[#8b8b8b]"
        : "bg-[#2a2410] text-[#e6c35c]";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${tone}`}>
      {step.ok ? step.source : "fail"}
    </span>
  );
}

export default function LabPage() {
  const [mode, setMode] = useState<"live" | "replay">("live");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<LabResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/lab?mode=${mode}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
      setResult((await res.json()) as LabResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  }

  const market = result?.market as Market | null | undefined;

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-[#8b8b8b]">
              Drift · lab
            </p>
            <h1 className="text-xl font-semibold">Agent + Polymarket test</h1>
          </div>
          <Link href="/" className="text-sm text-[#8b8b8b] hover:text-white">
            Feed →
          </Link>
        </div>
        <p className="mt-2 text-sm text-[#8b8b8b]">
          Hits Gamma and CLOB live, then walks Chatter / Culture / Correlator
          (fixture until those tickets land). Failures stay visible.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          {(["live", "replay"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                mode === m ? "bg-[#2e6cff]" : "bg-[#161616] text-[#8b8b8b]"
              }`}
            >
              {m === "live" ? "Live · this week" : "Replay · Aug 6 cutoff"}
            </button>
          ))}
          <button
            onClick={run}
            disabled={running}
            className="ml-auto rounded-lg bg-white px-4 py-1.5 text-sm font-semibold text-black disabled:opacity-50"
          >
            {running ? "Running…" : "Run pipeline"}
          </button>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-[#5a2a2a] bg-[#1a1010] p-3 text-sm text-[#ff8b8b]">
            {error}
          </p>
        ) : null}

        {result ? (
          <p className="mt-4 text-xs text-[#8b8b8b]">
            {result.slug}
            {result.asOf ? ` · asOf ${result.asOf}` : ""} · Grok key{" "}
            {result.grokKeyPresent ? "present" : "missing"}
          </p>
        ) : null}

        <ol className="mt-4 space-y-3">
          {(result?.steps ?? []).map((step) => (
            <li
              key={step.id}
              className="rounded-xl border border-[#2a2a2a] bg-[#111] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium">{step.label}</div>
                  <p className="mt-1 text-sm text-[#cfcfcf]">{step.summary}</p>
                  {step.error ? (
                    <p className="mt-1 font-mono text-xs text-[#ff8b8b]">
                      {step.error}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge step={step} />
                  <span className="text-[11px] text-[#8b8b8b]">{step.ms}ms</span>
                </div>
              </div>
              {step.payload ? (
                <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-black p-2 font-mono text-[11px] text-[#9ad] ">
                  {JSON.stringify(step.payload, null, 2)}
                </pre>
              ) : null}
            </li>
          ))}
        </ol>

        {market && market.history.length > 0 ? (
          <div className="mt-6 rounded-xl border border-[#2a2a2a] bg-[#111] p-4">
            <div className="mb-2 text-sm text-[#8b8b8b]">
              Odds history · {market.source}
            </div>
            <MarketChart
              history={market.history}
              cutoff={result?.asOf}
              revealAfterCutoff={mode === "replay"}
            />
          </div>
        ) : null}
      </div>
    </main>
  );
}
