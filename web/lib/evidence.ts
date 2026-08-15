import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type {
  Evidence,
  EvidenceSnippet,
  EvidenceSource,
  EvidenceTrend,
} from "../../shared/types/contract";

export const REPLAY_SHOW = "The Idaho Murders: College Nightmare: Season 1";
export const REPLAY_WINDOW_START = "2026-08-03T00:00:00Z";
export const REPLAY_WINDOW_END = "2026-08-06T12:00:00Z";

const XAI_URL = "https://api.x.ai/v1/responses";
const MODEL = "grok-4-fast";

type GrokEvidencePayload = {
  social_score?: number;
  web_score?: number;
  trend?: string;
  snippets?: Array<{ text?: string; source?: string; date?: string } | string>;
  top_sources?: string[];
};

function fixturesDir() {
  const cwd = process.cwd();
  return cwd.endsWith("web")
    ? join(cwd, "../shared/fixtures")
    : join(cwd, "shared/fixtures");
}

function clampScore(n: unknown, fallback = 50): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return fallback;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function normalizeTrend(raw: unknown): EvidenceTrend {
  const t = String(raw ?? "").toLowerCase();
  if (t === "rising" || t === "flat" || t === "falling") return t;
  return "flat";
}

function stripJsonFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return (fenced?.[1] ?? trimmed).trim();
}

function parseGrokJson(text: string): GrokEvidencePayload | null {
  const cleaned = stripJsonFences(text);
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as GrokEvidencePayload;
  } catch {
    return null;
  }
}

function answerText(body: Record<string, unknown>): string {
  let out = "";
  for (const item of (body.output as Array<Record<string, unknown>>) ?? []) {
    if (item.type !== "message") continue;
    for (const c of (item.content as Array<Record<string, unknown>>) ?? []) {
      if (typeof c.text === "string") out += c.text;
    }
  }
  return out;
}

function toolCalls(body: Record<string, unknown>, tool: string): number {
  const details =
    ((body.usage as Record<string, unknown>)?.server_side_tool_usage_details as
      | Record<string, number>
      | undefined) ?? {};
  return details[`${tool}_calls`] ?? 0;
}

function normalizeSnippets(
  raw: GrokEvidencePayload["snippets"],
  windowEnd: string,
): EvidenceSnippet[] {
  if (!Array.isArray(raw)) return [];
  const out: EvidenceSnippet[] = [];
  for (const item of raw) {
    if (typeof item === "string") {
      if (item.includes("PLACEHOLDER")) continue;
      out.push({ text: item, source: "unknown", date: windowEnd });
      continue;
    }
    const text = String(item?.text ?? "").trim();
    if (!text || text.includes("PLACEHOLDER")) continue;
    out.push({
      text,
      source: String(item?.source ?? "unknown").trim() || "unknown",
      date: String(item?.date ?? windowEnd).trim() || windowEnd,
    });
  }
  return out.slice(0, 8);
}

function hasPlaceholderSnippets(snippets: EvidenceSnippet[]): boolean {
  return snippets.some(
    (s) =>
      s.text.includes("PLACEHOLDER") ||
      s.source.includes("PLACEHOLDER") ||
      s.date.includes("PLACEHOLDER"),
  );
}

function fromFixture(): Evidence {
  const raw = JSON.parse(
    readFileSync(join(fixturesDir(), "evidence.json"), "utf8"),
  ) as Evidence;
  return { ...raw, source: "fixture" };
}

function buildPrompt(show: string, windowStart: string, windowEnd: string) {
  return [
    `Analyze public conversation about the Netflix show "${show}"`,
    `strictly between ${windowStart} and ${windowEnd}.`,
    "Use live search tools restricted to that date window.",
    "Return ONLY strict JSON (no markdown, no commentary) with this shape:",
    '{"social_score":0-100,"web_score":0-100,"trend":"rising|flat|falling",',
    '"snippets":[{"text":"quote or paraphrase","source":"@handle or URL","date":"ISO8601"}],',
    '"top_sources":["url or handle"]}',
    "Scores mean volume and velocity of conversation about this show in this window",
    "relative to typical TV chatter.",
    "Every snippet date MUST be on or before the window end.",
    "Include at least 3 real snippets with timestamps when search results exist.",
  ].join(" ");
}

