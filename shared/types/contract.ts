/** P4 owns this file. P1 adds only the `market` shape needed to ship Market Pulse. */

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
