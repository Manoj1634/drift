import type { Evidence, Market, Recommendation } from "../../shared/types/contract";
import {
  loadCultureFixture,
  loadRecommendationFixture,
  loadRootEnv,
  redactCulture,
  correlate,
  type CorrelateResult,
} from "./correlator";
import {
  getEvidence,
  REPLAY_SHOW,
  REPLAY_WINDOW_END,
  REPLAY_WINDOW_START,
} from "./evidence";
import { runInvestigator, type InvestigatorMemo } from "./investigator";
import {
  LIVE_SLUG,
  REPLAY_CUTOFF,
  REPLAY_SLUG,
  UFC_EVIDENCE_TOPIC,
  UFC_FEED_TITLE,
  UFC_SLUG,
  getMarket,
  listMarkets,
  type MarketListItem,
} from "./market";

export type ReplayStop = {
  at: number;
  score: number;
  confidence: number;
  side: string;
  verdict: string;
  tone: "flag" | "calm" | "mute";
  label: string;
  when: string;
  explain: string;
  reasons: string[];
  counter: string;
};

export type FeedRow = {
  id: string;
  slug: string;
  venue: string;
  vol: string;
  q: string;
  feedTitle: string;
  focus: string;
  blurb: string;
  market: number[];
  evidence: number[];
  times: string[];
  xTicks: [number, string][];
  score: number;
  confidence: number;
  side: string;
  verdict: string;
  tone: "flag" | "calm" | "mute";
  flagAt: number | null;
  ranks: [string, number][];
  explain: string;
  reasons: string[];
  counter: string;
  sources: [string, "mk" | "ev", string][];
  outcomes: [string, string][];
  replay: ReplayStop[] | null;
  agents: {
    market: string;
    evidence: string;
    correlator: string;
    investigator: string;
  };
  scored: boolean;
  featured: boolean;
  hint: string;
};

export type FeedPayload = {
  rows: FeedRow[];
  listed_at: string;
};

export const IDAHO_REPLAY: ReplayStop[] = [
  {
    at: 1,
    score: 18,
    confidence: 40,
    side: "WATCH",
    verdict: "Aligned",
    tone: "calm",
    label: "Market still unsure",
    when: "Aug 6 2am",
    explain:
      "Idaho Murders is in the low forties. Public chatter is not loud. Nothing here needs a decision yet.",
    reasons: [
      "Price is still in the forties.",
      "Social/web scores in this window are weak — chatter is not the tell.",
    ],
    counter:
      "A quiet book can still be wrong. If Tudum incumbency is already knowable, waiting until noon is leaving edge on the table.",
  },
  {
    at: 4,
    score: 41,
    confidence: 55,
    side: "WATCH",
    verdict: "Watching",
    tone: "mute",
    label: "Incumbency is knowable",
    when: "Aug 6 10am",
    explain:
      "The title was already last week's Tudum #1. The CLOB is still treating it like a two-way race. Social is not the signal — the unpaid-for incumbency is.",
    reasons: [
      "Prior Tudum week: #1 with 18.2M views.",
      "Price has not moved to a consensus #1 level.",
    ],
    counter:
      "Hours often decay after a debut week. Traders may be pricing a fade, not missing the ranking.",
  },
  {
    at: 5,
    score: 72,
    confidence: 68,
    side: "YES",
    verdict: "Diverged",
    tone: "flag",
    label: "Drift flags it",
    when: "Aug 6 noon",
    explain:
      "At the Thu Aug 6 12:00 UTC cutoff the market still priced The Idaho Murders: College Nightmare near 48¢. Social chatter was weak (social 25, web 0, trend flat) — that is not the tell. The evidence gap is Tudum incumbency: the title was already last week's #1 with 18.2M views, yet the market had not priced a likely repeat at a consensus #1 level.",
    reasons: [
      "Idaho Murders ~48% at cutoff — far below a consensus #1 price for an incumbent.",
      "Previous Tudum week: #1 with 18.2M views; incumbency is knowable before this week's print.",
      "Captured social/web scores are weak and flat — do not treat chatter as the divergence driver.",
    ],
    counter:
      "Incumbency is not destiny: hours often decay after a debut week, and 18.2M prior views do not guarantee another #1 print. Traders may rationally hold ~48% if they expect a mid-week fade or another title to close.",
  },
  {
    at: 7,
    score: 22,
    confidence: 68,
    side: "WATCH",
    verdict: "Closing",
    tone: "mute",
    label: "Market reprices",
    when: "Aug 6 4pm",
    explain:
      "The CLOB has jumped off the 48¢ cutoff toward a consensus #1. The gap Drift flagged at noon is closing from the price side.",
    reasons: ["Price has left the cutoff 48¢ print.", "Official rank is still unknown at this stop."],
    counter:
      "Catching up is not the same as being led. A press cycle the book reacted to independently would look like this too.",
  },
  {
    at: 15,
    score: 9,
    confidence: 82,
    side: "YES",
    verdict: "Resolved",
    tone: "calm",
    label: "Outcome revealed",
    when: "Aug 11",
    explain:
      "Idaho Murders resolved as the official #1. The market finished near 1.00. The divergence Drift flagged at noon on Aug 6 no longer exists — the price got there first, the Top 10 confirmed it later.",
    reasons: [
      "Official Tudum rank: Idaho Murders #1 for the week of Aug 4.",
      "Settled near 1.00 on Polymarket.",
    ],
    counter:
      "One resolved week is not a track record. The honest read is that the signal appeared early here — not that it will every time.",
  },
];

