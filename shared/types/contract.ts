/**
 * Shared integration contract — frozen for hackathon integration.
 * Market keeps P1's live `odds_by_outcome` naming; fixtures may use
 * `odds_by_show` and map at the boundary (see web/lib/market.ts).
 */

export type PricePoint = {
  t: string;
  p: number;
};

export type Market = {
  id: string;
  title: string;
  odds_by_outcome: Record<string, number>;
  history: PricePoint[];
  volume_24h: number;
  timestamp: string;
  source: "polymarket" | "fixture";
  clob_token_ids?: Record<string, string>;
  end_date?: string;
};

export const MARKET_KEYS = [
  "id",
  "title",
  "odds_by_outcome",
  "history",
  "volume_24h",
  "timestamp",
  "source",
] as const;

export type EvidenceSnippet = {
  text: string;
  source: string;
  date: string;
};

export type EvidenceTrend = "rising" | "flat" | "falling";

export type EvidenceSource =
  | "grok_search"
  | "grok_web_search"
  | "grok_reasoning"
  | "fixture";

export type Evidence = {
  show: string;
  window_start: string;
  window_end: string;
  social_score: number;
  web_score: number;
  trend: EvidenceTrend;
  top_sources: string[];
  snippets: EvidenceSnippet[];
  timestamp: string;
  source: EvidenceSource;
};

export const EVIDENCE_KEYS = [
  "show",
  "window_start",
  "window_end",
  "social_score",
  "web_score",
  "trend",
  "top_sources",
  "snippets",
  "timestamp",
  "source",
] as const;

export type RankHistoryPoint = {
  week_of: string;
  rank: number;
  views: number;
};

/** Netflix Top 10 ground truth (P3). */
export type Culture = {
  week_of: string;
  official_rank: string[];
  views: number | null;
  previous_rank: number | string[] | null;
  current_rank: number | null;
  history: RankHistoryPoint[];
  score: number;
  source: "netflix_tudum" | "google_trends" | string;
  as_of: string;
};

export type SuggestedSide = "YES" | "NO" | "WATCH";
export type Verdict = "aligned" | "diverged";

export type Recommendation = {
  market_id: string;
  as_of: string;
  verdict: Verdict;
  suggested_side: SuggestedSide;
  divergence_score: number;
  confidence: number;
  explanation: string;
  supporting_reasons: string[];
  /** Required — strongest case that the gap is noise. */
  counterargument: string;
  sources: string[];
  flagged: boolean;
};

export const RECOMMENDATION_KEYS = [
  "market_id",
  "as_of",
  "verdict",
  "suggested_side",
  "divergence_score",
  "confidence",
  "explanation",
  "supporting_reasons",
  "counterargument",
  "sources",
  "flagged",
] as const;
