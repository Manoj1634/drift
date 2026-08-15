import Link from "next/link";
import { notFound } from "next/navigation";
import EvidencePanel from "@/components/EvidencePanel";
import { MarketChart } from "@/components/MarketChart";
import Replay from "@/components/Replay";
import {
  correlate,
  loadCultureFixture,
  loadEvidenceFixture,
  loadRecommendationFixture,
  redactCulture,
  type CorrelateResult,
} from "@/lib/correlator";
import { runInvestigator, type InvestigatorMemo } from "@/lib/investigator";
import {
  LIVE_SLUG,
  REPLAY_CUTOFF,
  REPLAY_SLUG,
  getMarket,
} from "@/lib/market";
import {
  getEvidence,
  REPLAY_SHOW,
  REPLAY_WINDOW_END,
  REPLAY_WINDOW_START,
} from "@/lib/evidence";
import { getReplayTimeline } from "@/lib/truth";
import type { Culture, Evidence, Market } from "../../../../shared/types/contract";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [{ slug: LIVE_SLUG }, { slug: REPLAY_SLUG }];
}

function leading(odds: Record<string, number>) {
  return Object.entries(odds).sort((a, b) => b[1] - a[1])[0];
}

async function loadEvidenceForSlug(slug: string, market: Market): Promise<Evidence> {
  if (slug === REPLAY_SLUG) {
    return getEvidence(REPLAY_SHOW, REPLAY_WINDOW_START, REPLAY_WINDOW_END);
  }
  const lead = leading(market.odds_by_outcome)?.[0] ?? REPLAY_SHOW;
  const end = new Date().toISOString();
  const start = new Date(Date.now() - 3 * 864e5).toISOString();
  return getEvidence(lead, start, end);
}

function Badge({ label }: { label: "live" | "fixture" }) {
  const live = label === "live";
  return (
    <span
      className={`rounded px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide ${
        live
          ? "bg-[var(--calm-bg)] text-[var(--calm)]"
          : "bg-[var(--inset)] text-[var(--evidence)]"
      }`}
    >
      {label}
    </span>
  );
}

