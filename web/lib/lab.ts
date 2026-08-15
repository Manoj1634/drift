import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  LIVE_SLUG,
  REPLAY_CUTOFF,
  REPLAY_SLUG,
  getMarket,
} from "./market";
import type { Market } from "../../shared/types/contract";
import type { LabResult, LabStep } from "./lab-types";

export type { LabResult, LabStep };

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function fixturesDir() {
  const cwd = process.cwd();
  return cwd.endsWith("web")
    ? join(cwd, "../shared/fixtures")
    : join(cwd, "shared/fixtures");
}

function readFixture(name: string) {
  return JSON.parse(readFileSync(join(fixturesDir(), name), "utf8"));
}

function loadRootEnv() {
  const roots = [
    join(process.cwd(), ".env.local"),
    join(process.cwd(), ".env"),
    join(process.cwd(), "../.env.local"),
    join(process.cwd(), "../.env"),
  ];
  for (const p of roots) {
    if (!existsSync(/* turbopackIgnore: true */ p)) continue;
    for (const line of readFileSync(/* turbopackIgnore: true */ p, "utf8").split("\n")) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (!m || process.env[m[1]]) continue;
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "").trim();
    }
  }
}

async function timed<T>(fn: () => Promise<T>): Promise<{ ms: number; value?: T; error?: string }> {
  const t0 = Date.now();
  try {
    const value = await fn();
    return { ms: Date.now() - t0, value };
  } catch (err) {
    return { ms: Date.now() - t0, error: err instanceof Error ? err.message : String(err) };
  }
}

async function fetchJson(url: string) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} · ${url}`);
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

async function pingGrok(key: string) {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "grok-4-fast",
      max_tokens: 40,
      messages: [
        {
          role: "user",
          content:
            "Return only JSON: {\"ok\":true,\"note\":\"xAI reachable\"}",
        },
      ],
    }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${body.slice(0, 240)}`);
  return JSON.parse(body) as { choices?: { message?: { content?: string } }[] };
}

