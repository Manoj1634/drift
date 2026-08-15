import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type {
  Culture,
  Evidence,
  Market,
  Recommendation,
  SuggestedSide,
  Verdict,
} from "../../shared/types/contract";
import { RECOMMENDATION_KEYS } from "../../shared/types/contract";
import {
  getEvidence,
  REPLAY_SHOW,
  REPLAY_WINDOW_END,
  REPLAY_WINDOW_START,
} from "./evidence";
import {
  REPLAY_CUTOFF,
  REPLAY_SLUG,
  getMarket,
} from "./market";

export const GROK_MODEL = "grok-4.6";
const XAI_CHAT = "https://api.x.ai/v1/chat/completions";

export type CorrelateResult = Recommendation & {
  source: "grok" | "fixture";
};

function fixturesDir() {
  const cwd = process.cwd();
  return cwd.endsWith("web")
    ? join(cwd, "../shared/fixtures")
    : join(cwd, "shared/fixtures");
}

export function loadRootEnv() {
  const roots = [
    join(process.cwd(), ".env.local"),
    join(process.cwd(), ".env"),
    join(process.cwd(), "../.env.local"),
    join(process.cwd(), "../.env"),
  ];
  for (const p of roots) {
    if (!existsSync(/* turbopackIgnore: true */ p)) continue;
    for (const line of readFileSync(/* turbopackIgnore: true */ p, "utf8").split(
      "\n",
    )) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m || process.env[m[1]]) continue;
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "").trim();
    }
  }
}

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(fixturesDir(), name), "utf8")) as T;
}

export function loadEvidenceFixture(): Evidence {
  const raw = readJson<Evidence>("evidence.json");
  return {
    ...raw,
    top_sources: (raw.top_sources ?? []).filter(
      (s) => s && !String(s).includes("PLACEHOLDER"),
    ),
    snippets: (raw.snippets ?? []).filter(
      (s) => s && !String(s.text).includes("PLACEHOLDER"),
    ),
    source: "fixture",
  };
}

export function loadCultureFixture(): Culture {
  const raw = readJson<Culture>("netflix-week.json");
  return {
    week_of: raw.week_of,
    official_rank: raw.official_rank ?? [],
    views: raw.views ?? null,
    previous_rank: raw.previous_rank ?? null,
    current_rank: raw.current_rank ?? null,
    history: raw.history ?? [],
    score: raw.score ?? 0,
    source: raw.source,
    as_of: raw.as_of,
  };
}

export function loadRecommendationFixture(): CorrelateResult {
  const raw = readJson<Recommendation>("recommendation.json");
  const cleaned = scrubPlaceholders(raw);
  return { ...cleaned, source: "fixture" };
}

function scrubPlaceholders(rec: Recommendation): Recommendation {
  const isBad = (s: string) => !s || s.includes("PLACEHOLDER");
  return {
    ...rec,
    explanation: isBad(rec.explanation)
      ? "At the Aug 6 cutoff the market priced this title near 48¢ while prior Tudum incumbency (#1, 18.2M views) was already knowable. Evidence gap — social chatter was weak; incumbency is the tell."
      : rec.explanation,
    counterargument: isBad(rec.counterargument)
      ? "Incumbency is not destiny: hours often decay after a debut week, and traders may rationally hold ~48% if they expect a mid-week fade. Suggested side YES flags an evidence gap, not a settled outcome."
      : rec.counterargument,
    supporting_reasons: (rec.supporting_reasons ?? []).filter(
      (r) => r && !r.includes("PLACEHOLDER"),
    ),
    sources: (rec.sources ?? []).filter((s) => s && !s.includes("PLACEHOLDER")),
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function clamp(n: unknown, lo: number, hi: number): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return lo;
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x)).filter((s) => s && !s.includes("PLACEHOLDER"));
}

export function isRecommendation(v: unknown): v is Recommendation {
  if (!isRecord(v)) return false;
  return RECOMMENDATION_KEYS.every((k) => k in v);
}

