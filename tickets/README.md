# Tickets — 1-Hour Sprint (4 people × 3 AI agents)

One folder per person. Open **your folder's TICKET.md**, paste the three agent prompts into
your three agents, and stay inside your file boundary. This README is the coordination
contract — merge order, git workflow, and timeline.

## The product we're shipping in 60 minutes

Next.js app in `web/` with two screens:

1. **Signal Feed** — two real market cards: this week's Netflix #1 market (94% → shown **ALIGNED/green**) and the replay card.
2. **Investigation + Replay** — the hero: what Water Cooler saw on **Thu Aug 6, 12:00 UTC**, when the market had *The Idaho Murders* at **48%** — evidence rising, Grok flags divergence — then the real repricing to 99% and the official outcome reveal. All price data is real and already captured in `shared/fixtures/`.

**Cut for the 1-hour window:** views-bucket market, watch modal, mock trades, polling cron,
Google Trends. Fixture-first everywhere: the demo must run fully from `shared/fixtures/`
even if every live call dies.

## Ownership map (file boundaries — do not cross)

| Person | Vertical | Owns |
|---|---|---|
| P1 | Market Pulse | `web/lib/market.ts`, `web/app/api/market/`, `web/components/MarketChart.tsx` |
| P2 | Evidence Scout | `web/lib/evidence.ts`, `web/app/api/evidence/`, `web/components/EvidencePanel.tsx`, `shared/fixtures/evidence.json` |
| P3 | Truth & History | `web/lib/truth.ts`, `web/components/Replay.tsx`, `shared/fixtures/netflix-week.json` |
| P4 | Correlator + Shell | `web/app/` pages, `web/lib/correlator.ts`, `web/app/api/correlate/`, `shared/types/`, deploy |

`shared/types/contract.ts` changes: **P4 only**, announced out loud. If someone's output
breaks your build after a merge, the **producer** fixes it, immediately.

## Git workflow

```bash
# once, at start (after P4 merges the scaffold to main):
git checkout main && git pull
git checkout -b feat/p1-market-pulse        # p2/p3/p4 accordingly

# loop while working:
git add -A && git commit -m "wip: <what>"   # small commits, every ~10 min
git fetch origin && git rebase origin/main  # stay current
git push -u origin feat/p1-market-pulse
```

Merging = fast-forward merges driven by P4 (no PR reviews, no time):

```bash
git checkout main && git pull
git merge --no-ff feat/p1-market-pulse && npm run build --prefix web && git push
```

**Rule: `main` must always build.** If your merge breaks the build, you fix it on main
right there before the next person merges.

## Merge sequence (why this order)

```text
0:08  P4 scaffold  → main   (shell + fixtures render; everyone branches from this)
0:30  P1 market    → main   (real odds + chart; feed becomes real)
0:35  P2 evidence  → main   (real Grok snippets replace placeholders)
0:40  P3 replay    → main   (timeline + reveal, consumes P1/P2 output)
0:45  P4 correlator→ main   (live Grok verdict wired into both screens)
```

P3 merges after P1+P2 because the replay consumes their outputs. P4's correlator lands
last because it reads all three. If anyone is late, their fixture is already on main —
**skip them and merge the next person; nothing blocks.**

## Timeline

| Clock | What |
|---|---|
| 0:00–0:08 | **Together**: verify `XAI_API_KEY` with one real call; P4's Agent 1 scaffolds `web/` rendering both screens from fixtures; merge to main; branch off. |
| 0:08–0:30 | Parallel build. Each person: 3 agents running, you review + commit. |
| 0:30–0:45 | Merge window (sequence above). After each merge: `npm run dev`, click the demo path once. |
| 0:45–0:52 | P4 deploys to Vercel (`vercel --prod`, `XAI_API_KEY` env set). Everyone runs the demo path on the hosted URL. |
| 0:52–1:00 | Record backup video of one clean run. Submit. **No code after 0:52.** |

## Locked facts (verified against live APIs — don't re-derive)

- Live market slug: `what-will-be-the-top-us-netflix-show-this-week-20260812180419528` (Walter Boys 93.7%)
- Replay market slug: `what-will-be-the-top-us-netflix-show-this-week-20260805154446618` (resolved; winner *The Idaho Murders: College Nightmare*)
- Replay cutoff for the "day before" story: **2026-08-06T12:00:00Z**, Idaho price then: **0.48**
- Real price history (70 points, 42.5% → 99.5%) already in `shared/fixtures/replay-market.json`
- Gamma API: `gamma-api.polymarket.com/events?slug=...` (no auth). CLOB history: `clob.polymarket.com/prices-history?market=<clobTokenId>&startTs=&endTs=&fidelity=120` — needs a browser User-Agent header.

## Claims discipline (UI copy + demo narration)

Say: divergence signal, evidence gap, suggested side. Never: manipulation, guaranteed,
"the market is wrong." Placeholder snippets in fixtures must never appear in the demo —
if P2's live search fails, show scores without snippets rather than fake quotes.
