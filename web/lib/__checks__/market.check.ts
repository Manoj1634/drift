import { MARKET_KEYS, type Market, type PricePoint } from "../../../shared/types/contract";
import {
  LIVE_SLUG,
  REPLAY_CUTOFF,
  REPLAY_SLUG,
  getMarket,
} from "../market";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function checkMarket(label: string, m: Market) {
  const missing = MARKET_KEYS.filter((k) => !(k in m));
  if (missing.length) {
    console.log(`FAIL ${label}: missing ${missing.join(", ")}`);
    return false;
  }
  if (typeof m.id !== "string" || typeof m.title !== "string") {
    console.log(`FAIL ${label}: id/title not strings`);
    return false;
  }
  if (!isRecord(m.odds_by_outcome)) {
    console.log(`FAIL ${label}: odds_by_outcome not object`);
    return false;
  }
  if (!Array.isArray(m.history)) {
    console.log(`FAIL ${label}: history not array`);
    return false;
  }
  if (typeof m.volume_24h !== "number" || typeof m.timestamp !== "string") {
    console.log(`FAIL ${label}: volume/timestamp types`);
    return false;
  }
  console.log(`PASS ${label}: contract shape`);
  return true;
}

function checkCutoff(m: Market) {
  const cutoff = Date.parse(REPLAY_CUTOFF);
  const late = m.history.filter((pt: PricePoint) => Date.parse(pt.t) > cutoff);
  if (late.length) {
    console.log(`FAIL asOf cutoff: ${late.length} points after ${REPLAY_CUTOFF}`);
    return false;
  }
  const last = m.history[m.history.length - 1];
  if (!last) {
    console.log("FAIL asOf cutoff: empty history");
    return false;
  }
  if (Math.abs(last.p - 0.48) > 0.1) {
    console.log(`FAIL asOf cutoff: last p=${last.p}, expected ~0.48`);
    return false;
  }
  console.log(`PASS asOf cutoff: last p=${last.p} at ${last.t}`);
  return true;
}

async function main() {
  const liveFix = await getMarket("missing-live-forces-fixture");
  // force fixture by using known fixture loaders through failed fetch of garbage slug
  const replayFix = await getMarket("missing-replay");

  const live = await getMarket(LIVE_SLUG);
  const replay = await getMarket(REPLAY_SLUG);
  const replayAsOf = await getMarket(REPLAY_SLUG, REPLAY_CUTOFF);

  let ok = true;
  ok = checkMarket("live getMarket", live) && ok;
  ok = checkMarket("replay getMarket", replay) && ok;
  ok = checkMarket("replay asOf getMarket", replayAsOf) && ok;
  ok = checkMarket("fixture fallback (unknown slug)", liveFix) && ok;
  ok = checkCutoff(replayAsOf) && ok;

  const walter = Object.keys(live.odds_by_outcome).find((k) =>
    k.toLowerCase().includes("walter"),
  );
  if (walter && live.odds_by_outcome[walter] > 0.8) {
    console.log(`PASS live Walter Boys odds: ${live.odds_by_outcome[walter]} (${live.source})`);
  } else {
    console.log(
      `FAIL live Walter Boys odds missing/low: ${JSON.stringify(live.odds_by_outcome)} source=${live.source}`,
    );
    ok = false;
  }

  void replayFix;
  if (!ok) process.exit(1);
  console.log("ALL PASS");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
