# Drift — Docs

Hackathon docs for Drift, an AI prediction-market signal analyst.

**One-liner:** Prediction markets tell you what people will bet. The internet tells you what people are starting to believe. Drift flags the moment those two separate.

## The three that are canonical (repo root)

1. [AGENTS.md](../AGENTS.md) — **data contract + architecture.** Build against this one. Lives at root so Cursor auto-reads it.
2. [CONTEXT.md](../CONTEXT.md) — product decisions, non-goals, decisions log
3. [PLAN.md](../PLAN.md) — the build clock, four owners, feature freeze

Everything below is reference. If it conflicts with the three above, the three above win.

## Reference

4. [Concise spec](./product/SPEC.md) — short build target
5. [Full product spec](./product/PRODUCT_SPEC.md) — screens and MVP features
6. [Architecture](./architecture/ARCHITECTURE.md) — agents and data flow
7. [Data sources](./architecture/DATA_SOURCES.md) — Polymarket, Grok search, Netflix, fallbacks
8. [Team plan](./team/TEAM_PLAN.md) — vertical ownership, merge discipline
9. [Demo script](./demo/DEMO_SCRIPT.md) — **3-minute tape** (hard cap)
10. [Judging strategy](./demo/JUDGING_STRATEGY.md) — rubric alignment

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
