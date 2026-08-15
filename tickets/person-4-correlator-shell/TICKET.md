# P4 — Correlator + App Shell + Integration + Deploy

**Mission:** the scaffold everyone builds into, the Grok Correlator (the load-bearing
reasoning — a judging rule), the merge sequence, and the hosted URL.

**Done when:** both screens run on the Vercel URL with live Grok verdicts, and the demo
path (Feed → Investigation → Why → Replay) completes 3× without touching code.

**Branch:** `feat/p4-correlator-shell` (scaffold goes straight to main at 0:08)
**Files:** `web/app/` pages, `web/lib/correlator.ts`, `web/app/api/correlate/route.ts`, `shared/types/contract.ts`, deploy config

**Timeline:** 0:00 scaffold agent starts immediately → 0:08 scaffold MERGED to main →
0:30–0:45 drive the merge sequence → 0:45 correlator merged → 0:52 deployed + frozen.

---

## Agent 1 — Scaffold (runs first, before anything else)

> Scaffold a Next.js (App Router, TypeScript, Tailwind) app in `web/`. Create
> `shared/types/contract.ts` with four exported types — `Market`, `Evidence`, `Culture`,
> `Recommendation` — copied EXACTLY from the "Shared Integration Contract" JSON in
> `documentation/architecture/AGENTS.md`. Two routes: `/` (Signal Feed) and
> `/market/[slug]` (Investigation). Render both screens entirely from
> `shared/fixtures/*.json`: feed shows two cards (live market from live-market.json
> labeled ALIGNED in green; replay market labeled "HIGH DIVERGENCE 78" in red with a
> "View Why" button); investigation shows odds placeholder, evidence placeholder,
> recommendation panel (explanation, counterargument, sources) from recommendation.json,
> and a "Replay Last Week" button. Components P1/P2/P3 will replace get clean stub slots:
> `<MarketChart/>`, `<EvidencePanel/>`, `<Replay/>` — create minimal stub files for each
> so imports never break. Dark theme, one accent color, big typography. It must
> `npm run build` clean — this merges to main at minute 8.

## Agent 2 — Correlator (the load-bearing Grok call)

> In `web/lib/correlator.ts`, implement `correlate(market, evidence, culture, asOf?)`
> returning the `Recommendation` type from `shared/types/contract.ts`. Call the xAI API
> (`api.x.ai/v1/chat/completions`, `XAI_API_KEY`) with a system prompt that: (1) states it
> is a prediction-market signal analyst comparing market pricing vs external evidence;
> (2) if `asOf` is set, forbids using any knowledge after that timestamp — it must reason
> only from the supplied data as if living at that moment; (3) requires strict JSON output
> matching the Recommendation type; (4) ALWAYS includes a genuine counterargument; (5) uses
> only the vocabulary "divergence / evidence gap / suggested side" — never "manipulation"
> or "guaranteed". Grok must genuinely weigh the three inputs — do NOT precompute the
> verdict in code. Expose as POST `/api/correlate` (body: the three payloads + optional
> asOf; `mode=asof` convenience for P3). Fixture fallback: `recommendation.json`. Test:
> replay inputs (48% market, rising evidence) should plausibly produce a diverged verdict —
> but do not hardcode it.

## Agent 3 — Integration + deploy

> 1) Wire the Investigation page to call `/api/market`, `/api/evidence`, `/api/correlate`
> server-side with `Promise.allSettled` — any rejection falls back to its fixture, page
> never 500s. Add a small "live / fixture" badge per data source (honesty + debuggability).
> 2) Set up Vercel: `vercel link`, add `XAI_API_KEY` env, confirm `vercel --prod` serves
> the app. 3) Write `web/lib/__checks__/e2e.check.ts`: fetch `/`, `/market/<replay-slug>`,
> and POST `/api/correlate` with fixture payloads; assert 200s and that the correlate
> response parses as `Recommendation`. Run it against the deployed URL, not localhost.

## You (human) — don't delegate these

- 0:00–0:08: run the key check with P2, keep everyone unblocked, merge the scaffold.
- 0:30–0:45: drive the merge sequence in `tickets/README.md` — after each merge, build + click through once.
- 0:45: merge correlator, deploy, announce freeze at 0:52.
- If any vertical is red at its merge slot: skip it, merge the next, its fixture is already live.
