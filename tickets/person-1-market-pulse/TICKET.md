# P1 — Market Pulse (Polymarket)

**Mission:** real odds + price history for both locked markets, with an `asOf` cutoff so the
replay honestly shows only what was knowable on Thu Aug 6 12:00 UTC.

**Done when:** the feed card shows live Walter Boys odds, and `getMarket(replaySlug, asOf)`
returns history truncated at the cutoff (48%) — nothing after it.

**Branch:** `feat/p1-market-pulse` · **Files:** `web/lib/market.ts`, `web/app/api/market/route.ts`, `web/components/MarketChart.tsx`

**Timeline:** 0:08 start → 0:20 live fetch works → 0:30 MERGE (chart can land at 0:35 if tight).

---

## Agent 1 — Builder (live path)

> In `web/lib/market.ts`, implement `getMarket(slug: string, asOf?: string)` returning the
> `market` shape from `shared/types/contract.ts`. Fetch the event from
> `https://gamma-api.polymarket.com/events?slug=<slug>` (no auth). For each outcome with
> price > 0.001, extract title and yes-price. Fetch price history for the leading outcome's
> first clobTokenId from `https://clob.polymarket.com/prices-history?market=<id>&startTs=<s>&endTs=<e>&fidelity=120`
> — MUST send a browser User-Agent header or it 403s. If `asOf` is set, endTs = asOf and
> filter out any point after it. Expose as GET `/api/market?slug=&asOf=` in
> `web/app/api/market/route.ts`. On any fetch failure, return the matching fixture from
> `shared/fixtures/` (`live-market.json` or `replay-market.json`) with `"source": "fixture"`.
> Test with both locked slugs from `tickets/README.md`.

## Agent 2 — Fixture & contract guard

> Write `web/lib/__checks__/market.check.ts` (runnable via `npx tsx`): load
> `shared/fixtures/live-market.json` and `replay-market.json`, call the live
> `getMarket` for both slugs, and assert fixture and live outputs both satisfy the `market`
> type in `shared/types/contract.ts` (same keys, same types). Also assert: with
> `asOf=2026-08-06T12:00:00Z` no history point is later than the cutoff and the last price
> is ~0.48 (±0.1). Print PASS/FAIL per check. Do not modify the fixtures.

## Agent 3 — UI (chart)

> Build `web/components/MarketChart.tsx`: an SVG or lightweight line chart of
> `history: {t, p}[]` — no chart library installs, hand-rolled SVG polyline is fine.
> Props: `history`, optional `cutoff` (ISO string) that renders a vertical dashed line
> labeled "Water Cooler flag — Aug 6, 12:00 UTC", and optional `revealAfterCutoff` boolean
> that hides/shows the post-cutoff segment (P3's replay animates this). Style: dark
> background, one accent color, big % labels at start/cutoff/end. Develop against
> `shared/fixtures/replay-market.json`'s `idaho_price_history`.

## Fallbacks

- CLOB history flaky → fixture history is already real captured data; use it and move on.
- Chart not done by 0:35 → hand `MarketChart` off to P4's Agent 3 and merge the data layer alone.
