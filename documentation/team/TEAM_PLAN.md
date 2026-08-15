# Water Cooler — 4-Person / 3-Hour Team Plan

## Working Principle

Each person owns a **vertical feature**, not only frontend or backend.

## Person 1 — Market Pulse

Own:
- Polymarket integration
- historical probability
- market chart
- market fixture

Done when:
> The app displays one real prediction market and its probability history.

## Person 2 — Evidence Scout

Own:
- Grok X Search
- Grok Web Search
- relevance filtering
- chatter/web score
- source snippets
- fixture fallback

Done when:
> One candidate has a social/web signal and inspectable evidence.

## Person 3 — Truth & History

Own:
- Netflix data
- ranking momentum
- historical snapshot
- replay sequence
- ground-truth reveal

Done when:
> The demo can replay one historical example using real data.

## Person 4 — Recommendation Experience

Own:
- Grok Correlator
- shared app shell
- divergence score
- explanation
- counterargument
- source panel
- final integration

Done when:
> All three signals flow into Grok and produce the investigation screen.

## Timeline

### 0:00–0:20 — Together

Lock:
- one demo market
- one historical replay example
- shared JSON schema
- repo paths / ownership
- API keys
- complete fixture

Critical result:
> The UI can render the complete demo from fixtures before integrations are done.

### 0:20–1:15 — Parallel Feature Work

Each person stays inside their feature boundary.

### 1:15–2:00 — Integration

Connect:

```text
Market + Evidence + Netflix
          ↓
        Grok
          ↓
  Recommendation Screen
```

At 2:00:
**Stop adding core features.**

### 2:00–2:35 — Demo Polish

Focus only on:
- chart clarity
- explanation
- source panel
- replay
- loading/error states

### 2:35–3:00 — Reliability

No new features.

- run demo 5x
- fix blockers
- rehearse
- record backup
- submit

## Merge Discipline

Every 30–40 minutes:
1. merge
2. run
3. resolve contract breaks
4. continue

Never wait until the end to integrate.
