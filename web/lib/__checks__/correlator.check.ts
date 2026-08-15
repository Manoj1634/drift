/**
 * Correlator contract guard. Run: npx tsx lib/__checks__/correlator.check.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  RECOMMENDATION_KEYS,
  type Recommendation,
} from "../../../shared/types/contract";
import {
  isRecommendation,
  loadRecommendationFixture,
  redactCulture,
  loadCultureFixture,
} from "../correlator";

function fixturesDir() {
  const cwd = process.cwd();
  return cwd.endsWith("web")
    ? join(cwd, "../shared/fixtures")
    : join(cwd, "shared/fixtures");
}

function main() {
  const raw = JSON.parse(
    readFileSync(join(fixturesDir(), "recommendation.json"), "utf8"),
  ) as Recommendation;
  let ok = true;

  if (!isRecommendation(raw)) {
    console.log("FAIL recommendation.json missing keys");
    ok = false;
  } else {
    console.log(`PASS recommendation.json has ${RECOMMENDATION_KEYS.length} keys`);
  }

  for (const field of ["explanation", "counterargument"] as const) {
    const v = String(raw[field] ?? "");
    if (!v || v.includes("PLACEHOLDER")) {
      console.log(`FAIL ${field} is empty or PLACEHOLDER`);
      ok = false;
    } else {
      console.log(`PASS ${field} present`);
    }
  }

  const banned = /manipulat|guaranteed|market is wrong/i;
  const blob = `${raw.explanation}\n${raw.counterargument}\n${(raw.supporting_reasons ?? []).join("\n")}`;
  if (banned.test(blob)) {
    console.log("FAIL banned vocabulary in recommendation fixture");
    ok = false;
  } else {
    console.log("PASS vocabulary (no manipulation/guaranteed/market is wrong)");
  }

  const fixture = loadRecommendationFixture();
  if (fixture.explanation.includes("PLACEHOLDER")) {
    console.log("FAIL loadRecommendationFixture still exposes PLACEHOLDER");
    ok = false;
  } else {
    console.log("PASS loadRecommendationFixture scrubbed");
  }

  const culture = loadCultureFixture();
  const redacted = redactCulture(culture, "2026-08-06T12:00:00Z");
  if (redacted.official_rank.length !== 0 || redacted.views !== null) {
    console.log("FAIL redactCulture should clear this-week official print at cutoff");
    ok = false;
  } else if (!redacted.history?.some((h) => h.week_of === "2026-07-27")) {
    console.log("FAIL redactCulture should keep prior-week history");
    ok = false;
  } else {
    console.log("PASS redactCulture keeps incumbency history, clears reveal");
  }

  if (!ok) process.exit(1);
  console.log("ALL PASS");
}

main();
