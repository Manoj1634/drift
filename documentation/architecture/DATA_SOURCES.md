# Drift — Data Sources

## Required Sources

### 1. Polymarket

**Purpose**
- market discovery
- current probability
- price history
- volume

**Used by**
- Market Pulse

**Hackathon rule**
Use Polymarket as the only prediction-market source unless the core demo is already complete.

**Fallback**
Store one real market snapshot and historical series in `/shared/fixtures/`.

---

### 2. Grok X Search

**Purpose**
- topic chatter
- relevant accounts
- representative posts/snippets
- conversation velocity
- social evidence

**Used by**
- Evidence Scout

**Important**
Do not attempt to monitor all of X. Search a narrow candidate/show/topic and return only the most relevant evidence.

**Fallback**
Use Grok Web Search if X Search access/key behavior blocks the demo.

---

### 3. Grok Web Search

**Purpose**
- recent web/news evidence
- external confirmation
- competing signals
- supporting/contradicting context

**Used by**
- Evidence Scout

**Hackathon simplification**
Do not build a custom news scraper unless everything else is finished.

---

### 4. Netflix Top 10 / Tudum

**Purpose**
- ranking momentum
- historical ranking
- official/historical ground truth
- historical replay

**Used by**
- Truth & History

**No scraper needed — there is an official bulk file**

Netflix publishes every week for every country as a single TSV:

```
https://www.netflix.com/tudum/top10/data/all-weeks-countries.tsv
```

~31 MB, no auth, columns:
`country_name, country_iso2, week, category, weekly_rank, show_title, season_title, cumulative_weeks_in_top_10`

Filter `country_name == "United States"` and `category == "TV"`. The `week` column is the
Sunday date (e.g. `2026-07-19`), and `season_title` is the field that matches Polymarket's
`groupItemTitle` — use that to join, not `show_title`.

This replaces the planned HTML scrape for both live and historical ranking.

**Fallback**
Preload a real historical CSV/JSON snapshot into fixtures.

---

## Stretch Sources

### Google Trends
Add only if the core flow works.

Possible use:
- search interest score
- search-interest velocity

### Kalshi
Do not add unless Polymarket + Grok + Netflix + replay are already reliable.

### FlixPatrol
Optional extra culture signal. Not required.

---

## Source Priority

```text
MUST
1. Polymarket
2. Grok X/Web Search
3. Netflix Top 10

STRETCH
4. Google Trends
5. Kalshi
6. FlixPatrol
```

## What We Are Not Using

- Reddit scraper
- YouTube scraper
- custom crawler fleet
- stock feeds
- brokerage/order execution
- wallet APIs

## Reliability Strategy

For every required source:
1. implement live path
2. capture one valid response as a fixture
3. normalize live and fixture outputs to the same contract
4. provide a demo fallback switch

---

## Verified Status

All three MUST sources smoke-tested live on 2026-08-15. Re-run any time with:

```bash
python3 scripts/smoke_test.py
```

| Check | Status |
|---|---|
| `XAI_API_KEY` valid, `grok-4.6` responds | PASS |
| `x_search` live | PASS — 6 calls, 10 post links |
| `x_search` over a past window (`from_date`/`to_date`) | PASS — 10 post links from Jul 17–19 |
| `web_search` fallback | PASS — 15 calls |
| Polymarket Gamma event | PASS |
| Polymarket CLOB price history | PASS — 140 points |
| Netflix Tudum TSV | PASS — 2,668 US TV rows |

Fixtures live in `shared/fixtures/`. `X_SEARCH_ENABLED=true` is confirmed safe on this key.

## API Gotchas

Each of these cost real debugging time — don't rediscover them.

**Polymarket: closed markets need an explicit time window.**
`prices-history?interval=max` returns `{"history":[]}` for any resolved market. The
backtest week only works with explicit bounds:

```
/prices-history?market=<clobTokenId>&startTs=<unix>&endTs=<unix>&fidelity=60
```

Note the param is `market=` but the value is a **CLOB token ID**, not a market ID.
Windows longer than roughly a month are rejected as "interval is too long".

**Polymarket: placeholder outcomes.** Events carry unfilled slots literally titled
`Show A`…`Show G` sitting at `0.5`. Charted raw they look like real 50/50 markets.
Filter them out.

**Polymarket: double-encoded JSON.** `outcomes`, `outcomePrices`, and `clobTokenIds`
are JSON *strings* inside the JSON body — `json.loads()` each one individually.

**xAI: citation counters lie.** `usage.num_sources_used` is `0` and top-level
`citations` is `null` even on a fully successful search. The real signal is
`usage.server_side_tool_usage_details.x_search_calls`; the citations themselves are
inline markdown links in the message text.

**xAI: `web_search` is not ground truth.** Asked for the #1 US show the week of
2026-07-19 it confidently answered *Little House on the Prairie*, citing a stale Tudum
article. The correct answer is *The Hawk*. Use the Netflix TSV for resolution, never
`web_search`.

**macOS Python: SSL verify fails.** The python.org build ships without certs until you
run `Install Certificates.command`. Use `requests` (bundles `certifi`) rather than
stdlib `urllib`, which fails with `CERTIFICATE_VERIFY_FAILED`.

## Cost

Roughly $0.007 per `x_search` answer and $0.028 per `web_search` answer at current
usage, plus grok-4.6 tokens at $2.00/M in, $6.00/M out. Search tools bill $5 per 1,000
tool calls. A full smoke-test run is about $0.05 — cadence is not a budget concern at
demo scale.