function AgentStrip({
  marketLive,
  evidenceLive,
  correlatorLive,
  investigator,
}: {
  marketLive: boolean;
  evidenceLive: boolean;
  correlatorLive: boolean;
  investigator: InvestigatorMemo;
}) {
  const invLive = investigator.source === "cursor_sdk";
  const rows: Array<{ name: string; live: boolean; detail: string }> = [
    {
      name: "Market Pulse",
      live: marketLive,
      detail: marketLive ? "Polymarket" : "fixture",
    },
    {
      name: "Evidence Scout",
      live: evidenceLive,
      detail: evidenceLive ? "Grok search" : "fixture",
    },
    {
      name: "Correlator",
      live: correlatorLive,
      detail: correlatorLive ? "grok-4.6" : "fixture",
    },
    {
      name: "Investigator",
      live: invLive,
      detail:
        investigator.status === "skipped"
          ? "skipped"
          : invLive
            ? "Cursor SDK"
            : "fixture",
    },
  ];
  return (
    <section className="rounded-[var(--r)] border border-[var(--hairline)] bg-[var(--rail)] p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
        What ran
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {rows.map((row) => (
          <li
            key={row.name}
            className="flex items-center justify-between gap-2 rounded-[var(--r-sm)] border border-[var(--hairline)] bg-[var(--card)] px-3 py-2"
          >
            <span className="text-sm">{row.name}</span>
            <span className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-[var(--muted)]">
                {row.detail}
              </span>
              <Badge label={row.live ? "live" : "fixture"} />
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function displayText(value: string, fallback: string) {
  if (!value || value.includes("PLACEHOLDER")) return fallback;
  return value;
}

export default async function InvestigationPage({
  params,
}: PageProps<"/market/[slug]">) {
  const { slug } = await params;
  if (slug !== LIVE_SLUG && slug !== REPLAY_SLUG) notFound();

  const asOf = slug === REPLAY_SLUG ? REPLAY_CUTOFF : undefined;
  const cultureFallback = loadCultureFixture();
  const evidenceFallback = loadEvidenceFixture();
  const recFallback = loadRecommendationFixture();

  const marketR = await Promise.allSettled([getMarket(slug, asOf)]);
  const market: Market | null =
    marketR[0].status === "fulfilled" ? marketR[0].value : null;
  if (!market) notFound();

  const [evidenceR, cultureR] = await Promise.allSettled([
    loadEvidenceForSlug(slug, market),
    Promise.resolve(cultureFallback),
  ]);

  const evidence: Evidence =
    evidenceR.status === "fulfilled" ? evidenceR.value : evidenceFallback;
  const cultureRaw: Culture =
    cultureR.status === "fulfilled" ? cultureR.value : cultureFallback;
  const culture = redactCulture(cultureRaw, asOf);

  let rec: CorrelateResult = recFallback;
  try {
    rec = await correlate(market, evidence, culture, asOf);
  } catch {
    rec = { ...recFallback, market_id: market.id, as_of: asOf ?? market.timestamp };
  }

  let investigator: InvestigatorMemo = {
    as_of: rec.as_of,
    market_id: market.id,
    source: "fixture",
    status: "fixture",
    memo: [],
  };
  try {
    investigator = await runInvestigator({
      market,
      evidence,
      culture,
      recommendation: rec,
    });
  } catch {
    /* keep fixture */
  }

  let replaySteps: Awaited<ReturnType<typeof getReplayTimeline>>["steps"] = [];
  try {
    const timeline = await getReplayTimeline();
    replaySteps = timeline.steps;
  } catch {
    replaySteps = [];
  }

  const lead = leading(market.odds_by_outcome);
  const marketLive = market.source === "polymarket";
  const evidenceLive = evidence.source !== "fixture";
  const correlatorLive = rec.source === "grok";
  const diverged = rec.verdict === "diverged";
  const explanation = displayText(
    rec.explanation,
    "At the Aug 6 cutoff the market priced this title near 48¢ while prior Tudum incumbency was already knowable. Evidence gap — social chatter was weak; incumbency is the tell.",
  );
  const counter = displayText(
    rec.counterargument,
    "Incumbency is not destiny: hours often decay after a debut week, and traders may rationally hold ~48% if they expect a mid-week fade. Suggested side YES flags an evidence gap, not a settled outcome.",
  );
  const reasons = (rec.supporting_reasons ?? []).filter(
    (r) => r && !r.includes("PLACEHOLDER"),
  );
  const sources = (rec.sources ?? []).filter(
    (s) => s && !s.includes("PLACEHOLDER"),
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-sm text-[var(--muted)]">
          ← Signal Feed
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Badge label={marketLive ? "live" : "fixture"} />
          <span className="font-mono text-[10px] uppercase text-[var(--muted)]">
            market
          </span>
          <Badge label={evidenceLive ? "live" : "fixture"} />
          <span className="font-mono text-[10px] uppercase text-[var(--muted)]">
            evidence
          </span>
          <Badge label={correlatorLive ? "live" : "fixture"} />
          <span className="font-mono text-[10px] uppercase text-[var(--muted)]">
            correlator
          </span>
        </div>
      </div>

      <header>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {market.title}
        </h1>
        {lead ? (
          <>
            <p className="mt-4 font-mono text-5xl tabular-nums tracking-tight">
              {(lead[1] * 100).toFixed(1)}%
            </p>
            <p className="mt-2 text-lg text-[var(--ink-2)]">{lead[0]}</p>
          </>
        ) : null}
      </header>

      <AgentStrip
        marketLive={marketLive}
        evidenceLive={evidenceLive}
        correlatorLive={correlatorLive}
        investigator={investigator}
      />

      <section className="rounded-[var(--r)] border border-[var(--hairline)] bg-[var(--card)] p-6">
        <h2 className="text-xl font-semibold">Odds</h2>
        <p className="mt-1 font-mono text-sm text-[var(--muted)]">
          {market.history.length} history points · vol 24h{" "}
          {market.volume_24h.toFixed(0)}
        </p>
        <div className="mt-4">
          <MarketChart
            history={market.history}
            cutoff={asOf}
            revealAfterCutoff={slug !== REPLAY_SLUG}
          />
        </div>
      </section>

      <section className="rounded-[var(--r)] border border-[var(--hairline)] bg-[var(--card)] p-6">
        <h2 className="text-xl font-semibold">Evidence</h2>
        <p className="mt-2 text-[var(--ink-2)]">
          Social{" "}
          <span className="font-mono tabular-nums">{evidence.social_score}</span>
          {" · "}
          Web{" "}
          <span className="font-mono tabular-nums">{evidence.web_score}</span>
          {" · "}
          {evidence.trend}
        </p>
        <div className="mt-4">
          <EvidencePanel evidence={evidence} />
        </div>
      </section>

      <section className="rounded-[var(--r)] border border-[var(--hairline)] bg-[var(--card)] p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
          Why?
        </p>
        <h2
          className="mt-2 text-3xl font-semibold"
          style={{ color: diverged ? "var(--flag)" : "var(--calm)" }}
        >
          {diverged ? "HIGH DIVERGENCE" : "ALIGNED"} {rec.divergence_score}
        </h2>
        <p className="mt-2 font-mono text-sm text-[var(--ink-2)]">
          {rec.suggested_side} · confidence {rec.confidence}
        </p>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed">{explanation}</p>
        {reasons.length > 0 ? (
          <ul className="mt-4 list-disc space-y-2 pl-6 text-[var(--ink-2)]">
            {reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : null}
        <div
          className="mt-8 rounded-[var(--r-sm)] p-5"
          style={{ background: "var(--inset)" }}
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
            Counterargument
          </p>
          <p className="mt-3 text-base leading-relaxed">{counter}</p>
        </div>

        {investigator.memo.length > 0 ? (
          <div
            className="mt-6 rounded-[var(--r-sm)] border border-[var(--hairline)] p-5"
            style={{ background: "var(--rail)" }}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
                Investigator memo
              </p>
              <Badge
                label={
                  investigator.source === "cursor_sdk" ? "live" : "fixture"
                }
              />
            </div>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-[var(--ink-2)]">
              {investigator.memo.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
            Sources
          </p>
          {sources.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--muted)]">No sources returned.</p>
          ) : (
            <ul className="mt-2 list-disc pl-6 text-sm text-[var(--ink-2)]">
              {sources.map((source) => (
                <li key={source}>{source}</li>
              ))}
            </ul>
          )}
        </div>
        <p className="mt-6 font-mono text-xs text-[var(--muted)]">
          as of {rec.as_of} · week of {culture.week_of}
          {culture.official_rank[0] ? ` · ${culture.official_rank[0]}` : ""}
        </p>
      </section>

      <Link
        href="#replay"
        className="inline-flex w-fit rounded-[var(--r-sm)] px-5 py-3 text-lg font-medium text-[var(--ground)]"
        style={{ background: "var(--market)" }}
      >
        Replay Last Week
      </Link>

      <section id="replay" className="pb-16">
        {replaySteps.length > 0 ? (
          <Replay steps={replaySteps} />
        ) : (
          <p className="text-[var(--muted)]">Replay timeline unavailable.</p>
        )}
      </section>
    </main>
  );
}