export async function runLab(mode: "live" | "replay"): Promise<LabResult> {
  loadRootEnv();
  const slug = mode === "live" ? LIVE_SLUG : REPLAY_SLUG;
  const asOf = mode === "replay" ? REPLAY_CUTOFF : undefined;
  const grokKey = process.env.XAI_API_KEY?.trim() ?? "";
  const steps: LabStep[] = [];
  let market: Market | null = null;

  const gamma = await timed(async () => {
    const events = (await fetchJson(
      `https://gamma-api.polymarket.com/events?slug=${encodeURIComponent(slug)}`,
    )) as { title?: string; slug?: string; markets?: unknown[]; volume24hr?: number }[];
    const event = Array.isArray(events) ? events[0] : events;
    if (!event) throw new Error("empty gamma response");
    const markets = event.markets ?? [];
    const outcomes: { title: string; price: number; tokenId: string }[] = [];
    for (const raw of markets) {
      const m = raw as {
        groupItemTitle?: string;
        question?: string;
        outcomePrices?: string | string[];
        clobTokenIds?: string | string[];
      };
      const title = (m.groupItemTitle || m.question || "").trim();
      const prices = parseJsonField<string[]>(m.outcomePrices, []);
      const tokens = parseJsonField<string[]>(m.clobTokenIds, []);
      const yes = Number(prices[0] ?? 0);
      if (!title || !Number.isFinite(yes) || yes <= 0.001) continue;
      outcomes.push({ title, price: yes, tokenId: String(tokens[0] ?? "") });
    }
    if (outcomes.length === 0) throw new Error("no priced outcomes");
    return { event, outcomes };
  });

  if (gamma.value) {
    const top = [...gamma.value.outcomes].sort((a, b) => b.price - a.price)[0];
    steps.push({
      id: "gamma",
      label: "Market Watcher · Gamma API",
      ok: true,
      ms: gamma.ms,
      source: "live",
      summary: `${gamma.value.event.title} · ${gamma.value.outcomes.length} outcomes · lead ${top.title} ${(top.price * 100).toFixed(1)}%`,
      payload: gamma.value.outcomes.map((o) => ({
        title: o.title,
        yes: o.price,
      })),
    });

    const clob = await timed(async () => {
      if (!top.tokenId) throw new Error("missing clobTokenId");
      const end = asOf
        ? Math.floor(Date.parse(asOf) / 1000)
        : Math.floor(Date.now() / 1000);
      const start = end - 14 * 24 * 3600;
      const hist = await fetchJson(
        `https://clob.polymarket.com/prices-history?market=${encodeURIComponent(top.tokenId)}&startTs=${start}&endTs=${end}&fidelity=120`,
      );
      const rows = Array.isArray(hist)
        ? hist
        : ((hist as { history?: unknown[] }).history ?? []);
      if (!Array.isArray(rows) || rows.length === 0) {
        throw new Error("empty CLOB history");
      }
      return { points: rows.length, last: rows[rows.length - 1] };
    });

    steps.push(
      clob.value
        ? {
            id: "clob",
            label: "Market Watcher · CLOB history",
            ok: true,
            ms: clob.ms,
            source: "live",
            summary: `${clob.value.points} price points for ${top.title}`,
            payload: clob.value,
          }
        : {
            id: "clob",
            label: "Market Watcher · CLOB history",
            ok: false,
            ms: clob.ms,
            source: "fixture",
            summary: "CLOB failed — chart will use fixture if getMarket falls back",
            error: clob.error,
          },
    );
  } else {
    steps.push({
      id: "gamma",
      label: "Market Watcher · Gamma API",
      ok: false,
      ms: gamma.ms,
      source: "fixture",
      summary: "Gamma failed",
      error: gamma.error,
    });
    steps.push({
      id: "clob",
      label: "Market Watcher · CLOB history",
      ok: false,
      ms: 0,
      source: "skipped",
      summary: "Skipped — Gamma did not return a token",
    });
  }

  const assembled = await timed(() => getMarket(slug, asOf));
  if (assembled.value) {
    market = assembled.value;
    steps.push({
      id: "assemble",
      label: "Market Watcher · getMarket()",
      ok: true,
      ms: assembled.ms,
      source: assembled.value.source === "polymarket" ? "live" : "fixture",
      summary: `source=${assembled.value.source} · ${Object.keys(assembled.value.odds_by_outcome).length} outcomes · history ${assembled.value.history.length}`,
      payload: {
        title: assembled.value.title,
        odds_by_outcome: assembled.value.odds_by_outcome,
        volume_24h: assembled.value.volume_24h,
        history_len: assembled.value.history.length,
      },
    });
  } else {
    steps.push({
      id: "assemble",
      label: "Market Watcher · getMarket()",
      ok: false,
      ms: assembled.ms,
      source: "fixture",
      summary: "getMarket threw",
      error: assembled.error,
    });
  }

  if (grokKey) {
    const grok = await timed(() => pingGrok(grokKey));
    const content = grok.value?.choices?.[0]?.message?.content ?? "";
    steps.push(
      grok.value
        ? {
            id: "grok",
            label: "Chatter Scout · xAI ping",
            ok: true,
            ms: grok.ms,
            source: "live",
            summary: content.slice(0, 160) || "Grok responded",
          }
        : {
            id: "grok",
            label: "Chatter Scout · xAI ping",
            ok: false,
            ms: grok.ms,
            source: "fixture",
            summary: "Grok call failed — using evidence fixture",
            error: grok.error,
          },
    );
  } else {
    steps.push({
      id: "grok",
      label: "Chatter Scout · xAI ping",
      ok: false,
      ms: 0,
      source: "skipped",
      summary: "No XAI_API_KEY — skipped live Grok",
    });
  }

  const evidence = readFixture("evidence.json");
  steps.push({
    id: "evidence",
    label: "Chatter Scout · evidence fixture",
    ok: !JSON.stringify(evidence).includes("PLACEHOLDER"),
    ms: 1,
    source: "fixture",
    summary: `${evidence.show} · social ${evidence.social_score} · web ${evidence.web_score} · ${evidence.trend}`,
    payload: evidence,
  });

  const truth = readFixture("netflix-week.json");
  steps.push({
    id: "truth",
    label: "Culture Watcher · Netflix week",
    ok: Array.isArray(truth.official_rank) && truth.official_rank.length > 0,
    ms: 1,
    source: "fixture",
    summary: `week ${truth.week_of} · #1 ${truth.official_rank?.[0] ?? "unknown"}`,
    payload: truth,
  });

  const rec = readFixture("recommendation.json");
  steps.push({
    id: "correlator",
    label: "Correlator · recommendation",
    ok: rec.verdict === "diverged" || rec.verdict === "aligned",
    ms: 1,
    source: rec.explanation?.includes("PLACEHOLDER") ? "fixture" : "live",
    summary: `${rec.verdict} · score ${rec.divergence_score} · ${rec.explanation}`,
    payload: rec,
  });

  return { mode, slug, asOf, grokKeyPresent: Boolean(grokKey), steps, market };
}
