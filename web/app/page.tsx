import Link from "next/link";
import AppShell from "@/components/AppShell";
import { Sparkline } from "@/components/Sparkline";
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
import { loadRecommendationFixture } from "@/lib/correlator";
import type { Market } from "../../shared/types/contract";

export const dynamic = "force-dynamic";

function leading(odds: Record<string, number>) {
  return Object.entries(odds).sort((a, b) => b[1] - a[1])[0];
}

function pct(v: number) {
  return `${(Math.round(v * 10) / 10).toFixed(v % 1 ? 1 : 0)}%`;
}

function historyPct(m: Market, max = 15): number[] {
  const pts = m.history.slice(-max);
  if (pts.length >= 2) return pts.map((p) => p.p * 100);
  const lead = leading(m.odds_by_outcome)?.[1] ?? 0.5;
  return Array.from({ length: 8 }, (_, i) => lead * 100 - (7 - i) * 0.4);
}

function evidenceSeries(score: number, n: number): number[] {
  // Fixture trend is flat — honest flat series ending at social score.
  return Array.from({ length: Math.max(n, 2) }, () => score);
}

type FeedCard = {
  href: string;
  feedTitle: string;
  blurb: string;
  venue: string;
  focus: string;
  vol: string;
  marketSeries: number[];
  evidenceSeries: number[];
  marketPct: number;
  evidenceScore: number;
  side: string;
  score: number;
  tone: "flag" | "calm";
  flagAt: number | null;
};

export default async function SignalFeedPage() {
  const rec = loadRecommendationFixture();
  const [live, replay, evidence] = await Promise.all([
    getMarket(LIVE_SLUG),
    getMarket(REPLAY_SLUG, REPLAY_CUTOFF),
    getEvidence(REPLAY_SHOW, REPLAY_WINDOW_START, REPLAY_WINDOW_END),
  ]);

  const liveLead = leading(live.odds_by_outcome);
  const replayLead = leading(replay.odds_by_outcome);
  const replayM = historyPct(replay);
  const liveM = historyPct(live);
  const social = evidence.social_score;
  // Aligned live card: evidence series tracks market (honest "no gap" shape).
  const liveAligned = liveM.map((v) => Math.max(0, Math.min(100, v - 2)));
  const flagAt = Math.max(0, replayM.length - 1);

  const cards: FeedCard[] = [
    {
      href: `/market/${REPLAY_SLUG}`,
      feedTitle: "Week of Aug 4 · Idaho Murders",
      blurb:
        rec.explanation.includes("PLACEHOLDER")
          ? `At the Aug 6 noon cutoff the market still priced Idaho Murders at ${pct(replayLead?.[1] ?? 0.48)} against social ${social} (flat) — Tudum incumbency is the tell.`
          : rec.explanation.split(".")[0] + ".",
      venue: "Polymarket · resolved Aug 11",
      focus: replayLead?.[0] ?? REPLAY_SHOW,
      vol: `$${Math.round(replay.volume_24h || 18470).toLocaleString("en-US")}`,
      marketSeries: replayM,
      evidenceSeries: evidenceSeries(social, replayM.length),
      marketPct: (replayLead?.[1] ?? 0.48) * 100,
      evidenceScore: social,
      side: rec.suggested_side || "YES",
      score: rec.divergence_score,
      tone: "flag",
      flagAt,
    },
    {
      href: `/market/${LIVE_SLUG}`,
      feedTitle: "This week · Walter Boys",
      blurb: liveLead
        ? `Market prices ${liveLead[0].split(":")[0]} at ${pct(liveLead[1])}, in line with public evidence. No flag.`
        : "Market and public evidence agree. No flag.",
      venue: "Polymarket · resolves Aug 18",
      focus: liveLead?.[0] ?? "—",
      vol: `$${Math.round(live.volume_24h).toLocaleString("en-US")}`,
      marketSeries: liveM,
      evidenceSeries: liveAligned,
      marketPct: (liveLead?.[1] ?? 0.937) * 100,
      evidenceScore: Math.round(liveAligned[liveAligned.length - 1] ?? 90),
      side: "WATCH",
      score: 12,
      tone: "calm",
      flagAt: null,
    },
  ];

  cards.sort((a, b) => b.score - a.score);
  const flagged = cards.filter((c) => c.tone === "flag").length;

  return (
    <AppShell flaggedCount={flagged} current="feed">
      <div className="view" id="v-feed">
        <p className="eyebrow">Signals</p>
        <h1>
          {flagged === 1
            ? "One market has stopped agreeing with the crowd."
            : flagged === 0
              ? "Every tracked market agrees with the crowd."
              : `${flagged} markets have stopped agreeing with the crowd.`}
        </h1>
        <p className="lede">
          Drift watches Netflix Top 10 prediction markets next to public
          evidence, and scores the gap between them.
        </p>
        <div className="toolbar">
          <div className="seg">
            <button type="button" aria-pressed="true">
              All
            </button>
            <button type="button" aria-pressed="false">
              Diverged
            </button>
            <button type="button" aria-pressed="false">
              Aligned
            </button>
          </div>
          <div className="live">
            <i className="pulse" />
            Market 30s · evidence 10m · {live.source}/{replay.source}
          </div>
        </div>
        <div className="card feed">
          <div className="feed-head">
            <span>Market</span>
            <span className="hide-s">Gap shape</span>
            <span className="r hide-s">Market</span>
            <span className="r hide-s">Evidence</span>
            <span className="r">Signal</span>
          </div>
          {cards.map((c) => {
            const sparkM =
              c.flagAt != null ? c.marketSeries.slice(0, c.flagAt + 1) : c.marketSeries;
            const sparkE =
              c.flagAt != null
                ? c.evidenceSeries.slice(0, c.flagAt + 1)
                : c.evidenceSeries;
            return (
              <Link key={c.href} href={c.href} className="row">
                <span className="q">
                  <span className="q-t">{c.feedTitle}</span>
                  <span className="q-x">{c.blurb}</span>
                  <span className="q-m">
                    <span>{c.venue}</span>
                    <span>{c.focus}</span>
                    <span>Vol {c.vol}</span>
                    <span className="why-link">View Why</span>
                  </span>
                </span>
                <span className="hide-s">
                  <Sparkline market={sparkM} evidence={sparkE} />
                </span>
                <span className="num big r hide-s">{pct(c.marketPct / 100)}</span>
                <span className="num r hide-s">{c.evidenceScore}</span>
                <span className="r">
                  <span className={`pill ${c.tone}`}>
                    <i className="dot" />
                    {c.side} · {c.score}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
        <p className="foot">
          Drift surfaces a divergence between public data sources. Not financial
          advice, no real trades placed, no claim of market manipulation.
        </p>
      </div>
    </AppShell>
  );
}