function toRecommendation(
  raw: Record<string, unknown>,
  fallback: { market_id: string; as_of: string },
): CorrelateResult {
  const verdict: Verdict = raw.verdict === "aligned" ? "aligned" : "diverged";
  const sideRaw = String(raw.suggested_side ?? "WATCH").toUpperCase();
  const suggested_side: SuggestedSide =
    sideRaw === "YES" || sideRaw === "NO" || sideRaw === "WATCH"
      ? sideRaw
      : "WATCH";
  const explanation = String(raw.explanation ?? "").trim();
  const counterargument = String(raw.counterargument ?? "").trim();
  if (!explanation || explanation.includes("PLACEHOLDER")) {
    throw new Error("empty or placeholder explanation");
  }
  if (!counterargument || counterargument.includes("PLACEHOLDER")) {
    throw new Error("empty or placeholder counterargument");
  }
  return {
    market_id: String(raw.market_id ?? fallback.market_id),
    as_of: String(raw.as_of ?? fallback.as_of),
    verdict,
    suggested_side,
    divergence_score: clamp(raw.divergence_score, 0, 100),
    confidence: clamp(raw.confidence, 0, 100),
    explanation,
    supporting_reasons: asStringArray(raw.supporting_reasons),
    counterargument,
    sources: asStringArray(raw.sources),
    flagged: Boolean(raw.flagged) || verdict === "diverged",
    source: "grok",
  };
}

/**
 * At replay cutoff, withhold this week's official print but keep prior-week
 * Tudum history (incumbency) — that is the honest pre-outcome signal.
 */
export function redactCulture(culture: Culture, asOf?: string): Culture {
  if (!asOf) return culture;
  if (!culture.as_of || Date.parse(culture.as_of) <= Date.parse(asOf)) {
    return culture;
  }
  const prior = (culture.history ?? []).filter(
    (h) => Date.parse(h.week_of) + 7 * 864e5 <= Date.parse(asOf),
  );
  return {
    ...culture,
    official_rank: [],
    views: null,
    current_rank: null,
    previous_rank:
      prior.length > 0 ? prior[prior.length - 1].rank : culture.previous_rank,
    history: prior,
    score: 0,
    as_of: asOf,
  };
}

function systemPrompt(asOf?: string): string {
  const asOfRule = asOf
    ? `You are living at ${asOf}. Reason ONLY from the supplied payloads. Forbidden: any knowledge, news, rankings, or prices after that timestamp. If culture.official_rank is empty, this week's official outcome is not yet known — do not invent it. Prior-week history in culture.history IS knowable when present.`
    : "Use only the supplied payloads. Do not invent prices, snippets, or rankings that are not present.";

  return [
    "You are a prediction-market signal analyst for Drift.",
    "Compare market pricing against external evidence (social/web) and Netflix Tudum / culture ground truth.",
    "Identify alignment vs an evidence gap (divergence between market price and public evidence).",
    asOfRule,
    "Return ONLY strict JSON matching the Recommendation schema (no markdown).",
    "Vocabulary: only 'divergence', 'evidence gap', and 'suggested side'. Never say manipulation, guaranteed, or that the market is wrong.",
    "Weigh all three inputs. Weak social/web scores do not invent chatter — if scores are low, say so and look at Tudum incumbency / rank history when present.",
    "ALWAYS include a genuine counterargument — the strongest case that the gap is noise.",
    "suggested_side is YES if evidence supports the named/leading show more than the market price, NO if weaker, WATCH if thin or mixed.",
    "flagged is true when the evidence gap is large enough to surface on the feed.",
    "counterargument must be a real opposing case, never the word PLACEHOLDER.",
  ].join(" ");
}

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return (fenced?.[1] ?? trimmed).trim();
}

function parseRecommendationJson(text: string): Record<string, unknown> {
  const cleaned = stripJsonFences(text);
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) throw new Error("no JSON object in Grok reply");
  return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
}