function leading(odds: Record<string, number>) {
  return Object.entries(odds).sort((a, b) => b[1] - a[1]);
}

export function formatVol(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "—";
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

function formatPct(p: number) {
  return `${(Math.round(p * 1000) / 10).toFixed(1)}%`;
}

function downsample<T>(arr: T[], n = 15): T[] {
  if (arr.length === 0) return arr;
  if (arr.length <= n) return arr;
  const out: T[] = [];
  const step = (arr.length - 1) / (n - 1);
  for (let i = 0; i < n; i++) out.push(arr[Math.round(i * step)]!);
  return out;
}

function shortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

function evidenceSeries(n: number, social: number, trend: Evidence["trend"]): number[] {
  const start =
    trend === "rising"
      ? Math.max(0, social - 18)
      : trend === "falling"
        ? Math.min(100, social + 12)
        : social;
  if (n <= 1) return [social];
  return Array.from({ length: n }, (_, i) =>
    Math.round(start + ((social - start) * i) / (n - 1)),
  );
}

function ticks(times: string[]): [number, string][] {
  if (times.length === 0) return [];
  const last = times.length - 1;
  const mid = Math.round(last / 2);
  return [
    [0, times[0] ?? ""],
    [mid, times[mid] ?? ""],
    [last, times[last] ?? "Now"],
  ];
}

function displayText(value: string, fallback: string) {
  if (!value || value.includes("PLACEHOLDER")) return fallback;
  return value;
}

async function evidenceFor(slug: string, market: Market): Promise<Evidence> {
  if (slug === REPLAY_SLUG) {
    return getEvidence(REPLAY_SHOW, REPLAY_WINDOW_START, REPLAY_WINDOW_END);
  }
  const lead = leading(market.odds_by_outcome)[0]?.[0] ?? REPLAY_SHOW;
  const end = new Date().toISOString();
  const start = new Date(Date.now() - 3 * 864e5).toISOString();
  return getEvidence(slug === UFC_SLUG ? UFC_EVIDENCE_TOPIC : lead, start, end);
}

export function toFeedRow(input: {
  slug: string;
  market: Market;
  evidence: Evidence;
  rec: CorrelateResult | Recommendation;
  investigator?: InvestigatorMemo;
  scored?: boolean;
}): FeedRow {
  const { slug, market, evidence, rec } = input;
  const ranks = leading(market.odds_by_outcome).slice(0, 5);
  const lead = ranks[0] ?? ["—", 0];
  const hist = downsample(market.history, 15);
  const marketPts =
    hist.length > 1
      ? hist.map((p) => Math.round(p.p * 1000) / 10)
      : Array.from({ length: 15 }, () => Math.round(lead[1] * 1000) / 10);
  const n = marketPts.length;
  const evPts = evidenceSeries(n, evidence.social_score, evidence.trend);
  const times =
    hist.length > 1 ? hist.map((p) => shortDate(p.t)) : Array.from({ length: n }, () => "—");
  const flagged = rec.flagged || rec.verdict === "diverged";
  const tone: FeedRow["tone"] = flagged ? "flag" : rec.verdict === "aligned" ? "calm" : "mute";
  let flagAt: number | null = null;
  if (flagged) {
    let best = 0;
    let bestGap = -1;
    for (let i = 0; i < n; i++) {
      const g = Math.abs(evPts[i]! - marketPts[i]!);
      if (g >= bestGap) {
        bestGap = g;
        best = i;
      }
    }
    flagAt = best;
  }
  const isReplay = slug === REPLAY_SLUG;
  const isLiveLocked = slug === LIVE_SLUG;
  const isUfc = slug === UFC_SLUG;
  const replay =
    isReplay
      ? IDAHO_REPLAY.map((s) => ({
          ...s,
          at: Math.max(1, Math.min(n, Math.round((s.at / 15) * n))),
        }))
      : null;

  const explain = displayText(
    rec.explanation,
    flagged
      ? `${lead[0]} is ${formatPct(lead[1])} on the CLOB while public evidence sits at ${evidence.social_score}. Drift is scoring that gap.`
      : `${lead[0]} is ${formatPct(lead[1])} on the CLOB, in line with public evidence. No flag.`,
  );

  const sources: FeedRow["sources"] = [
    [
      market.source === "polymarket" ? "Polymarket CLOB" : "Polymarket fixture",
      "mk",
      ranks
        .slice(0, 3)
        .map(([t, p]) => `${t} ${formatPct(p)}`)
        .join(" · ") || market.title,
    ],
    [
      evidence.source === "fixture" ? "Evidence Scout · fixture" : "Evidence Scout · Grok",
      "ev",
      `Social ${evidence.social_score} · web ${evidence.web_score} · ${evidence.trend}`,
    ],
  ];
  for (const snip of evidence.snippets.slice(0, 2)) {
    sources.push([snip.source || "Source", "ev", snip.text]);
  }

  return {
    id: slug,
    slug,
    venue: isReplay
      ? `Polymarket · cutoff ${REPLAY_CUTOFF.slice(0, 10)}`
      : isUfc
        ? "Polymarket · paper only"
        : market.source === "polymarket"
          ? "Polymarket · live"
          : "Polymarket · fixture",
    vol: formatVol(market.volume_24h),
    q: market.title,
    feedTitle: isReplay
      ? "Week of Aug 4 · Idaho Murders"
      : isLiveLocked
        ? "This week · Walter Boys"
        : isUfc
          ? UFC_FEED_TITLE
          : market.title,
    focus: lead[0],
    blurb: explain.split(".")[0] + ".",
    market: marketPts,
    evidence: evPts,
    times,
    xTicks: ticks(times),
    score: rec.divergence_score,
    confidence: rec.confidence,
    side: rec.suggested_side,
    verdict: flagged ? "Diverged" : rec.verdict === "aligned" ? "Aligned" : "Watching",
    tone,
    flagAt,
    ranks: ranks.map(([t, p]) => [t, Math.round(p * 1000) / 10]),
    explain,
    reasons: (rec.supporting_reasons ?? []).filter((r) => r && !r.includes("PLACEHOLDER")),
    counter: displayText(
      rec.counterargument,
      "Agreement is not confirmation. Both signals could be following the same news cycle, which means they would also be wrong together.",
    ),
    sources,
    outcomes: ranks.map(([t, p]) => [t, formatPct(p)]),
    replay,
    agents: {
      market: market.source === "polymarket" ? "Polymarket CLOB" : "fixture",
      evidence: evidence.source === "fixture" ? "fixture" : "Grok search",
      correlator: "source" in rec && rec.source === "grok" ? "grok-4.6" : "fixture",
      investigator: input.investigator
        ? input.investigator.source === "cursor_sdk"
          ? "Cursor SDK"
          : input.investigator.status
        : "pending",
    },
    scored: input.scored !== false,
    featured: isReplay || isLiveLocked || isUfc,
    hint: isReplay
      ? "Resolved Aug 11"
      : isLiveLocked
        ? "Resolves this week"
        : isUfc
          ? "UFC 330 · paper only"
          : "Live book",
  };
}

export function pendingRow(slug: string): FeedRow {
  return listItemToRow({
    slug,
    title: slug,
    volume_24h: 0,
    lead: slug,
    lead_price: 0,
    outcomes: [],
  });
}

export function listItemToRow(item: MarketListItem): FeedRow {
  const pct = Math.round(item.lead_price * 1000) / 10;
  const series = Array.from({ length: 15 }, () => pct);
  const ranks = (item.outcomes?.length
    ? item.outcomes
    : [{ title: item.lead, price: item.lead_price }]
  ).map((o) => [o.title, Math.round(o.price * 1000) / 10] as [string, number]);
  return {
    id: item.slug,
    slug: item.slug,
    venue: "Polymarket · live book",
    vol: formatVol(item.volume_24h),
    q: item.title,
    feedTitle: item.title,
    focus: item.lead,
    blurb: `${item.lead} leads at ${pct}%. Open to run Evidence Scout and the Correlator.`,
    market: series,
    evidence: series,
    times: Array.from({ length: 15 }, () => "—"),
    xTicks: [
      [0, "—"],
      [14, "Now"],
    ],
    score: 0,
    confidence: 0,
    side: "WATCH",
    verdict: "Watching",
    tone: "mute",
    flagAt: null,
    ranks,
    explain:
      "This is a live Polymarket book. Drift has the CLOB lead; Evidence Scout and the Correlator run when you open it.",
    reasons: ["Live Gamma listing.", "Agents have not scored this book yet."],
    counter: "A lead price without an evidence window is a quote, not a signal.",
    sources: [["Polymarket Gamma", "mk", `${item.lead} ${pct}% · vol ${formatVol(item.volume_24h)}`]],
    outcomes: ranks.map(([t, p]) => [t, `${p.toFixed(1)}%`]),
    replay: null,
    agents: {
      market: "Polymarket",
      evidence: "pending",
      correlator: "pending",
      investigator: "pending",
    },
    scored: false,
    featured: false,
    hint: "Live book",
  };
}

export async function investigateSlug(slug: string): Promise<FeedRow> {
  loadRootEnv();
  const asOf = slug === REPLAY_SLUG ? REPLAY_CUTOFF : undefined;
  const market = await getMarket(slug, asOf);
  let evidence = await evidenceFor(slug, market);
  const culture = redactCulture(loadCultureFixture(), asOf);
  let rec: CorrelateResult = {
    ...loadRecommendationFixture(),
    market_id: market.id,
    as_of: asOf ?? market.timestamp,
  };
  try {
    rec = await correlate(market, evidence, culture, asOf);
  } catch {
    /* fixture rec */
  }

  // Idaho evidence.json is for the replay week only. Do not score other books
  // against it — that invents a gap. Without a live Evidence Scout window,
  // hold WATCH and keep the evidence series next to the CLOB.
  if (slug !== REPLAY_SLUG && evidence.source === "fixture") {
    const lead = leading(market.odds_by_outcome)[0];
    const leadPct = Math.round((lead?.[1] ?? 0) * 1000) / 10;
    evidence = {
      ...evidence,
      show: lead?.[0] ?? evidence.show,
      social_score: Math.round(leadPct),
      web_score: Math.round(leadPct),
      trend: "flat",
      snippets: [],
      top_sources: [],
    };
    rec = {
      ...rec,
      market_id: market.id,
      as_of: asOf ?? market.timestamp,
      verdict: "aligned",
      flagged: false,
      divergence_score: 12,
      suggested_side: "WATCH",
      confidence: 40,
      explanation: `${lead?.[0] ?? "The leader"} is ${leadPct}% on the live CLOB. Evidence Scout has no live window in this environment, so Drift will not flag a gap from the Idaho fixture.`,
      supporting_reasons: [
        `Leading outcome ${lead?.[0] ?? "—"} at ${leadPct}% (${market.source}).`,
        "Evidence Scout needs XAI_API_KEY for a live X/web window.",
      ],
      counterargument:
        "A live price without a live evidence window is a quote, not a disagreement. Both a real rally and a quiet book would look like this until Grok searches.",
      sources: [`Polymarket ${market.source}`],
      source: "fixture",
    };
  }
  let investigator: InvestigatorMemo | undefined;
  try {
    investigator = await runInvestigator({
      market,
      evidence,
      culture,
      recommendation: rec,
    });
  } catch {
    investigator = undefined;
  }
  return toFeedRow({ slug, market, evidence, rec, investigator, scored: true });
}

export async function loadFeed(): Promise<FeedPayload> {
  loadRootEnv();
  const [liveM, replayM, ufcM, listed] = await Promise.all([
    getMarket(LIVE_SLUG),
    getMarket(REPLAY_SLUG, REPLAY_CUTOFF),
    getMarket(UFC_SLUG),
    listMarkets(16).catch(() => [] as MarketListItem[]),
  ]);

  const scored = await Promise.allSettled([
    investigateSlug(LIVE_SLUG),
    investigateSlug(REPLAY_SLUG),
    investigateSlug(UFC_SLUG),
  ]);

  const liveRow =
    scored[0].status === "fulfilled"
      ? scored[0].value
      : toFeedRow({
          slug: LIVE_SLUG,
          market: liveM,
          evidence: {
            show: leading(liveM.odds_by_outcome)[0]?.[0] ?? "",
            window_start: "",
            window_end: "",
            social_score: Math.round((leading(liveM.odds_by_outcome)[0]?.[1] ?? 0.5) * 100),
            web_score: 50,
            trend: "flat",
            top_sources: [],
            snippets: [],
            timestamp: liveM.timestamp,
            source: "fixture",
          },
          rec: { ...loadRecommendationFixture(), verdict: "aligned", flagged: false, divergence_score: 12, suggested_side: "WATCH" },
          scored: false,
        });

  const replayRow =
    scored[1].status === "fulfilled"
      ? scored[1].value
      : toFeedRow({
          slug: REPLAY_SLUG,
          market: replayM,
          evidence: {
            show: REPLAY_SHOW,
            window_start: REPLAY_WINDOW_START,
            window_end: REPLAY_WINDOW_END,
            social_score: 25,
            web_score: 0,
            trend: "flat",
            top_sources: [],
            snippets: [],
            timestamp: REPLAY_CUTOFF,
            source: "fixture",
          },
          rec: loadRecommendationFixture(),
          scored: false,
        });

  const ufcRow =
    scored[2].status === "fulfilled" &&
    Object.keys(ufcM.odds_by_outcome).length > 0
      ? scored[2].value
      : Object.keys(ufcM.odds_by_outcome).length > 0
        ? toFeedRow({
            slug: UFC_SLUG,
            market: ufcM,
            evidence: {
              show: UFC_EVIDENCE_TOPIC,
              window_start: "",
              window_end: "",
              social_score: Math.round(
                (leading(ufcM.odds_by_outcome)[0]?.[1] ?? 0.5) * 100,
              ),
              web_score: Math.round(
                (leading(ufcM.odds_by_outcome)[0]?.[1] ?? 0.5) * 100,
              ),
              trend: "flat",
              top_sources: [],
              snippets: [],
              timestamp: ufcM.timestamp,
              source: "fixture",
            },
            rec: {
              ...loadRecommendationFixture(),
              verdict: "aligned",
              flagged: false,
              divergence_score: 12,
              suggested_side: "WATCH",
              explanation: `${leading(ufcM.odds_by_outcome)[0]?.[0] ?? "The favorite"} is priced on the live CLOB. Paper ticket only — Drift will not invent a gap from the Netflix fixture.`,
              counterargument:
                "A live price without a live evidence window is a quote, not a disagreement.",
            },
            scored: false,
          })
        : null;

  const extras = listed
    .filter(
      (m) =>
        m.slug !== LIVE_SLUG &&
        m.slug !== REPLAY_SLUG &&
        m.slug !== UFC_SLUG &&
        m.lead_price > 0.02 &&
        m.lead_price < 0.98,
    )
    .slice(0, 4)
    .map(listItemToRow);

  return {
    rows: [replayRow, liveRow, ...(ufcRow ? [ufcRow] : []), ...extras],
    listed_at: new Date().toISOString(),
  };
}
