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
