/**
 * P3 contract guard. Run: npx tsx lib/__checks__/truth.check.ts
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getReplayTimeline, getTruth } from "../truth";
import type { Culture } from "../../../shared/types/contract";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");

type Check = { name: string; ok: boolean; detail: string };
const results: Check[] = [];

function check(name: string, ok: boolean, detail: string) {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

function walk(value: unknown, path: string, visit: (path: string, v: unknown) => void) {
  visit(path, value);
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      walk(v, path ? `${path}.${k}` : k, visit);
    }
  }
}

const CULTURE_KEYS: (keyof Culture)[] = [
  "week_of",
  "official_rank",
  "source",
  "views",
  "previous_rank",
  "current_rank",
  "history",
  "score",
  "as_of",
];

const EXPECTED_STEP_ORDER = ["cutoff", "evidence", "flag", "repricing", "reveal"] as const;

async function main() {
  const netflix = JSON.parse(
    readFileSync(join(root, "shared/fixtures/netflix-week.json"), "utf8"),
  ) as Record<string, unknown>;
  const replay = JSON.parse(
    readFileSync(join(root, "shared/fixtures/replay-market.json"), "utf8"),
  ) as { winner: string };

  const nullPaths: string[] = [];
  const placeholderPaths: string[] = [];
  walk(netflix, "", (p, v) => {
    if (v === null) nullPaths.push(p || "(root)");
    if (typeof v === "string" && v.includes("PLACEHOLDER")) placeholderPaths.push(p);
  });
  check("netflix-week.json has no nulls", nullPaths.length === 0, nullPaths.join(", "));
  check(
    "netflix-week.json has no PLACEHOLDER strings",
    placeholderPaths.length === 0,
    placeholderPaths.join(", "),
  );

  const missingCulture = CULTURE_KEYS.filter((k) => !(k in netflix) || netflix[k] === undefined);
  check(
    "netflix-week.json matches Culture keys",
    missingCulture.length === 0,
    missingCulture.length ? `missing ${missingCulture.join(", ")}` : "all Culture keys present",
  );

  const ranks = Array.isArray(netflix.official_rank)
    ? netflix.official_rank.filter((r): r is string => typeof r === "string")
    : [];
  check(
    "official_rank is a non-empty string[] (top 3)",
    ranks.length >= 3 && ranks.every((r) => r.trim().length > 0),
    ranks.length ? `${ranks.length} titles` : "not an array",
  );

  check(
    "official_rank[0] equals replay-market.json winner",
    ranks[0] === replay.winner,
    `rank0=${String(ranks[0])} winner=${replay.winner}`,
  );

  const truth = getTruth("2026-08-04");
  const truthMissing = CULTURE_KEYS.filter((k) => truth[k] === undefined || truth[k] === null);
  check(
    "getTruth() returns Culture with no nulls",
    truthMissing.length === 0 && typeof truth.views === "number" && truth.views > 0,
    truthMissing.length ? `bad fields: ${truthMissing.join(", ")}` : `views=${truth.views}`,
  );

  const { steps } = await getReplayTimeline();
  check("getReplayTimeline() returns ≥5 steps", steps.length >= 5, `count=${steps.length}`);
  const ids = steps.map((s) => s.id);
  const orderOk = EXPECTED_STEP_ORDER.every((id, i) => ids[i] === id);
  check(
    "steps ordered cutoff → evidence → flag → repricing → reveal",
    orderOk,
    `got [${ids.join(", ")}]`,
  );

  const failed = results.filter((r) => !r.ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  if (failed) process.exit(1);
}

main().catch((err) => {
  console.error("FAIL  check crashed —", err);
  process.exit(1);
});
