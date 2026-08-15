# Water Cooler — 2-Hour Execution Plan (4 people × 3 AI agents)

The original TEAM_PLAN assumed 3 hours. We have **2**. This plan cuts scope accordingly and
is the operative plan for the rest of the build. Everything here is consistent with
AGENTS.md contracts — nothing in the shared schema changes.

---

## What we cut (vs. the 3-hour plan)

| Cut | Replacement |
|---|---|
| Netflix Tudum **scraper** | One real historical week, hand-captured once into `shared/fixtures/netflix-week.json`. Replay runs off this file. |
| Live-then-fixture dual path for every source | Fixture-**first** for every source. Live Polymarket + live Grok are upgrades wired in only after the fixture demo runs end to end. |
| `+ Watch Topic` modal, mock trades panel | Skip entirely. Two screens only: Signal Feed → Investigation (with Replay). |
| Google Trends fallback build-out | Only if the Grok key fails in the first 15 minutes. |
| 5-minute polling cron | On-load fetch + a manual "Refresh" is enough for a hosted demo. |

**Ship list (unchanged in spirit):** one real Polymarket market · Grok evidence + Correlator visibly reasoning · divergence score + explanation + counterargument + sources · historical replay · hosted URL judges can open on their own laptops.

---

## Prerequisites — do these in the first 15 minutes, together

1. **Funded xAI key** → confirm one `chat.completions` call and one X/Web-search call actually succeed. Put it in `.env` as `XAI_API_KEY`. *(Single biggest risk — test it before anything else.)*
2. **Lock the demo market + backtest week** — one Polymarket "Netflix #1" market, one past week where market and chatter visibly diverged. Every agent uses the same week.
3. **Capture the three fixtures** into `shared/fixtures/` (one real Polymarket response, one real Grok search response, one Netflix Top 10 week). These make the UI demo-able before any integration is done.
4. **Hosting**: create a Vercel project now (`vercel link`), add `XAI_API_KEY` as a Vercel env var. Next.js app with API routes = zero extra infra; judges get a URL. Backup: `vercel dev` locally + record the demo video.
5. **Scaffold**: `create-next-app` at repo root (frontend + `/api` routes in one deployable), commit `shared/types` + `shared/fixtures` immediately so all four verticals build against the same contract.

## Git protocol

- Branch per person: `feat/market-pulse`, `feat/evidence-scout`, `feat/truth-history`, `feat/correlator-shell`.
- Merge to `main` every **25 minutes**, run the app, fix contract breaks on the spot. Never batch integration to the end.

---

## Ownership — 4 verticals

| Person | Vertical | Done when |
|---|---|---|
| **P1 — Market Pulse** | Polymarket Gamma+CLOB fetch, odds history, market card + chart | Real market + probability history render in the app |
| **P2 — Evidence Scout** | Grok X/Web search API route, relevance filter, chatter/web scores, snippets | One candidate has scores + inspectable evidence snippets |
| **P3 — Truth & History** | Netflix fixture, ranking momentum, **replay sequence + outcome reveal UI** | Replay walks the chosen week: evidence rises → flag → market reprices → outcome |
| **P4 — Correlator + Shell** | Grok Correlator prompt (structured JSON out), app shell, Signal Feed + Investigation screens, integration, **Vercel deploy** | All three inputs flow into Grok and the investigation screen renders the full recommendation |

## How each person uses their 3 AI agents

Same pattern for everyone — run them concurrently, you are the integrator:

- **Agent 1 — Builder**: implements the live path for your vertical against the shared contract.
- **Agent 2 — Fixture & contract guard**: builds the fixture path + a tiny script asserting live and fixture outputs match the schema in AGENTS.md. This is our evaluation harness.
- **Agent 3 — UI/polish**: builds your vertical's UI component off the fixture, in parallel, never blocked on the live path.

Rule: agents work, humans review + merge. If an agent stalls >10 min on a live integration, ship the fixture path and move on.

## Timeline (T = now)

| Window | What |
|---|---|
| **T+0:00–0:15** | Together: prerequisites 1–5 above. Do not split up until the fixture-driven UI skeleton runs. |
| **T+0:15–1:05** | Parallel vertical work, 3 agents each. Merge at T+0:40 and T+1:05. |
| **T+1:05–1:30** | Integration (P4 leads): live Polymarket + live Grok wired in; fixtures stay as the fallback switch. |
| **T+1:30–1:45** | Deploy to Vercel. Full demo path 5× on the hosted URL. **Feature freeze.** |
| **T+1:45–2:00** | Record backup video, rehearse the 60-second divergence moment, submit. |

## Evaluation & validation (phase 3)

1. **Contract check** — Agent-2 scripts pass for all four verticals (`shared/types` schema).
2. **5× reliability run** — the exact demo path (Feed → Investigation → Why → Replay) on the **hosted URL**, not localhost.
3. **Judge self-serve test** — one teammate opens the Vercel URL on a phone/second laptop cold, no instructions, and reaches the divergence moment in under 60 seconds.
4. **Claims audit** — grep the UI copy: "divergence signal / evidence gap" ✅, "manipulation / guaranteed" ❌.

## The 60-second judge moment (do not bury it)

Feed loads → one market card shows **HIGH DIVERGENCE 78/100** → click **View Why** → Grok's explanation + counterargument + sources → **Replay Last Week** shows the flag firing *before* the market repriced and the official outcome confirming it.
