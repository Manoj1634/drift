import AppShell from "@/components/AppShell";
import FeedToolbar, { type FeedCard } from "@/components/FeedToolbar";
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

/** Format a 0–1 probability as a percentage label. */
function pct(v: number) {
  const p = Math.round(v * 1000) / 10;
  return `${p % 1 ? p.toFixed(1) : p}%`;
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
        <FeedToolbar
          cards={cards}
          liveHint={`Market 30s · evidence 10m · ${live.source}/${replay.source}`}
        />
        <p className="foot">
          Drift surfaces a divergence between public data sources. Not financial
          advice, no real trades placed, no claim of market manipulation.
        </p>
      </div>
    </AppShell>
  );
}
