# P3 — Truth & History (ground truth + the Replay reveal)

**Mission:** own the demo's hero moment — the replay that steps through what Water Cooler
saw on Thu Aug 6 12:00 UTC and ends on the official outcome reveal with "how close were we."

**Done when:** clicking "Replay Last Week" steps through: 48% odds at cutoff → rising
evidence → divergence flag → real repricing curve to 99% → official Netflix result card.

**Branch:** `feat/p3-truth-history` · **Files:** `web/lib/truth.ts`, `web/components/Replay.tsx`, `shared/fixtures/netflix-week.json`

**Timeline:** 0:08 start → 0:15 Tudum data confirmed in fixture → 0:30 replay steps work on
fixtures → 0:40 MERGE (after P1/P2 so you can consume their real outputs).

**FIRST ACTION (before agents):** open tudum.netflix.com Top 10 for the week of Aug 4–10,
2026, and fill the `views` and full `official_rank` (top 3) in
`shared/fixtures/netflix-week.json` by hand. 2 minutes, no scraper. Nulls in that file must
not survive past 0:15.

---

## Agent 1 — Builder (truth layer)

> In `web/lib/truth.ts`, implement `getTruth(weekOf: string)` returning the `culture` shape
> from `shared/types/contract.ts`, reading `shared/fixtures/netflix-week.json` (this source
> is fixture-by-design — official data is weekly, never live-scraped in the demo). Add
> `getReplayTimeline()` that assembles the full replay data object: loads
> `shared/fixtures/replay-market.json` (real price history, cutoff, price_at_cutoff),
> calls `/api/evidence` for the replay window (fixture fallback is automatic), calls
> `/api/correlate?mode=asof` for the day-before verdict (until P4 merges, use
> `shared/fixtures/recommendation.json`), and returns
> `{steps: [...]}` — an ordered array the Replay component walks through.

## Agent 2 — Fixture & contract guard

> Write `web/lib/__checks__/truth.check.ts`: assert `shared/fixtures/netflix-week.json`
> matches the `culture` type in `shared/types/contract.ts`, contains NO null values and NO
> "PLACEHOLDER" strings, and that its `official_rank[0]` equals the `winner` field in
> `shared/fixtures/replay-market.json`. Also assert `getReplayTimeline()` returns ≥5 steps
> in the right order (cutoff snapshot → evidence → flag → repricing → reveal). Print
> PASS/FAIL per check.

## Agent 3 — UI (the Replay)

> Build `web/components/Replay.tsx` — a stepped sequence advanced by a "Next" button (no
> autoplay; presenter controls pacing). Steps: (1) "Thu Aug 6, 12:00 UTC" — market card
> frozen at 48%, chart truncated at cutoff (use P1's MarketChart with `cutoff` +
> `revealAfterCutoff=false`); (2) evidence panel with pre-cutoff snippets; (3) full-width
> divergence flag card: verdict, divergence score, Grok's explanation + counterargument —
> hold on this step; (4) chart reveals the post-cutoff repricing to 99%; (5) reveal card:
> "Official Netflix Top 10: The Idaho Murders — #1" side-by-side with "Water Cooler on
> Thursday: suggested YES @ 48¢" and the actual view count from netflix-week.json.
> Develop entirely against fixtures; wire live data at merge time.

## Fallbacks

- Tudum unreachable → winner is already verified via Polymarket resolution (it's in
  replay-market.json); ship rank-only reveal without view counts.
- Correlator not merged by 0:40 → replay ships against `recommendation.json` fixture; P4
  swaps it live at 0:45.
