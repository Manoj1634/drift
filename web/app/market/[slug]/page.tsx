import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import InvestigationBoard, {
  type ReplayStop,
} from "@/components/InvestigationBoard";
import PaperTicket from "@/components/PaperTicket";
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
import type { Culture, Evidence, Market, PricePoint } from "../../../../shared/types/contract";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return [{ slug: LIVE_SLUG }, { slug: REPLAY_SLUG }];
}

function leading(odds: Record<string, number>) {
  return Object.entries(odds).sort((a, b) => b[1] - a[1])[0];
}

function pctLabel(p: number) {
  const v = Math.round(p * 1000) / 10;
  return `${v % 1 ? v.toFixed(1) : v}%`;
}

function shortShow(name: string) {
  return name
    .replace(/: Season \d+$/i, "")
    .replace(/: Limited Series$/i, "")
    .replace(/: College Nightmare$/i, "");
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

function displayText(value: string, fallback: string) {
  if (!value || value.includes("PLACEHOLDER")) return fallback;
  return value;
}

function downsample(history: PricePoint[], max = 16): PricePoint[] {
  if (history.length <= max) return history;
  const out: PricePoint[] = [];
  const step = (history.length - 1) / (max - 1);
  for (let i = 0; i < max; i++) {
    out.push(history[Math.round(i * step)]!);
  }
  return out;
}

function indexAtOrBefore(history: PricePoint[], iso: string): number {
  const t = Date.parse(iso);
  let idx = 0;
  for (let i = 0; i < history.length; i++) {
    if (Date.parse(history[i]!.t) <= t) idx = i;
  }
  return idx;
}

function buildSeries(history: PricePoint[], social: number) {
  const pts = downsample(history);
  const market = pts.map((p) => p.p * 100);
  // Honest flat evidence line ending at fixture/live social score.
  const evidence = pts.map(() => social);
  const labels: Array<[number, string]> = [];
  if (pts.length >= 2) {
    labels.push([0, fmtDay(pts[0]!.t)]);
    labels.push([pts.length - 1, fmtDay(pts[pts.length - 1]!.t)]);
    const mid = Math.floor(pts.length / 2);
    labels.push([mid, fmtDay(pts[mid]!.t)]);
  }
  return { market, evidence, labels, pts };
}

function fmtDay(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    timeZone: "UTC",
  });
}

