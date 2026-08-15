import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  EVIDENCE_KEYS,
  type Evidence,
  type EvidenceSnippet,
} from "../../../shared/types/contract";
import {
  REPLAY_SHOW,
  REPLAY_WINDOW_END,
  REPLAY_WINDOW_START,
  getEvidence,
} from "../evidence";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function checkSnippet(s: EvidenceSnippet, label: string): boolean {
  if (typeof s.text !== "string" || !s.text.trim()) {
    console.log(`FAIL ${label}: snippet text missing`);
    return false;
  }
  if (typeof s.source !== "string" || typeof s.date !== "string") {
    console.log(`FAIL ${label}: snippet source/date types`);
    return false;
  }
  return true;
}

function checkEvidence(label: string, e: Evidence): boolean {
  const missing = EVIDENCE_KEYS.filter((k) => !(k in e));
  if (missing.length) {
    console.log(`FAIL ${label}: missing ${missing.join(", ")}`);
    return false;
  }
  if (typeof e.show !== "string" || typeof e.window_start !== "string") {
    console.log(`FAIL ${label}: show/window_start not strings`);
    return false;
  }
  if (typeof e.window_end !== "string" || typeof e.timestamp !== "string") {
    console.log(`FAIL ${label}: window_end/timestamp not strings`);
    return false;
  }
  if (
    typeof e.social_score !== "number" ||
    typeof e.web_score !== "number" ||
    e.social_score < 0 ||
    e.social_score > 100 ||
    e.web_score < 0 ||
    e.web_score > 100
  ) {
    console.log(`FAIL ${label}: scores out of range`);
    return false;
  }
  if (!["rising", "flat", "falling"].includes(e.trend)) {
    console.log(`FAIL ${label}: invalid trend ${e.trend}`);
    return false;
  }
  if (!Array.isArray(e.top_sources) || !Array.isArray(e.snippets)) {
    console.log(`FAIL ${label}: top_sources/snippets not arrays`);
    return false;
  }
  for (const [i, s] of e.snippets.entries()) {
    if (!isRecord(s)) {
      console.log(`FAIL ${label}: snippet ${i} not object`);
      return false;
    }
    if (!checkSnippet(s as EvidenceSnippet, `${label} snippet ${i}`)) return false;
  }
  console.log(`PASS ${label}: contract shape (${e.snippets.length} snippets, source=${e.source})`);
  return true;
}

function checkCutoff(e: Evidence): boolean {
  const cutoff = Date.parse(e.window_end);
  const late = e.snippets.filter((s) => Date.parse(s.date) > cutoff);
  if (late.length) {
    console.log(`FAIL cutoff: ${late.length} snippets after ${e.window_end}`);
    return false;
  }
  console.log(`PASS cutoff: all snippet dates on/before ${e.window_end}`);
  return true;
}

function loadFixture(): Evidence {
  const cwd = process.cwd();
  const fixtures = cwd.endsWith("web")
    ? join(cwd, "../shared/fixtures")
    : join(cwd, "shared/fixtures");
  return JSON.parse(
    readFileSync(join(fixtures, "evidence.json"), "utf8"),
  ) as Evidence;
}

async function main() {
  const fixture = loadFixture();
  const replay = await getEvidence(
    REPLAY_SHOW,
    REPLAY_WINDOW_START,
    REPLAY_WINDOW_END,
  );

  let ok = true;
  ok = checkEvidence("fixture evidence.json", fixture) && ok;
  ok = checkEvidence("getEvidence replay window", replay) && ok;
  ok = checkCutoff(fixture) && ok;

  const hasPlaceholder =
    fixture.top_sources.some((s) => s.includes("PLACEHOLDER")) ||
    fixture.snippets.some((s) => s.text.includes("PLACEHOLDER"));
  if (hasPlaceholder) {
    console.log("FAIL fixture: PLACEHOLDER content still present");
    ok = false;
  } else {
    console.log("PASS fixture: no PLACEHOLDER content");
  }

  if (fixture.snippets.length < 1) {
    console.log("WARN fixture: zero snippets (scores-only demo fallback)");
  } else {
    console.log(`PASS fixture: ${fixture.snippets.length} real snippets`);
  }

  if (!ok) process.exit(1);
  console.log("ALL PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
