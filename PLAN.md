---
name: Water Cooler build plan (v2 — 4 people, wall clock)
overview: Four vertical tracks against one frozen contract. Live divergence on a Google-searched market, replay on a hand-typed Netflix week. Grok does the reasoning; Cursor SDK is stretch, not scope.
todos:
  - id: lock
    content: "ALL FOUR — 11:45-12:00: freeze contract, hand-build full fixture, pick the two markets, assign files"
    status: pending
  - id: p1-market
    content: "P1 Market Pulse: Polymarket Gamma + CLOB prices-history for the live market"
    status: pending
  - id: p2-evidence
    content: "P2 Evidence Scout: Grok x_search -> score + snippets; pytrends for Google-searched ground truth"
    status: pending
  - id: p3-replay
    content: "P3 Replay: hand-typed Netflix week fixture + timeline scrubber, real values only"
    status: pending
  - id: p4-correlator
    content: "P4 Correlator + shell: Grok structured output w/ counterargument, one screen, mock ticket"
    status: pending
  - id: integrate
    content: "1:00-1:30 integration: all three signals -> Grok -> screen. Feature freeze at 1:30."
    status: pending
  - id: reliable
    content: "1:30-2:00: run the exact demo path 5x, freeze snapshot to fixtures/demo/"
    status: pending
  - id: record
    content: "2:00-2:20 record 3-min video. 2:40 hard start on the submission form."
    status: pending
isProject: false
---

# Water Cooler — build plan v2

**Assume now = 11:45. Submissions close 3:00. You have ~1h45m of build.**

## What changed from v1, and why

| v1 | v2 | Why |
|---|---|---|
| One track, 8 sequential todos | Four vertical owners, wall-clock gates | 4 people. Sequential todos idle three of them. |
| Dashboard 7th of 8 | Dashboard renders the full fixture at 12:00 | Taste is 30 pts and it's the last thing v1 builds. |
| Netflix Tudum scraper | Hand-typed one-week fixture | Ten rows of typing replaces the most expensive component. |
| pytrends as chatter *fallback* | pytrends as *ground truth* for the Google market | Those markets resolve on Google search data. Trends isn't a degraded X — it's the resolution proxy. |
| Cursor investigator in scope | Stretch, gated on 1:30 | Its memo competes with the correlator's explanation for the same screen and the same judge attention. Building in Cursor already satisfies the rule. |
| explanation, divergence_score, flagged | + `counterargument`, + `snippets` | Nearly free in the same structured call. Turns "API wrapper" into "analyst." |

## The two demo assets

Pick both at 11:45, together, and never revisit.

**Live signal — `#1 Searched TV Show on Google 2026`** ($91,938 volume). Multi-outcome, trading now, and its ground truth is Google search interest — which pytrends gives you live and free. This is what's on screen while the judge watches.

**Replay — one completed Netflix Top 10 week.** Type the ten rows by hand into `shared/fixtures/netflix-week.json`. No scraper. This is the only market with a *resolved* outcome, which is the only reason replay works at all. Real values only — never fabricate a percentage and present it as real.

## Contract — freeze at 12:00, one file, no silent edits

Now settled: **[AGENTS.md](AGENTS.md) at repo root owns the contract.** CONTEXT.md's version is marked superseded, ARCHITECTURE.md's is marked stale. `yes_price`/`no_price` couldn't represent a multi-outcome market, so the shape is:

```json
{
  "market": {
    "id": "string", "title": "string",
    "odds_by_outcome": {"Outcome A": 0.41, "Outcome B": 0.22},
    "history": [{"t": "ISO8601", "odds_by_outcome": {}}],
    "volume_24h": 0, "timestamp": "ISO8601"
  },
  "evidence": {
    "scores_by_outcome": {"Outcome A": 71, "Outcome B": 88},
    "trend": "rising", "snippets": [], "sources": [],
    "source": "x_search|pytrends", "timestamp": "ISO8601"
  },
  "truth": {
    "week_of": "YYYY-MM-DD", "official_rank": [], "source": "netflix_tudum|google_trends"
  },
  "signal": {
    "verdict": "aligned|diverged", "divergence_score": 0,
    "explanation": "", "counterargument": "", "sources": [], "flagged": false
  }
}
```

`shared/fixtures/demo.json` holds a complete, hand-written instance of this by 12:00. Every track builds against that file. Nobody waits on anybody.

## Tracks

