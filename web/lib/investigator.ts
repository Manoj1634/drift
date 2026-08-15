import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Culture, Evidence, Market, Recommendation } from "../../shared/types/contract";
import { loadRootEnv } from "./correlator";

export type InvestigatorMemo = {
  as_of: string;
  market_id: string;
  source: "cursor_sdk" | "fixture";
  status: "live" | "fixture" | "skipped" | "error";
  memo: string[];
};

function fixturesDir() {
  const cwd = process.cwd();
  return cwd.endsWith("web")
    ? join(cwd, "../shared/fixtures")
    : join(cwd, "shared/fixtures");
}

export function loadInvestigatorFixture(): InvestigatorMemo {
  const path = join(fixturesDir(), "investigator.json");
  if (!existsSync(/* turbopackIgnore: true */ path)) {
    return {
      as_of: "2026-08-06T12:00:00Z",
      market_id: "",
      source: "fixture",
      status: "fixture",
      memo: [
        "Investigator fixture missing — ship strip with honest fallback.",
        "Cutoff priced incumbency near 48¢ despite prior Tudum #1.",
        "Social/web scores were weak; Tudum history is the tell.",
        "Correlator flagged an evidence gap (suggested YES).",
        "Later repricing and Tudum #1 print are replay context only.",
        "Not manipulation detection and not guaranteed profit.",
      ],
    };
  }
  const raw = JSON.parse(
    readFileSync(/* turbopackIgnore: true */ path, "utf8"),
  ) as InvestigatorMemo;
  return {
    ...raw,
    source: "fixture",
    status: raw.status === "live" ? "fixture" : raw.status ?? "fixture",
    memo: (raw.memo ?? []).filter((line) => !String(line).includes("PLACEHOLDER")),
  };
}

function buildPrompt(
  market: Market,
  evidence: Evidence,
  culture: Culture,
  recommendation: Recommendation,
): string {
  return [
    "Write a 6-bullet investigation memo for Drift (prediction-market signal analyst).",
    "Do not claim manipulation or guaranteed profit.",
    "Use only these three snapshots plus the correlator output:",
    JSON.stringify({
      market: {
        id: market.id,
        title: market.title,
        odds_by_outcome: market.odds_by_outcome,
        timestamp: market.timestamp,
      },
      evidence: {
        show: evidence.show,
        social_score: evidence.social_score,
        web_score: evidence.web_score,
        trend: evidence.trend,
        snippets: evidence.snippets.slice(0, 4),
      },
      culture: {
        week_of: culture.week_of,
        previous_rank: culture.previous_rank,
        history: culture.history,
        official_rank: culture.official_rank,
        views: culture.views,
      },
      recommendation: {
        verdict: recommendation.verdict,
        suggested_side: recommendation.suggested_side,
        divergence_score: recommendation.divergence_score,
        explanation: recommendation.explanation,
        counterargument: recommendation.counterargument,
        flagged: recommendation.flagged,
      },
    }),
    "Return ONLY a JSON array of exactly 6 short bullet strings.",
  ].join("\n");
}

function parseMemo(text: string): string[] {
  const cleaned = text.trim();
  try {
    const start = cleaned.indexOf("[");
    const end = cleaned.lastIndexOf("]");
    if (start !== -1 && end > start) {
      const arr = JSON.parse(cleaned.slice(start, end + 1)) as unknown;
      if (Array.isArray(arr)) {
        return arr
          .map((x) => String(x).trim())
          .filter((s) => s && !s.includes("PLACEHOLDER"))
          .slice(0, 6);
      }
    }
  } catch {
    /* fall through */
  }
  return cleaned
    .split("\n")
    .map((l) => l.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((s) => s.length > 0)
    .slice(0, 6);
}

/**
 * After correlator returns flagged:true, fire ONE local @cursor/sdk Agent.prompt.
 * Falls back to shared/fixtures/investigator.json when key/timeout/SDK unavailable.
 */
export async function runInvestigator(opts: {
  market: Market;
  evidence: Evidence;
  culture: Culture;
  recommendation: Recommendation;
  timeoutMs?: number;
}): Promise<InvestigatorMemo> {
  loadRootEnv();
  const fixture = loadInvestigatorFixture();
  const asOf = opts.recommendation.as_of;
  const marketId = opts.market.id;

  if (!opts.recommendation.flagged) {
    return {
      ...fixture,
      as_of: asOf,
      market_id: marketId,
      status: "skipped",
      source: "fixture",
      memo: ["Investigator skipped — correlator did not flag divergence."],
    };
  }

  const apiKey = process.env.CURSOR_API_KEY?.trim();
  if (!apiKey) {
    return {
      ...fixture,
      as_of: asOf,
      market_id: marketId,
      status: "fixture",
      source: "fixture",
    };
  }

  const timeoutMs = opts.timeoutMs ?? 45_000;
  const prompt = buildPrompt(
    opts.market,
    opts.evidence,
    opts.culture,
    opts.recommendation,
  );

  try {
    // Dynamic import keeps @cursor/sdk out of the page module graph when unused.
    const { Agent } = await import(/* webpackIgnore: true */ "@cursor/sdk");
    const run = Agent.prompt(prompt, {
      apiKey,
      model: { id: "grok-4.6" },
      local: { cwd: join(process.cwd(), "..") },
    });
    const result = await Promise.race([
      run,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("investigator timeout")), timeoutMs),
      ),
    ]);
    const text =
      typeof result === "object" && result && "result" in result
        ? String((result as { result?: string }).result ?? "")
        : String(result ?? "");
    const memo = parseMemo(text);
    if (memo.length < 4) throw new Error("memo too short");
    const out: InvestigatorMemo = {
      as_of: asOf,
      market_id: marketId,
      source: "cursor_sdk",
      status: "live",
      memo,
    };
    return out;
  } catch {
    return {
      ...fixture,
      as_of: asOf,
      market_id: marketId,
      status: "fixture",
      source: "fixture",
    };
  }
}

export async function captureInvestigatorFixture(opts: {
  market: Market;
  evidence: Evidence;
  culture: Culture;
  recommendation: Recommendation;
}): Promise<InvestigatorMemo> {
  const live = await runInvestigator({ ...opts, timeoutMs: 90_000 });
  if (live.source !== "cursor_sdk") {
    throw new Error("capture failed — no live investigator memo");
  }
  writeFileSync(
    join(fixturesDir(), "investigator.json"),
    `${JSON.stringify(live, null, 2)}\n`,
    "utf8",
  );
  return live;
}
