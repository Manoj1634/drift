# Water Cooler — Data Sources

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
