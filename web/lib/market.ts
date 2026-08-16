import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Market, PricePoint } from "../../shared/types/contract";
import { MARKET_TTL_MS, cached } from "./cache";

export const LIVE_SLUG =
  "what-will-be-the-top-us-netflix-show-this-week-20260812180419528";
export const REPLAY_SLUG =
  "what-will-be-the-top-us-netflix-show-this-week-20260805154446618";
export const UFC_SLUG = "ufc-isl-ian1-2026-08-15";
export const UFC_FEED_TITLE = "UFC 330 · Makhachev vs Machado Garry";
export const UFC_EVIDENCE_TOPIC =
  "UFC 330 Islam Makhachev vs Ian Machado Garry";
export const REPLAY_CUTOFF = "2026-08-06T12:00:00Z";

export function isInvestigationSlug(slug: string) {
  return slug === LIVE_SLUG || slug === REPLAY_SLUG || slug === UFC_SLUG;
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const GAMMA = "https://gamma-api.polymarket.com";
const CLOB = "https://clob.polymarket.com";

function fixturesDir() {
  const cwd = process.cwd();
  return cwd.endsWith("web")
    ? join(cwd, "../shared/fixtures")
    : join(cwd, "shared/fixtures");
}

async function fetchJson(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate: 90 },
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${url}`);
  }
  return res.json();
}

function parseJsonField<T>(raw: unknown, fallback: T): T {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  return (raw as T) ?? fallback;
}

type GammaMarket = {
  question?: string;
  groupItemTitle?: string;
  outcomes?: string | string[];
  outcomePrices?: string | string[];
  clobTokenIds?: string | string[];
  volumeNum?: number;
  volume24hr?: number;
};

type GammaEvent = {
  slug?: string;
  title?: string;
  volume?: number;
  volume24hr?: number;
  markets?: GammaMarket[];
};

function isBinaryBook(outcomes: string[]) {
  const first = (outcomes[0] ?? "").trim().toLowerCase();
  return first === "yes" || first === "no" || first === "over" || first === "under";
}

function outcomesFromEvent(event: GammaEvent) {
  const named: { title: string; price: number; tokenId: string }[] = [];
  const binary: { title: string; price: number; tokenId: string }[] = [];
  for (const m of event.markets ?? []) {
    const labels = parseJsonField<string[]>(m.outcomes, []);
    const prices = parseJsonField<string[]>(m.outcomePrices, []);
    const tokens = parseJsonField<string[]>(m.clobTokenIds, []);
    if (labels.length >= 2 && !isBinaryBook(labels)) {
      for (let i = 0; i < labels.length; i++) {
        const title = (labels[i] ?? "").trim();
        const price = Number(prices[i] ?? 0);
        if (!title || !Number.isFinite(price)) continue;
        named.push({ title, price, tokenId: String(tokens[i] ?? "") });
      }
      continue;
    }
    const title = (m.groupItemTitle || m.question || "").trim();
    const yes = Number(prices[0] ?? 0);
    if (!title || !Number.isFinite(yes) || yes <= 0.001) continue;
    binary.push({ title, price: yes, tokenId: String(tokens[0] ?? "") });
  }
  // Moneyline events (UFC) expose named fighters; Netflix events are Yes/No per title.
  return named.length ? named : binary;
}

function filterHistory(history: PricePoint[], asOf?: string) {
  if (!asOf) return history;
  // 60s slack so CLOB points a few seconds after the nominal cutoff still count.
  const cutoff = Date.parse(asOf) + 60_000;
  return history.filter((pt) => Date.parse(pt.t) <= cutoff);
}

function fromLiveFixture(): Market {
  const raw = JSON.parse(
    readFileSync(join(fixturesDir(), "live-market.json"), "utf8"),
  ) as {
    id: string;
    title: string;
    odds_by_show: Record<string, number>;
    volume_24h: number;
    timestamp: string;
  };
  return {
    id: raw.id,
    title: raw.title,
    odds_by_outcome: raw.odds_by_show,
    history: [],
    volume_24h: raw.volume_24h,
    timestamp: raw.timestamp,
    source: "fixture",
  };
}

function fromReplayFixture(asOf?: string): Market {
  const raw = JSON.parse(
    readFileSync(join(fixturesDir(), "replay-market.json"), "utf8"),
  ) as {
    id: string;
    title: string;
    winner: string;
    idaho_price_history: PricePoint[];
    timestamp?: string;
  };
  const history = filterHistory(raw.idaho_price_history, asOf);
  const last = history[history.length - 1]?.p ?? 0.48;
  return {
    id: raw.id,
    title: raw.title,
    odds_by_outcome: { [raw.winner]: last },
    history,
    volume_24h: 0,
    timestamp: asOf ?? history[history.length - 1]?.t ?? new Date().toISOString(),
    source: "fixture",
  };
}

function fromUfcStub(): Market {
  return {
    id: UFC_SLUG,
    title: "UFC 330: Islam Makhachev vs. Ian Machado Garry (Welterweight, Main Card)",
    odds_by_outcome: {},
    history: [],
    volume_24h: 0,
    timestamp: new Date().toISOString(),
    source: "fixture",
  };
}

function fixtureFor(slug: string, asOf?: string): Market {
  if (slug === REPLAY_SLUG) return fromReplayFixture(asOf);
  if (slug === UFC_SLUG) return fromUfcStub();
  return fromLiveFixture();
}

function clobHistoryToPoints(raw: unknown): PricePoint[] {
  const rows = Array.isArray(raw)
    ? raw
    : ((raw as { history?: unknown })?.history ?? []);
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row) => {
      const tRaw = (row as { t?: number | string }).t;
      const p = Number((row as { p?: number }).p);
      if (tRaw == null || !Number.isFinite(p)) return null;
      const t =
        typeof tRaw === "number"
          ? new Date(tRaw * (tRaw < 1e12 ? 1000 : 1)).toISOString()
          : new Date(tRaw).toISOString();
      return { t, p };
    })
    .filter((x): x is PricePoint => x !== null);
}

async function fetchLiveMarket(slug: string, asOf?: string): Promise<Market> {
  const events = (await fetchJson(
    `${GAMMA}/events?slug=${encodeURIComponent(slug)}`,
  )) as GammaEvent[];
  const event = Array.isArray(events) ? events[0] : events;
  if (!event) throw new Error("empty gamma");

  const outcomes = outcomesFromEvent(event);
  if (outcomes.length === 0) throw new Error("no outcomes");

  const odds_by_outcome: Record<string, number> = {};
  for (const o of outcomes) odds_by_outcome[o.title] = o.price;

  const leading = outcomes.reduce((a, b) => (a.price >= b.price ? a : b));
  // +120s so the cutoff candle (e.g. Aug 6 12:00:20) is included when asOf is noon.
  const end = asOf
    ? Math.floor(Date.parse(asOf) / 1000) + 120
    : Math.floor(Date.now() / 1000);
  const start = end - 14 * 24 * 3600;

  let history: PricePoint[] = [];
  if (leading.tokenId) {
    const histRaw = await fetchJson(
      `${CLOB}/prices-history?market=${encodeURIComponent(leading.tokenId)}&startTs=${start}&endTs=${end}&fidelity=120`,
    );
    history = filterHistory(clobHistoryToPoints(histRaw), asOf);
  }

  // When asOf is set, surface the cutoff price — not post-resolution odds.
  if (asOf && history.length > 0) {
    odds_by_outcome[leading.title] = history[history.length - 1].p;
  }

  return {
    id: event.slug || slug,
    title: event.title || slug,
    odds_by_outcome,
    history,
    volume_24h: Number(event.volume24hr ?? event.volume ?? 0),
    timestamp: asOf ?? new Date().toISOString(),
    source: "polymarket",
  };
}

export async function getMarket(slug: string, asOf?: string): Promise<Market> {
  return cached({
    key: `market:${slug}:${asOf ?? "live"}`,
    ttlMs: MARKET_TTL_MS,
    load: () => fetchLiveMarket(slug, asOf),
    fallback: () => fixtureFor(slug, asOf),
  });
}

export type MarketListItem = {
  slug: string;
  title: string;
  volume_24h: number;
  lead: string;
  lead_price: number;
  outcomes: { title: string; price: number }[];
};

export async function listMarkets(limit = 12): Promise<MarketListItem[]> {
  const events = (await fetchJson(
    `${GAMMA}/events?limit=${limit}&active=true&closed=false&order=volume24hr&ascending=false`,
  )) as GammaEvent[];
  if (!Array.isArray(events)) return [];
  const rows: MarketListItem[] = [];
  for (const event of events) {
    const slug = event.slug;
    if (!slug) continue;
    const outcomes = outcomesFromEvent(event).sort((a, b) => b.price - a.price);
    const lead = outcomes[0];
    rows.push({
      slug,
      title: event.title || slug,
      volume_24h: Number(event.volume24hr ?? event.volume ?? 0),
      lead: lead?.title ?? "—",
      lead_price: lead?.price ?? 0,
      outcomes: outcomes.slice(0, 4).map((o) => ({ title: o.title, price: o.price })),
    });
  }
  return rows;
}
