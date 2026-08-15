import Link from "next/link";
import {
  LIVE_SLUG,
  REPLAY_CUTOFF,
  REPLAY_SLUG,
  getMarket,
} from "@/lib/market";
import { loadRecommendationFixture } from "@/lib/correlator";

function leading(odds: Record<string, number>) {
  return Object.entries(odds).sort((a, b) => b[1] - a[1])[0];
}

function formatPct(p: number) {
  return `${(p * 100).toFixed(1)}%`;
}

export default async function SignalFeedPage() {
  const [live, replay] = await Promise.all([
    getMarket(LIVE_SLUG),
    getMarket(REPLAY_SLUG, REPLAY_CUTOFF),
  ]);
  const rec = loadRecommendationFixture();
  const liveLead = leading(live.odds_by_outcome);
  const replayLead = leading(replay.odds_by_outcome);
  const divergedCopy = rec.explanation.includes("PLACEHOLDER")
    ? "At the Aug 6 cutoff the market priced Idaho Murders at 48¢ against known Tudum incumbency."
    : rec.explanation.split(".")[0] + ".";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--muted)]">
          Drift
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">Signal Feed</h1>
        <p className="mt-2 max-w-xl text-[var(--ink-2)]">
          Polymarket odds next to public evidence and Netflix Top 10 ground truth.
        </p>
      </header>

      <article className="rounded-[var(--r)] border border-[var(--hairline)] bg-[var(--card)] p-8 shadow-[var(--shadow)]">
        <p
          className="font-mono text-sm tracking-[0.08em] uppercase"
          style={{ color: "var(--calm)" }}
        >
          ALIGNED
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">{live.title}</h2>
        {liveLead ? (
          <>
            <p className="mt-4 font-mono text-5xl tabular-nums tracking-tight">
              {formatPct(liveLead[1])}
            </p>
            <p className="mt-2 text-lg text-[var(--ink-2)]">{liveLead[0]}</p>
          </>
        ) : null}
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--ink-2)]">
          Market prices the likely #1 in line with public evidence.
        </p>
        <p className="mt-4 font-mono text-sm text-[var(--muted)]">
          WATCH · {live.source}
        </p>
        <Link
          href={`/market/${LIVE_SLUG}`}
          className="mt-6 inline-flex rounded-[var(--r-sm)] border border-[var(--hairline)] px-4 py-2 text-sm text-[var(--ink-2)]"
        >
          View details
        </Link>
      </article>

      <article className="rounded-[var(--r)] border border-[var(--hairline)] bg-[var(--card)] p-8 shadow-[var(--shadow)]">
        <p
          className="font-mono text-sm tracking-[0.08em] uppercase"
          style={{ color: "var(--flag)" }}
        >
          HIGH DIVERGENCE {rec.divergence_score}
        </p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">{replay.title}</h2>
        {replayLead ? (
          <>
            <p className="mt-4 font-mono text-5xl tabular-nums tracking-tight">
              {formatPct(replayLead[1])}
            </p>
            <p className="mt-2 text-lg text-[var(--ink-2)]">{replayLead[0]}</p>
          </>
        ) : null}
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--ink-2)]">
          {divergedCopy}
        </p>
        <p className="mt-4 font-mono text-sm text-[var(--muted)]">
          {rec.suggested_side} · cutoff {REPLAY_CUTOFF}
        </p>
        <Link
          href={`/market/${REPLAY_SLUG}`}
          className="mt-8 inline-flex rounded-[var(--r-sm)] px-5 py-3 text-lg font-medium text-[var(--ground)]"
          style={{ background: "var(--market)" }}
        >
          View Why
        </Link>
      </article>
    </main>
  );
}