**P1 — Market Pulse.** Polymarket Gamma for discovery, CLOB for current odds. Pull the **prices-history** endpoint once so the chart has a real line immediately instead of four dots from your own polling. Poll every 30s after that.

**P2 — Evidence Scout.** Grok `x_search` → per-outcome score + 2-3 snippets. pytrends for the Google market's search interest. If the xAI key isn't funded for X search, pytrends alone is enough — Grok still writes the signal. Cache every response to disk; pytrends 429s.

**P3 — Replay.** The scrubber: market odds early → evidence strengthening → divergence flag → market reprices → outcome revealed. This is the demo's spine, not a feature. It runs entirely off fixtures, which is why it can't break on stage.

**P4 — Correlator + shell.** One screen. Chart, divergence score, explanation, counterargument, sources, mock ticket, replay button. Owns final integration.

## Correlator

One structured parse, not a tool loop:

```python
chat = client.chat.create(model="grok-4.6")
chat.append(user(snapshots_as_json))
response, signal = chat.parse(Signal)   # verify the exact xai-sdk surface once, at 12:00
```

Prompt asks for: which signals agree, which conflict, `divergence_score`, `explanation` in plain English, and `counterargument` — the strongest case that the gap is noise. Never "manipulation," never "guaranteed."

**Two bugs from v1, fixed:**

- v1 said "event-driven on write, plus 60s tick." The market watcher writes every 30s, so that collapses to a Grok call every 30 seconds — ~200 calls before you record, and the explanation text churns while a judge reads it. **Gate re-runs on an odds delta threshold** (say 3pts) or a 5-minute floor.
- The investigator guard was "skip if in-flight." It must fire on the flag **transition** (false→true) with a cooldown, or a persistently flagged market spawns an agent forever.

## Cut

Kalshi. FlixPatrol. Live Tudum scrape. Culture Watcher as a live component. Add Topic modal. Two separate screens — one is enough. `confidence`, `suggested_side`, bull case. Agent-status animation. The eleven-item must-have list in AGENTS.md.

**Cursor SDK investigator:** stubbed behind `CURSOR_INVESTIGATOR=false`. If integration is green at 1:30, someone turns it on. Otherwise it ships off and gets one line in the decisions log — dropped deliberately, not by omission.

## Clock

| Time | What |
|---|---|
| 11:45–12:00 | All four: freeze contract, write the fixture, pick both markets, assign files |
| 12:00–1:00 | Parallel verticals. **Merge at 12:20 and 12:50** — merge, run, fix contract breaks, continue |
| 1:00–1:30 | Integration: three signals → Grok → screen |
| **1:30** | **Feature freeze.** Nothing new after this. |
| 1:30–2:00 | Run the exact demo path 5x. Snapshot `data/` → `fixtures/demo/` and record against the frozen copy |
| 2:00–2:20 | Record. **3 minutes max** — [DEMO_SCRIPT.md](documentation/demo/DEMO_SCRIPT.md) is now cut to 2:40. |
| 2:40 | Hard start on the submission form |

**3-minute cut:** problem 20s → live divergence + Why 60s → replay 60s → close 20s. The agent-status narration and the sources walkthrough are what go.

## Doc cleanup — done

- `AGENTS.md` moved to **repo root**, where Cursor auto-reads it. It was buried in `documentation/architecture/`, which defeated its entire purpose.
- Primacy conflict resolved: AGENTS.md owns contract + architecture, CONTEXT.md owns product decisions, PLAN.md owns the clock. The other six docs are explicitly reference-only.
- Contract fixed to `odds_by_outcome` so it can represent the multi-outcome markets on the shortlist. Superseded copies in CONTEXT.md and ARCHITECTURE.md are marked, not deleted.
- DEMO_SCRIPT.md cut from 5:00 to 2:40 against the hard 3:00 cap.

## Still open — team decides at the lock meeting

- **Which markets.** AGENTS.md still scopes to Netflix Top 10 only. This plan argues for the Google-searched market as the *live* signal plus a Netflix week as the *replay*. Not changed unilaterally — make the call together, then update AGENTS.md.
- **The 3-click mock trade.** In CONTEXT, in SPEC, absent from AGENTS must-haves, missing from the demo script. Cheapest thing on the list that makes the user concrete for the Business score. Restore it or kill it, but decide.
- **SPEC.md and PRODUCT_SPEC.md** are near-duplicates. Not worth merging with 90 minutes left; just don't build from either.
