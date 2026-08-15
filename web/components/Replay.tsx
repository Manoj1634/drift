"use client";

import { useMemo, useState } from "react";
import { MarketChart } from "@/components/MarketChart";
import type { EvidenceSnippet } from "../../shared/types/contract";
import type { ReplayStep } from "@/lib/replay-types";

function pctLabel(p: number) {
  const rounded = Math.round(p * 100);
  if (p >= 0.99 && p < 1 && rounded === 100) return 99;
  return rounded;
}

function cents(p: number) {
  return `${Math.round(p * 100)}¢`;
}

function viewsLabel(n: number) {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
  }
  return n.toLocaleString("en-US") + " views";
}

function shortTitle(title: string) {
  return title.replace(/: Season \d+$/i, "").replace(/: Limited Series$/i, "");
}

function realSnippets(
  snippets: Array<string | EvidenceSnippet> | undefined,
): string[] {
  return (snippets ?? [])
    .map((s) => (typeof s === "string" ? s : s.text))
    .filter((s) => s && !s.includes("PLACEHOLDER"));
}

function realText(value: string | undefined, fallback: string) {
  if (!value || value.includes("PLACEHOLDER")) return fallback;
  return value;
}

const STEP_LABELS = ["Cutoff", "Evidence", "Flag", "Reprice", "Reveal"] as const;

type Props = { steps: ReplayStep[] };

export default function Replay({ steps }: Props) {
  const [index, setIndex] = useState(0);
  const step = steps[index];
  const last = index === steps.length - 1;

  const progress = useMemo(() => `${index + 1} / ${steps.length}`, [index, steps.length]);

  if (!step) {
    return <p className="text-[var(--muted)]">Replay timeline is empty.</p>;
  }

  return (
    <section className="replay-desk mx-auto flex w-full max-w-5xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--accent)]">
            Historical replay
          </p>
          <h1 className="font-display mt-1 text-3xl leading-tight text-[var(--ink)] sm:text-4xl">
            {step.title}
          </h1>
        </div>
        <p className="font-mono text-sm text-[var(--muted)]" aria-live="polite">
          Step {progress}
        </p>
      </header>

      <ol className="flex gap-2" aria-label="Replay steps">
        {steps.map((s, i) => (
          <li key={s.id} className="flex-1">
            <button
              type="button"
              onClick={() => setIndex(i)}
              className={`h-1.5 w-full rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                i <= index ? "bg-[var(--accent)]" : "bg-[var(--line)]"
              }`}
              aria-label={`Go to ${STEP_LABELS[i] ?? s.id}`}
              aria-current={i === index ? "step" : undefined}
            />
          </li>
        ))}
      </ol>

      <div aria-live="polite">{renderStep(step)}</div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="rounded-md border border-[var(--line)] px-4 py-2 font-mono text-sm text-[var(--ink)] disabled:opacity-30"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}
          disabled={last}
          className="rounded-md bg-[var(--accent)] px-5 py-2 font-mono text-sm font-semibold text-[#1a1404] disabled:opacity-30"
        >
          {last ? "End of replay" : "Next"}
        </button>
      </div>
    </section>
  );
}