async function callGrok(
  apiKey: string,
  show: string,
  windowStart: string,
  windowEnd: string,
  tool: "x_search" | "web_search",
): Promise<{ text: string; source: EvidenceSource } | null> {
  const res = await fetch(XAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input: buildPrompt(show, windowStart, windowEnd),
      tools: [{ type: tool, from_date: windowStart, to_date: windowEnd }],
    }),
    cache: "no-store",
  });

  if (!res.ok) return null;
  const body = (await res.json()) as Record<string, unknown>;
  const text = answerText(body);
  if (!text.trim()) return null;

  const used = toolCalls(body, tool);
  if (used === 0 && tool === "x_search") return null;

  return {
    text,
    source: tool === "x_search" ? "grok_search" : "grok_web_search",
  };
}

async function callGrokReasoning(
  apiKey: string,
  show: string,
  windowStart: string,
  windowEnd: string,
): Promise<{ text: string; source: EvidenceSource } | null> {
  const res = await fetch(XAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input: buildPrompt(show, windowStart, windowEnd),
    }),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = (await res.json()) as Record<string, unknown>;
  const text = answerText(body);
  return text.trim() ? { text, source: "grok_reasoning" } : null;
}

function toEvidence(
  show: string,
  windowStart: string,
  windowEnd: string,
  payload: GrokEvidencePayload,
  source: EvidenceSource,
): Evidence {
  const snippets = normalizeSnippets(payload.snippets, windowEnd);
  const topSources = (payload.top_sources ?? [])
    .map((s) => String(s).trim())
    .filter((s) => s && !s.includes("PLACEHOLDER"));

  return {
    show,
    window_start: windowStart,
    window_end: windowEnd,
    social_score: clampScore(payload.social_score),
    web_score: clampScore(payload.web_score),
    trend: normalizeTrend(payload.trend),
    top_sources: topSources.length ? topSources : snippets.map((s) => s.source).slice(0, 5),
    snippets: hasPlaceholderSnippets(snippets) ? [] : snippets,
    timestamp: new Date().toISOString(),
    source,
  };
}

export async function getEvidence(
  show: string,
  windowStart: string,
  windowEnd: string,
): Promise<Evidence> {
  const useFixture =
    process.env.USE_DEMO_FIXTURES === "true" || !process.env.XAI_API_KEY;

  if (useFixture) {
    const fixture = fromFixture();
    return { ...fixture, show, window_start: windowStart, window_end: windowEnd };
  }

  const apiKey = process.env.XAI_API_KEY!;

  try {
    const attempts: Array<() => Promise<{ text: string; source: EvidenceSource } | null>> =
      [
        () => callGrok(apiKey, show, windowStart, windowEnd, "x_search"),
        () => callGrok(apiKey, show, windowStart, windowEnd, "web_search"),
        () => callGrokReasoning(apiKey, show, windowStart, windowEnd),
      ];

    for (const attempt of attempts) {
      const result = await attempt();
      if (!result) continue;
      const parsed = parseGrokJson(result.text);
      if (!parsed) continue;
      const evidence = toEvidence(
        show,
        windowStart,
        windowEnd,
        parsed,
        result.source,
      );
      if (result.source === "grok_reasoning") {
        evidence.snippets = [];
      }
      return evidence;
    }
  } catch {
    /* fall through to fixture */
  }

  const fixture = fromFixture();
  return { ...fixture, show, window_start: windowStart, window_end: windowEnd };
}

/** Capture replay-window evidence once and overwrite the shared fixture. */
export async function captureEvidenceFixture(
  show = REPLAY_SHOW,
  windowStart = REPLAY_WINDOW_START,
  windowEnd = REPLAY_WINDOW_END,
): Promise<Evidence> {
  const prev = process.env.USE_DEMO_FIXTURES;
  process.env.USE_DEMO_FIXTURES = "false";
  const evidence = await getEvidence(show, windowStart, windowEnd);
  if (prev === undefined) delete process.env.USE_DEMO_FIXTURES;
  else process.env.USE_DEMO_FIXTURES = prev;

  const path = join(fixturesDir(), "evidence.json");
  writeFileSync(path, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  return evidence;
}
