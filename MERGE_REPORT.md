# MERGE_REPORT — Drift hackathon integration

Date: 2026-08-15  
Repo: `j-ber/cursors` (this work)  
Optional clean submission URL: https://github.com/Manoj1634/drift — **do not** merge `j-ber/cursors` history into that repo. If judges use Manoj1634/drift, take a **fresh file snapshot** from this integrated `main` after pull.

## What was copied (and from where)

| Source branch | Paths kept |
|---|---|
| `origin/feat_per_2` | `web/lib/evidence.ts`, `web/app/api/evidence/route.ts`, `web/components/EvidencePanel.tsx`, `web/lib/__checks__/evidence.check.ts`, `web/scripts/capture_evidence.ts`, `shared/fixtures/evidence.json` |
| `origin/feat/p3-truth-history` | `web/lib/truth.ts`, `web/lib/replay-types.ts`, `web/components/Replay.tsx`, `web/lib/__checks__/truth.check.ts`, `shared/fixtures/netflix-week.json` |
| `origin/feat/UI-final` | Design tokens merged into `web/app/globals.css` (not a blind full-file overwrite) |
| `origin/feat/p4-correlator-shell` | Structure of `web/app/market/[slug]/page.tsx` only — then rewired |

Base: `origin/main` (already included P1 Market Pulse). Local `main` was fast-forwarded; no rebase.

## What was new

- `shared/types/contract.ts` — frozen Market (P1 `odds_by_outcome`) + Evidence (object snippets) + Culture (P3 filled) + Recommendation (`counterargument` required)
- `web/lib/correlator.ts` — live `grok-4.6` via `api.x.ai/v1/chat/completions`; no precomputed verdict; asOf redaction keeps prior-week Tudum history
- `web/app/api/correlate/route.ts` — POST/GET, never throws a 500 for demo path
- `web/lib/investigator.ts` + `shared/fixtures/investigator.json` — one `@cursor/sdk` `Agent.prompt` when `flagged:true` and `CURSOR_API_KEY` set; else fixture memo
- Demo UI: `/` two-card feed; `/market/[slug]` investigation with agent strip, Why + counterargument, investigator memo under counterargument, Replay Last Week
- Checks: `web/lib/__checks__/correlator.check.ts`; `npm run check` runs market + evidence + truth + correlator
- `getMarket(..., asOf)` now surfaces cutoff history price in `odds_by_outcome` (not post-resolution 99%/100%)

## What was skipped

- P2: their `page.tsx`, Python smokes, giant grok dumps
- P3: entire alternate `web/` scaffold, their contract, duplicate `MarketChart`, `/replay` as homepage
- P4 shell: `web/lib/fixtures.ts` as UI data layer (deleted / never adopted) — fixtures are fallbacks inside lib functions only
- Branches not touched: `feat/p1-market-pulse`, `setup/smoke-tests-and-fixtures`
- No watch modal / mock trades

## Fixture-only vs live

| Surface | Live when | Fixture when |
|---|---|---|
| Market Pulse | Polymarket Gamma/CLOB reachable | network/error → `live-market.json` / `replay-market.json` |
| Evidence Scout | `XAI_API_KEY` set, `USE_DEMO_FIXTURES` not true | otherwise `evidence.json` (social **25** / web **0** / flat — not inflated) |
| Correlator | `XAI_API_KEY` set | honest `recommendation.json` (incumbency story; no PLACEHOLDER on screen) |
| Investigator | `CURSOR_API_KEY` + SDK succeeds after `flagged:true` | `investigator.json` |
| Culture / Replay | Tudum fixture (`netflix-week.json`) is the ground-truth source for demo | same |

## Honesty notes

- Real captured evidence scores kept weak; divergence tell is **Tudum incumbency**, not social chatter.
- PLACEHOLDER strings are scrubbed/hidden in UI loaders.
- Live Grok correlator capture was **not** run here (`XAI_API_KEY` absent in this environment). Fixture recommendation is an honest incumbency memo, not labeled as live Grok.
- Cursor SDK investigator likewise fixture-backed without `CURSOR_API_KEY`.

## Build / check / demo status

- `npm run build` in `web/` — **pass**
- `npm run check` — **pass** (market, evidence, truth, correlator)
- Click path verified locally: Feed → View Why → Why/counterargument/agent strip → Replay steps through reveal (`10.6M views vs 18.2M views prior`)

## Still broken / blockers

- No `XAI_API_KEY` in this environment → correlator + evidence stay fixture-badged until key is set (then optionally run capture helpers to overwrite fixtures with live Grok JSON).
- No `CURSOR_API_KEY` → investigator strip stays fixture-badged.
- Live Polymarket asOf history for the replay market currently ends near **44.5%** at the last CLOB point ≤ cutoff+slack; captured fixture history includes **48¢** at `12:00:20Z`. Replay scrubber uses the fixture timeline (48¢ → 99% → Tudum reveal). Feed may show ~44.5% when live CLOB is used — still an evidence-gap story, not resolved 100%.

## Suggested next (optional)

1. Export `XAI_API_KEY` / `CURSOR_API_KEY`, restart, hit investigation once to badge live.
2. If desired: `npx tsx` capture scripts to overwrite `recommendation.json` / `investigator.json` with live captures.
3. Sync a clean tree into Manoj1634/drift without importing this git history.