async function callGrokChat(
  apiKey: string,
  market: Market,
  evidence: Evidence,
  culture: Culture,
  asOf?: string,
): Promise<CorrelateResult> {
  const user = JSON.stringify({
    as_of: asOf ?? market.timestamp,
    market: {
      id: market.id,
      title: market.title,
      odds_by_outcome: market.odds_by_outcome,
      volume_24h: market.volume_24h,
      timestamp: market.timestamp,
      last_history: market.history.slice(-8),
    },
    evidence: {
      show: evidence.show,
      window_start: evidence.window_start,
      window_end: evidence.window_end,
      social_score: evidence.social_score,
      web_score: evidence.web_score,
      trend: evidence.trend,
      top_sources: evidence.top_sources,
      snippets: evidence.snippets.slice(0, 8),
    },
    culture,
    schema: {
      market_id: "string",
      as_of: "ISO8601",
      verdict: "aligned|diverged",
      suggested_side: "YES|NO|WATCH",
      divergence_score: "0-100",
      confidence: "0-100",
      explanation: "string",
      supporting_reasons: ["string"],
      counterargument: "string (required)",
      sources: ["string"],
      flagged: "boolean",
    },
  });

  const res = await fetch(XAI_CHAT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROK_MODEL,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt(asOf) },
        {
          role: "user",
          content: `Compare these three inputs and return Recommendation JSON only.\n${user}`,
        },
      ],
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`xAI chat ${res.status}`);
  }
  const body = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = body.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error("empty Grok content");
  return toRecommendation(parseRecommendationJson(text), {
    market_id: market.id,
    as_of: asOf ?? market.timestamp,
  });
}

export async function correlate(
  market: Market,
  evidence: Evidence,
  culture: Culture,
  asOf?: string,
): Promise<CorrelateResult> {
  loadRootEnv();
  const safeCulture = redactCulture(culture, asOf);
  const fixture = loadRecommendationFixture();
  const useFixture =
    process.env.USE_DEMO_FIXTURES === "true" || !process.env.XAI_API_KEY?.trim();

  if (useFixture) {
    return {
      ...fixture,
      market_id: market.id,
      as_of: asOf ?? fixture.as_of,
      source: "fixture",
    };
  }

  const apiKey = process.env.XAI_API_KEY!.trim();
  try {
    return await callGrokChat(apiKey, market, evidence, safeCulture, asOf);
  } catch {
    return {
      ...fixture,
      market_id: market.id,
      as_of: asOf ?? fixture.as_of,
      source: "fixture",
    };
  }
}

export async function correlateForSlug(
  slug: string,
  asOf?: string,
): Promise<CorrelateResult> {
  const cutoff = asOf ?? (slug === REPLAY_SLUG ? REPLAY_CUTOFF : undefined);
  const market = await getMarket(slug, cutoff);
  const lead =
    Object.entries(market.odds_by_outcome).sort((a, b) => b[1] - a[1])[0]?.[0] ??
    REPLAY_SHOW;
  const evidence =
    slug === REPLAY_SLUG
      ? await getEvidence(REPLAY_SHOW, REPLAY_WINDOW_START, REPLAY_WINDOW_END)
      : await getEvidence(
          lead,
          new Date(Date.now() - 3 * 864e5).toISOString(),
          new Date().toISOString(),
        );
  const culture = loadCultureFixture();
  return correlate(market, evidence, culture, cutoff);
}

/** Capture one live correlator response into shared/fixtures/recommendation.json */
export async function captureRecommendationFixture(
  slug = REPLAY_SLUG,
  asOf = REPLAY_CUTOFF,
): Promise<CorrelateResult> {
  loadRootEnv();
  const prev = process.env.USE_DEMO_FIXTURES;
  process.env.USE_DEMO_FIXTURES = "false";
  const result = await correlateForSlug(slug, asOf);
  if (prev === undefined) delete process.env.USE_DEMO_FIXTURES;
  else process.env.USE_DEMO_FIXTURES = prev;

  if (result.source !== "grok") {
    throw new Error("capture failed — no live Grok recommendation");
  }
  const { source: _s, ...payload } = result;
  writeFileSync(
    join(fixturesDir(), "recommendation.json"),
    `${JSON.stringify(payload, null, 2)}\n`,
    "utf8",
  );
  return result;
}
