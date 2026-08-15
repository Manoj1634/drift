# Drift — Backtest Week

The live Netflix Top 10 only updates weekly (next: **Tue Aug 18, 3:00 PM ET**), so the
demo replays a past week instead of waiting on a live reveal. This is the chosen week
and why.

## The week: US Netflix Top 10, week of 2026-07-19

| | |
|---|---|
| Polymarket event | `708398` — [what-will-be-the-top-us-netflix-show-this-week-20260715162849089](https://polymarket.com/event/what-will-be-the-top-us-netflix-show-this-week-20260715162849089) |
| Series | `1-us-netflix-show` (id `10772`, weekly) |
| Market window | 2026-07-16T01:12Z → 2026-07-21T23:59Z |
| Volume | $138,713 |
| Actual #1 (Netflix Tudum) | **The Hawk: Season 1** |
| Market's favorite mid-week | **Little House on the Prairie: Season 1** (peaked 0.82) |

## Why this week

The market was confidently wrong for about two days, then repriced violently. That gap
is the product: Drift claims to notice when the market and the conversation disagree,
and this week has a real, narratable disagreement instead of a market that was right
the whole time.

Hourly odds for the two shows that mattered:

| Time (UTC) | The Hawk | Little House |
|---|---|---|
| 07-16 02:00 | 0.42 | 0.42 |
| 07-17 06:00 | **0.15** | **0.79** |
| 07-18 10:00 | **0.14** | **0.82** |
| 07-19 00:00 | 0.38 | 0.62 |
| 07-19 14:00 | **0.85** | **0.06** |
| 07-21 08:00 | 0.97 | 0.03 |

The Hawk bottomed at **0.10**. It resolved at **1.00**.

**The demo question:** was X chatter about The Hawk already elevated on Jul 17–18, while
the market had it at 0.14? If so, Drift flags the divergence ~36 hours before the market
repriced. Verified as answerable — `x_search` scoped to that window returns 10 distinct
post links (see `shared/fixtures/grok_x_search_backtest.json`).

## Ground truth for the week

Netflix's official US TV Top 10 for 2026-07-19, which is what the market resolved against:

1. **The Hawk: Season 1**
2. Little House on the Prairie: Season 1
3. I Will Find You: Limited Series
4. Worst Neighbor Ever: Season 1
5. Hot Ones: Extra Heat: Season 1

Captured in `shared/fixtures/netflix_backtest_top10.json`.

## Runners-up considered

Ranked by how cheap the eventual winner traded early — the bigger the gap, the bigger the
signal Drift would have caught. Full list in `shared/fixtures/backtest_candidates.json`.

| Week | Volume | Winner | Open → Final |
|---|---|---|---|
| **2026-07-21** | **$138,713** | **The Hawk: Season 1** | **0.42 → 1.00** (low 0.10) |
| 2026-07-07 | $93,228 | Worst Neighbor Ever | 0.49 → 1.00 (low 0.24) |
| 2026-01-13 | $115,829 | His & Hers | 0.50 → 0.98 |
| 2026-04-07 | $134,113 | XO, Kitty Season 3 | 0.50 → 0.98 |
| 2025-12-30 | $739,984 | Stranger Things: Season 5 | 0.74 → 0.79 |

Stranger Things has by far the most volume but the market was never wrong about it —
it opens at 0.74 and stays there. No divergence, no story.

Regenerate the ranking with:

```bash
python3 scripts/pick_backtest_week.py
```