function buildReplayStops(
  history: PricePoint[],
  social: number,
  rec: CorrelateResult,
): { stops: ReplayStop[]; flagAt: number; initialStop: number } {
  const pts = downsample(history);
  const n = pts.length;
  const i2am = indexAtOrBefore(pts, "2026-08-06T02:00:00Z");
  const i10 = indexAtOrBefore(pts, "2026-08-06T10:00:00Z");
  const iNoon = indexAtOrBefore(pts, REPLAY_CUTOFF);
  const i4pm = indexAtOrBefore(pts, "2026-08-06T16:00:00Z");

  const mAt = (i: number) => (pts[i]?.p ?? 0.48) * 100;
  const gap = (i: number) => Math.round(Math.abs(social - mAt(i)));

  const stops: ReplayStop[] = [
    {
      when: "Aug 6 2am",
      label: "Market still unsure",
      at: Math.max(2, i2am + 1),
      score: Math.min(30, gap(i2am)),
      confidence: 40,
      side: "WATCH",
      tone: "calm",
      explain: `Idaho Murders is near ${Math.round(mAt(i2am))}%. Public evidence score is nearby. Nothing needs a decision yet.`,
    },
    {
      when: "Aug 6 10am",
      label: "Evidence pulls ahead",
      at: Math.max(3, i10 + 1),
      score: Math.max(35, gap(i10) - 5),
      confidence: 55,
      side: "WATCH",
      tone: "mute",
      explain: `Evidence sits at ${social} while the market is still near ${Math.round(mAt(i10))}%. The gap is widening in one direction.`,
    },
    {
      when: "Aug 6 noon",
      label: "Drift flags it",
      at: Math.max(4, iNoon + 1),
      score: rec.divergence_score,
      confidence: rec.confidence,
      side: rec.suggested_side,
      tone: rec.verdict === "diverged" ? "flag" : "calm",
      explain: displayText(
        rec.explanation,
        `At the Aug 6 noon cutoff the market priced Idaho Murders near ${Math.round(mAt(iNoon))}% against social ${social} (flat). Tudum incumbency is the tell.`,
      ),
    },
    {
      when: "Aug 6 4pm",
      label: "Market reprices",
      at: Math.max(5, i4pm + 1),
      score: Math.min(30, gap(i4pm)),
      confidence: 68,
      side: "WATCH",
      tone: "mute",
      explain: `The CLOB has moved toward evidence — market near ${Math.round(mAt(i4pm))}%. The noon gap is closing from the price side.`,
    },
    {
      when: "Aug 11",
      label: "Outcome revealed",
      at: n,
      score: 9,
      confidence: 82,
      side: "YES",
      tone: "calm",
      explain:
        "Idaho Murders resolved as official #1. The divergence Drift flagged at noon no longer exists — the price got there first, Tudum confirmed later.",
    },
  ];

  return { stops, flagAt: iNoon, initialStop: 2 };
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

  // For chart + replay scrubber, prefer full history (post-cutoff) on resolved week.
  const chartMarket =
    slug === REPLAY_SLUG
      ? await getMarket(slug).catch(() => market)
      : market;

  const [evidenceR] = await Promise.allSettled([
    loadEvidenceForSlug(slug, market),
  ]);

  const evidence: Evidence =
    evidenceR.status === "fulfilled" ? evidenceR.value : evidenceFallback;
  const culture: Culture = redactCulture(cultureFallback, asOf);

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

  // Keep timeline wired (feeds honest step data / future expansion).
  try {
    await getReplayTimeline();
  } catch {
    /* optional */
  }

  const ranks = Object.entries(market.odds_by_outcome).sort(
    (a, b) => b[1] - a[1],
  );
  const lead = ranks[0];
  const marketLive = market.source === "polymarket";
  const evidenceLive = evidence.source !== "fixture";
  const correlatorLive = rec.source === "grok";
  const invLive = investigator.source === "cursor_sdk";
  const diverged = rec.verdict === "diverged";
  const tone: "flag" | "calm" | "mute" = diverged
    ? "flag"
    : rec.suggested_side === "WATCH"
      ? "mute"
      : "calm";

  const explanation = displayText(
    rec.explanation,
    "At the Aug 6 cutoff the market priced this title near 48¢ while prior Tudum incumbency was already knowable. Social chatter was weak; incumbency is the tell.",
  );
  const counter = displayText(
    rec.counterargument,
    "Incumbency is not destiny: hours often decay after a debut week, and traders may rationally hold ~48% if they expect a mid-week fade.",
  );
  const reasons = (rec.supporting_reasons ?? []).filter(
    (r) => r && !r.includes("PLACEHOLDER"),
  );
  const sources = (rec.sources ?? []).filter(
    (s) => s && !s.includes("PLACEHOLDER"),
  );

  const { market: mSeries, evidence: eSeries, labels } = buildSeries(
    chartMarket.history.length ? chartMarket.history : market.history,
    evidence.social_score,
  );

  const isReplay = slug === REPLAY_SLUG;
  const replayBuilt = isReplay
    ? buildReplayStops(
        chartMarket.history.length ? chartMarket.history : market.history,
        evidence.social_score,
        rec,
      )
    : { stops: [] as ReplayStop[], flagAt: null as number | null, initialStop: 0 };

  const venue = isReplay
    ? "Polymarket · resolved Aug 11"
    : "Polymarket · resolves Aug 18";
  const vol = `$${Math.round(market.volume_24h || (isReplay ? 18470 : 0)).toLocaleString("en-US")}`;

  const outcomes = ranks.slice(0, 2).map(([name, p]) => ({
    label: shortShow(name),
    odds: pctLabel(p),
  }));
  if (outcomes.length === 1) {
    outcomes.push({
      label: "Rest of field",
      odds: pctLabel(1 - (ranks[0]?.[1] ?? 0)),
    });
  }

  const snippets = (evidence.snippets ?? [])
    .map((s) => (typeof s === "string" ? s : s.text))
    .filter((t) => t && !t.includes("PLACEHOLDER"))
    .slice(0, 3);

  return (
    <AppShell flaggedCount={1} current="feed">
      <div className="view">
        <Link href="/" className="back">
          ← All signals
        </Link>

        <InvestigationBoard
          title={market.title}
          venue={venue}
          volumeLabel={vol}
          ranks={ranks}
          marketSeries={mSeries}
          evidenceSeries={eSeries}
          labels={labels}
          flagAt={replayBuilt.flagAt}
          stops={replayBuilt.stops}
          locked={!isReplay}
          liveScore={rec.divergence_score}
          liveConfidence={rec.confidence}
          liveSide={rec.suggested_side}
          liveTone={tone}
          initialStop={replayBuilt.initialStop}
        />

        <section className="card trail">
          <h2>What ran</h2>
          <div className="steps">
            <div className="step">
              <div className="step-n">
                <i className="dot" style={{ background: "var(--market)" }} />
                Market Pulse
              </div>
              <div className="step-v">
                {lead ? pctLabel(lead[1]) : "—"}
              </div>
              <div className="step-s">
                {marketLive ? "Polymarket CLOB" : "fixture"} · {market.source}
              </div>
            </div>
            <div className="step">
              <div className="step-n">
                <i className="dot" style={{ background: "var(--evidence)" }} />
                Evidence Scout
              </div>
              <div className="step-v">{evidence.social_score}</div>
              <div className="step-s">
                {evidenceLive ? "Grok search" : "fixture"} · social{" "}
                {evidence.social_score} / web {evidence.web_score} ·{" "}
                {evidence.trend}
              </div>
            </div>
            <div className="step">
              <div className="step-n">
                <i className="dot" style={{ background: "var(--evidence)" }} />
                Trends
              </div>
              <div className="step-v">
                {evidence.web_score > 0
                  ? `+${evidence.web_score}`
                  : evidence.trend}
              </div>
              <div className="step-s">web / tudum · week of {culture.week_of}</div>
            </div>
            <div className="step">
              <div className="step-n">
                <i
                  className="dot"
                  style={{
                    background: diverged ? "var(--flag)" : "var(--calm)",
                  }}
                />
                Correlator
              </div>
              <div className="step-v">
                {rec.divergence_score} / 100
              </div>
              <div className="step-s">
                {correlatorLive ? "grok-4.6 structured" : "fixture"} ·{" "}
                {rec.verdict}
              </div>
            </div>
            <div className="step">
              <div className="step-n">
                <i className="dot" style={{ background: "var(--muted)" }} />
                Investigator
              </div>
              <div className="step-v">
                {investigator.status === "skipped"
                  ? "skipped"
                  : invLive
                    ? "live"
                    : "fixture"}
              </div>
              <div className="step-s">
                {invLive ? "Cursor SDK" : "fixture memo"}
              </div>
            </div>
          </div>
        </section>

        <section className="card why">
          <p className="eyebrow">Grok&apos;s read</p>
          <h2>Why?</h2>
          <p className="explain">{explanation}</p>
          {reasons.length > 0 ? (
            <div className="bull">
              <p className="eyebrow">The case for this signal</p>
              <ul>
                {reasons.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="counter">
            <p className="eyebrow">The case against this signal</p>
            <p>{counter}</p>
          </div>
          <div className="sources">
            {sources.length > 0
              ? sources.map((s) => (
                  <div key={s} className="src">
                    <div className="src-top">
                      <i
                        className="dot"
                        style={{ background: "var(--evidence)" }}
                      />
                      Source
                    </div>
                    <q>{s}</q>
                  </div>
                ))
              : snippets.map((t) => (
                  <div key={t} className="src">
                    <div className="src-top">
                      <i
                        className="dot"
                        style={{ background: "var(--evidence)" }}
                      />
                      Evidence Scout
                    </div>
                    <q>{t}</q>
                  </div>
                ))}
            {investigator.memo.slice(0, 2).map((line) => (
              <div key={line} className="src">
                <div className="src-top">
                  <i className="dot" style={{ background: "var(--market)" }} />
                  Investigator
                </div>
                <q>{line}</q>
              </div>
            ))}
          </div>
        </section>

        <PaperTicket outcomes={outcomes} />

        <p className="foot">
          Drift surfaces a divergence between public data sources. Not financial
          advice, no real trades placed, no claim of market manipulation. as of{" "}
          {rec.as_of}
        </p>
      </div>
    </AppShell>
  );
}
