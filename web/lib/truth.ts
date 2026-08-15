import evidenceFixture from "../../shared/fixtures/evidence.json";
import netflixWeek from "../../shared/fixtures/netflix-week.json";
import recommendationFixture from "../../shared/fixtures/recommendation.json";
import replayMarket from "../../shared/fixtures/replay-market.json";
import type { Culture, Evidence, PricePoint, Recommendation } from "../../shared/types/contract";
import type { ReplayStep, ReplayTimeline } from "./replay-types";

export type { ReplayStep, ReplayStepId, ReplayTimeline } from "./replay-types";

type NetflixWeekFixture = Culture;
type ReplayMarketFixture = {
  id: string;
  title: string;
  winner: string;
  idaho_price_history: PricePoint[];
  as_of_cutoff_demo: string;
  price_at_cutoff: number;
};

const CUTOFF_SLACK_MS = 60_000;

function isCulture(value: NetflixWeekFixture): Culture {
  return {
    week_of: value.week_of,
    official_rank: value.official_rank,
    source: value.source,
    views: value.views,
    previous_rank: value.previous_rank,
    current_rank: value.current_rank,
    history: value.history,
    score: value.score,
    as_of: value.as_of,
  };
}

export function getTruth(weekOf: string): Culture {
  const fixture = netflixWeek as NetflixWeekFixture;
  if (fixture.week_of !== weekOf) {
    throw new Error(`No Netflix ground truth for week_of=${weekOf}; have ${fixture.week_of}`);
  }
  return isCulture(fixture);
}

function pointMs(t: string): number {
  return Date.parse(t);
}

export function historyAtOrBeforeCutoff(history: PricePoint[], cutoffIso: string): PricePoint[] {
  const cutoff = pointMs(cutoffIso) + CUTOFF_SLACK_MS;
  return history.filter((pt) => pointMs(pt.t) <= cutoff);
}

async function tryFetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(400), cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function apiBase(): string {
  if (process.env.TRUTH_API_BASE) return process.env.TRUTH_API_BASE.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

async function loadEvidence(replay: ReplayMarketFixture): Promise<Evidence> {
  const base = apiBase();
  const qs = new URLSearchParams({
    show: replay.winner,
    window_end: replay.as_of_cutoff_demo,
  });
  const live = await tryFetchJson<Evidence>(`${base}/api/evidence?${qs.toString()}`);
  if (live) return live;
  return evidenceFixture as Evidence;
}

async function loadRecommendation(replay: ReplayMarketFixture): Promise<Recommendation> {
  const base = apiBase();
  const qs = new URLSearchParams({ mode: "asof", asOf: replay.as_of_cutoff_demo });
  const live = await tryFetchJson<Recommendation>(`${base}/api/correlate?${qs.toString()}`);
  if (live) return live;
  return recommendationFixture as Recommendation;
}

export async function getReplayTimeline(): Promise<ReplayTimeline> {
  const replay = replayMarket as ReplayMarketFixture;
  const truth = getTruth("2026-08-04");
  const [evidence, recommendation] = await Promise.all([
    loadEvidence(replay),
    loadRecommendation(replay),
  ]);

  const cutoff = replay.as_of_cutoff_demo;
  const truncated = historyAtOrBeforeCutoff(replay.idaho_price_history, cutoff);
  const endPrice = replay.idaho_price_history.at(-1)?.p ?? replay.price_at_cutoff;

  const steps: ReplayStep[] = [
    {
      id: "cutoff",
      title: "Thu Aug 6, 12:00 UTC",
      at: cutoff,
      price: replay.price_at_cutoff,
      history: truncated,
      marketTitle: replay.title,
      cutoff,
      revealAfterCutoff: false,
    },
    {
      id: "evidence",
      title: "Evidence before the cutoff",
      evidence,
    },
    {
      id: "flag",
      title: "Divergence flag",
      recommendation,
    },
    {
      id: "repricing",
      title: "Market reprices after the flag",
      history: replay.idaho_price_history,
      cutoff,
      endPrice,
      revealAfterCutoff: true,
    },
    {
      id: "reveal",
      title: "Official Netflix result",
      winner: replay.winner,
      officialRank: truth.official_rank,
      views: typeof truth.views === "number" ? truth.views : 0,
      previousViews:
        truth.history?.find((h) => h.week_of === "2026-07-27")?.views ??
        truth.history?.[0]?.views,
      suggestedSide: recommendation.suggested_side ?? "YES",
      cutoffPrice: replay.price_at_cutoff,
      weekOf: truth.week_of,
    },
  ];

  return { steps };
}
