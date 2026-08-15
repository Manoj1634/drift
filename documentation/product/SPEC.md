# Water Cooler

**Watch a prediction market. Watch the conversation around it. Flag the moment they stop agreeing.**

Not a manipulation detector. Not a trading bot. A divergence signal.

---

## Product

User opens the app → sees a curated list of Polymarket markets → opens one → hits **Watch**. Agents start polling that market on a cron (every ~5 min). When odds move without matching chatter — or chatter explodes without the odds moving — the user gets a flag.

That’s the whole product.

## Flow

1. **Home** — curated markets (title, current odds, last flag if any).
2. **Market** — odds over time + recent flags. One button: **Watch**.
3. **Watching** — backend job is live. Updates land on the same page as new flags. Optional mock “I’m in this position” so the demo has a ticket, not a wallet.

Three clicks. No login. No real money.

## Agents (one job each)

| Agent | Does | Source |
|---|---|---|
| Market Watcher | Odds + 24h volume for the watched market | Polymarket Gamma + CLOB (free, no key) |
| Chatter Scout | Interest/chatter for the topic | Google Trends (default). X/Grok search only if a funded key exists |
| Culture Watcher | Official outcome when the market is a Netflix #1 week | Tudum Top 10, cached — never live-scrape during demo |
| Correlator | Grok reads all three and writes the flag | Same Grok key as the rest of the build |

Culture Watcher is skippable if the watched market isn’t a Netflix week. Correlator still runs on market vs chatter.

If the team is 3 people, one person owns Culture + Chatter.

Frontend is whoever is fastest at UI — they start on mock data immediately.

## What the user sees

- Odds chart
- Latest flags, newest first
  - **Green** — move explained by chatter/news
  - **Red** — move with no matching narrative
- Mock balance + mock position (up/down since “entry”)

Grok’s reasoning is on the flag card. That’s the demo beat.

## Contract (don’t change silently)

**Market Watcher**

```json
{
  "market_id": "string",
  "market_title": "string",
  "show_options": ["A", "B"],
  "odds_by_show": {"A": 0.62, "B": 0.38},
  "volume_24h": 12345.67,
  "timestamp": "ISO8601",
  "source": "polymarket"
}
```

**Chatter Scout**

```json
{
  "show": "A",
  "window_start": "ISO8601",
  "window_end": "ISO8601",
  "chatter_score": 0,
  "source": "google_trends",
  "sample_snippets": []
}
```

**Culture Watcher** (optional)

```json
{
  "week_of": "YYYY-MM-DD",
  "official_rank": ["A", "B", "C"],
  "source": "netflix_tudum",
  "as_of": "ISO8601"
}
```

**Flag** (what the UI renders)

```json
{
  "market_id": "string",
  "week_of": "YYYY-MM-DD",
  "divergence_score": 0,
  "verdict": "aligned",
  "explanation": "plain English from Grok",
  "flagged": true
}
```

## Build

- Next.js frontend + Python (or Next API routes) for agents
- Cron: poll watched markets every 5 minutes; write JSON/SQLite; UI polls
- Seed one historical spike for the recording — do not wait for a live move
- Stack stays boring. Working pipeline > clever infra

## Ship / skip

**Ship:** real Polymarket odds on ≥1 market · chatter score for the same topic · Grok flag cards for 2–3 cases (mix of red and green) · dashboard + Watch + mock ticket · pipeline runs 5× without dying

**Skip:** real trades/wallets · live Netflix drop · stocks · auth · Kalshi · FlixPatrol · push alerts

## Demo (3 min)

Chart on screen → odds jump (seeded) → agents light up → Grok says “no matching chatter” → 2–3 flag cards, not all red → one line: *we surface the gap; a human decides what it means.*

## Open

- Grok key funded? If no, Trends-only chatter, Grok still writes flags.
- One backtest week, picked together. Same week for every agent.
