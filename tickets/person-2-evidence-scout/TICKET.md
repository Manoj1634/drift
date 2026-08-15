# P2 — Evidence Scout (Grok X/Web search)

**Mission:** real social/web evidence with a time-window cutoff, so the replay shows only
chatter that existed before Thu Aug 6 12:00 UTC. Your snippets ARE the "day before" proof.

**Done when:** `/api/evidence?show=&windowEnd=` returns scores + real timestamped snippets
about *The Idaho Murders* premiere from before the cutoff, rendered in the evidence panel.

**Branch:** `feat/p2-evidence-scout` · **Files:** `web/lib/evidence.ts`, `web/app/api/evidence/route.ts`, `web/components/EvidencePanel.tsx`, `shared/fixtures/evidence.json`

**Timeline:** 0:08 start → 0:12 key verified with one real search call → 0:25 real snippets
captured into the fixture → 0:35 MERGE.

**FIRST ACTION (before agents):** run one real Grok search call with `XAI_API_KEY`. If X
Search is not available on the key, use Grok web search. If neither works by 0:15, tell P4
immediately — the demo pivots to scores-without-snippets.

---

## Agent 1 — Builder (live path)

> In `web/lib/evidence.ts`, implement `getEvidence(show: string, windowStart: string,
> windowEnd: string)` returning the `evidence` shape from `shared/types/contract.ts`.
> Call the xAI API (`https://api.x.ai/v1/chat/completions`, model `grok-4-fast` or the
> latest available, key in `process.env.XAI_API_KEY`) with its live-search/x-search tool
> enabled, restricted to the date window. Prompt Grok to return STRICT JSON:
> `{social_score: 0-100, web_score: 0-100, trend: "rising"|"flat"|"falling", snippets:
> [{text, source, date}], top_sources: []}` — scores meaning "volume and velocity of
> conversation about this show in this window relative to typical TV chatter." Parse
> defensively (strip markdown fences). Expose as GET `/api/evidence` in
> `web/app/api/evidence/route.ts`. On failure return `shared/fixtures/evidence.json`
> with `"source": "fixture"`. Test with show "The Idaho Murders: College Nightmare",
> window 2026-08-03 → 2026-08-06T12:00:00Z.

## Agent 2 — Fixture & real-data capture

> 1) Write `web/lib/__checks__/evidence.check.ts`: assert live output and
> `shared/fixtures/evidence.json` both match the `evidence` type in `shared/types/contract.ts`.
> 2) Once the live path works, run it ONCE for the replay window (Idaho Murders,
> 2026-08-03 → 2026-08-06T12:00:00Z) and ONCE for the live window (My Life With the Walter
> Boys, last 3 days) and OVERWRITE `shared/fixtures/evidence.json` with the real replay
> output. The placeholder snippets currently in that fixture must never reach the demo —
> replacing them with real captured output is a hard requirement.

## Agent 3 — UI (evidence panel)

> Build `web/components/EvidencePanel.tsx`: shows social_score and web_score as two large
> numbers with a trend arrow, then a list of snippet cards (quote text, source, date).
> Each snippet's date must be visible — the demo's point is these are timestamped BEFORE
> the market moved. If `snippets` contains the string "PLACEHOLDER", render the scores but
> hide the snippet list entirely. Develop against `shared/fixtures/evidence.json`.

## Fallbacks

- X Search unavailable → Grok web search with the same JSON contract.
- No search at all → Grok still generates scores from its own reasoning over the market
  question; snippets hidden. Say so honestly in the demo ("evidence scores, sources offline").
