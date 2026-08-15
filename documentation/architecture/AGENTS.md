# AGENTS.md — Cursor / Grok Working Context

This file is the canonical source of truth for the Water Cooler hackathon repo. If another document, message, or verbal decision conflicts with this file, update this file first.

## Product Vision

Water Cooler is an **AI prediction-market signal analyst**.

It watches prediction-market pricing and compares it with public evidence from social conversation, web/news signals, and an official/historical outcome source. Grok reasons across those inputs and surfaces moments where the market and the outside evidence diverge.

The product does **not** predict guaranteed profit and does **not** claim manipulation.

## Final Hackathon Scope

### One demo vertical

**Netflix Top 10 prediction markets**

### One primary question

> Is the market pricing the likely #1 U.S. Netflix show correctly relative to public evidence?

### Three data inputs

1. **Polymarket**
   - current probability
   - historical probability
   - volume
   - market metadata

2. **Grok X Search + Web Search**
   - relevant social chatter
   - topic velocity
   - relevant accounts / channels
   - recent web/news evidence
   - supporting and conflicting evidence

3. **Netflix Top 10**
   - current / historical ranking
   - prior-week movement
   - official or historical ground truth for replay

### One reasoning layer

**Grok Correlator**
- compares all inputs
- identifies aligned vs diverged
- returns a divergence score
- explains why
- returns a counterargument
- cites/returns evidence sources

## Required Product Screens

### Screen 1 — Signal Feed

Must show:
- market title
- current market probability
- divergence score
- YES / NO / WATCH signal
- one-sentence explanation
- `View Why`

### Screen 2 — Signal Investigation

Must show:
- current market probability
- probability history chart
- external signal scores
- Grok recommendation
- divergence score
- confidence
- prominent `Why?`
- source evidence
- bull case
- counterargument / risk
- `Replay Last Week`

### Lightweight Watcher Interaction

A simple `+ Watch Topic` modal is enough.

Do **not** build a full watchlist product during the hackathon.

## Killer Feature — Historical Replay

The replay demonstrates what Water Cooler would have seen at a prior point in time before the official outcome was known.

The replay must use real historical data where possible. Do not fabricate percentages or timestamps and present them as real.

The visual story:

```text
Earlier in week:
Market odds relatively low / flat
External evidence strengthening
        ↓
Water Cooler flags divergence
        ↓
Market reprices later
        ↓
Official outcome revealed
```

This is a demonstration of signal usefulness, not proof of guaranteed profitability.

## Architecture

```text
                    USER / MARKET
                         |
          ---------------------------------
          |               |               |
          v               v               v
    MARKET PULSE      EVIDENCE SCOUT    TRUTH & HISTORY
      Polymarket       Grok X/Web       Netflix Top 10
          |               |               |
          ---------------------------------
                         |
                         v
                  GROK CORRELATOR
                         |
                         v
             DIVERGENCE + EXPLANATION
                         |
                         v
                     DASHBOARD
```

## Grok Is Load-Bearing

Grok must visibly do meaningful work.

Grok should:
- search or reason over external evidence
- compare signals
- identify conflicts
- generate the divergence explanation
- generate the counterargument

Do not hardcode a rule such as `if social > market then BUY` and use Grok only to rewrite it.

## Shared Integration Contract

```json
{
  "market": {
    "id": "string",
    "title": "string",
    "yes_price": 0.62,
    "no_price": 0.38,
    "history": [],
    "volume_24h": 0,
    "timestamp": "ISO8601"
  },
  "evidence": {
    "social_score": 0,
    "web_score": 0,
    "trend": "rising",
    "top_sources": [],
    "snippets": [],
    "timestamp": "ISO8601"
  },
  "culture": {
    "current_rank": null,
    "previous_rank": null,
    "history": [],
    "score": 0,
    "source": "netflix_tudum"
  },
  "recommendation": {
    "verdict": "diverged",
    "suggested_side": "YES",
    "divergence_score": 0,
    "confidence": 0,
    "explanation": "",
    "supporting_reasons": [],
    "counterargument": "",
    "sources": []
  }
}
```

Do not silently change this contract.

## Team Ownership

### Person 1 — Market Pulse
Own:
- Polymarket integration
- market probability history
- market card / chart
- fixtures

### Person 2 — Evidence Scout
Own:
- Grok X Search
- Grok Web Search
- relevance filtering
- chatter / web scoring
- evidence snippets

### Person 3 — Truth & History
Own:
- Netflix historical / official data
- ranking momentum
- replay data
- historical outcome reveal

### Person 4 — Recommendation Experience
Own:
- Grok Correlator
- app shell integration
- divergence UI
- explanation
- counterargument
- demo flow

## 3-Hour Execution

### 0:00–0:20 — Together
- lock one real market
- lock shared schema
- create fixture
- smoke-test API access
- assign file ownership

### 0:20–1:15 — Parallel
Each owner builds their vertical feature.

### 1:15–2:00 — Integration
Connect all three inputs to Grok and the investigation screen.

### 2:00–2:35 — Demo UX
Finish chart, explanation, sources, replay, loading/error states.

### 2:35–3:00 — Reliability
No new features. Run the demo repeatedly, fix blockers, prepare recording.

## Must-Haves

- One real Polymarket market
- Market probability history
- One working external evidence path
- Netflix historical/ground-truth signal
- Grok-powered correlation
- Divergence score
- Prominent explanation
- Counterargument
- Source evidence
- Historical replay
- Reliable 5-minute demo

## Stretch Only

- Google Trends
- Kalshi
- multiple markets
- custom topic discovery
- account auto-discovery
- alerts
- personalization weights

## Explicit Non-Goals

- real trade execution
- wallets
- authentication
- stock/equity coverage
- manipulation-detection claims
- guaranteed-profit claims
- full portfolio system
- complex P&L
- arbitrary market coverage
- full historical backtesting engine

## Judging North Star

The judge should leave remembering:

> The market and public evidence disagreed. Grok found the gap, explained it, showed the sources, and demonstrated the same idea through a historical replay.

One reliable end-to-end signal beats ten unfinished features.