function renderStep(step: ReplayStep) {
  switch (step.id) {
    case "cutoff":
      return (
        <article className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
            Market card frozen at cutoff
          </p>
          <p className="font-display mt-2 text-2xl text-[var(--ink)]">{step.marketTitle}</p>
          <p className="mt-3 font-mono text-5xl font-semibold text-[var(--accent)]">
            {pctLabel(step.price)}%
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            The Idaho Murders priced at {cents(step.price)} — {step.title}
          </p>
          <div className="mt-6">
            <MarketChart
              history={step.history}
              cutoff={step.cutoff}
              revealAfterCutoff={step.revealAfterCutoff}
            />
          </div>
        </article>
      );
    case "evidence": {
      const snippets = realSnippets(step.evidence.snippets);
      return (
        <article className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
            Pre-cutoff public evidence
          </p>
          <div className="mt-4 flex flex-wrap gap-6 font-mono">
            {typeof step.evidence.social_score === "number" ? (
              <Stat label="Social" value={String(step.evidence.social_score)} />
            ) : null}
            {typeof step.evidence.web_score === "number" ? (
              <Stat label="Web" value={String(step.evidence.web_score)} />
            ) : null}
            <Stat label="Trend" value={step.evidence.trend} />
          </div>
          {snippets.length > 0 ? (
            <ul className="mt-6 space-y-3">
              {snippets.map((s) => (
                <li
                  key={s}
                  className="border-l-2 border-[var(--accent)] pl-3 text-[var(--ink-soft)]"
                >
                  {s}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-[var(--muted)]">
              Scores shown without snippets — live Grok quotes were not available.
            </p>
          )}
        </article>
      );
    }
    case "flag": {
      const rec = step.recommendation;
      const explanation = realText(
        rec.explanation,
        "At the Thursday cutoff the market still priced this title near 48¢ while public evidence was already rising. Divergence signal — suggested side YES. Live Grok copy replaces this fixture when the correlator merges.",
      );
      const counter = realText(
        rec.counterargument,
        "The gap could be noise: a mid-week true-crime spike often fades before the official Top 10 week closes, and the market may have been waiting for the Tudum print rather than missing the story.",
      );
      return (
        <article className="rounded-xl border border-[var(--flag)] bg-[var(--flag-bg)] p-6 sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--flag)]">
            Divergence flag
          </p>
          <p className="font-display mt-3 text-4xl text-[var(--ink)] sm:text-5xl">
            {rec.verdict}
          </p>
          <p className="mt-2 font-mono text-lg text-[var(--flag)]">
            Score {rec.divergence_score}
            {rec.suggested_side ? ` · suggested ${rec.suggested_side}` : ""}
          </p>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
                Why the evidence gap
              </h2>
              <p className="mt-2 text-lg leading-relaxed text-[var(--ink)]">{explanation}</p>
            </div>
            <div>
              <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
                Counterargument
              </h2>
              <p className="mt-2 text-lg leading-relaxed text-[var(--ink-soft)]">{counter}</p>
            </div>
          </div>
        </article>
      );
    }
    case "repricing":
      return (
        <article className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
            Post-cutoff repricing
          </p>
          <p className="font-display mt-2 text-2xl text-[var(--ink)]">
            Real CLOB path to {pctLabel(step.endPrice)}%
          </p>
          <div className="mt-6">
            <MarketChart
              history={step.history}
              cutoff={step.cutoff}
              revealAfterCutoff={step.revealAfterCutoff}
            />
          </div>
        </article>
      );
    case "reveal":
      return (
        <article className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--accent)] bg-[var(--panel)] p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-[var(--accent)]">
              Official Netflix Top 10
            </p>
            <p className="font-display mt-3 text-3xl text-[var(--ink)]">
              {shortTitle(step.winner)} — #1
            </p>
            <ol className="mt-4 space-y-1 font-mono text-sm text-[var(--ink-soft)]">
              {step.officialRank.map((title, i) => (
                <li key={title}>
                  {i + 1}. {shortTitle(title)}
                </li>
              ))}
            </ol>
            <p className="mt-4 font-mono text-[var(--ink)]">
              {viewsLabel(step.views)}
              {typeof step.previousViews === "number"
                ? ` vs ${viewsLabel(step.previousViews)} prior`
                : ""}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-6">
            <p className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
              Water Cooler on Thursday
            </p>
            <p className="font-display mt-3 text-3xl text-[var(--ink)]">
              suggested {step.suggestedSide} @ {cents(step.cutoffPrice)}
            </p>
            <p className="mt-4 text-[var(--ink-soft)]">
              The official print confirmed the title (#1 again). This replay shows the flag
              relative to the later repricing — a divergence signal, not a trade
              recommendation.
            </p>
          </div>
        </article>
      );
  }
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-widest text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-2xl text-[var(--ink)]">{value}</p>
    </div>
  );
}
