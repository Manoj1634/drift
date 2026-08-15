# Water Cooler — Docs

Hackathon docs for Water Cooler, an AI prediction-market signal analyst.

**One-liner:** Prediction markets tell you what people will bet. The internet tells you what people are beginning to believe. Water Cooler flags the moment those two stories stop matching.

## Start here

1. [Product context](../CONTEXT.md) — canonical product decisions (repo root)
2. [Concise spec](./product/SPEC.md) — short build target
3. [Full product spec](./product/PRODUCT_SPEC.md) — screens and MVP features
4. [Architecture](./architecture/ARCHITECTURE.md) — agents and data flow
5. [Data sources](./architecture/DATA_SOURCES.md) — Polymarket, Grok search, Netflix, fallbacks
6. [Agent working context](./architecture/AGENTS.md) — what Cursor/Grok should follow
7. [Team plan](./team/TEAM_PLAN.md) — 4-person / 3-hour split
8. [Demo script](./demo/DEMO_SCRIPT.md) — 5-minute tape
9. [Judging strategy](./demo/JUDGING_STRATEGY.md) — rubric alignment

## Layout

```text
documentation/
  product/         what we're building
  architecture/    how it fits together
  team/            who owns what
  demo/            how we show it
```

`.env.example` lives at the repo root.

## Non-goals

No real-money trading, wallets, auth, stocks, manipulation claims, or guaranteed profit.
