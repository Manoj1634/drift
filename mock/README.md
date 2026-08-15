# UI reference mock

`index.html` + `app.js` is a **working mock of both screens**. Open `index.html` in a browser — the feed filters, the rows navigate, the replay scrubber redraws the chart, the paper ticket logs, Watch topic adds a muted row.

It exists so four people building in parallel with coding agents produce **one interface instead of four**.

## What to take from it

**The tokens.** The `:root` block in `index.html` is the whole design system. Copy it verbatim into `web/app/globals.css` and use the Tailwind utilities already wired there (`bg-card`, `text-muted`, `text-market`, `text-evidence`, `bg-flag-bg`). The two series colors are validated for colorblind separation on `--ground: #17161a`; don't re-pick them by eye.

**The components.** Signal row (claim + sparkline + `YES|NO|WATCH · score`), divergence pill, show ranking, market chart with the shaded gap, the "What ran" agent strip, bull case, counterargument, replay scrubber, locked replay, paper ticket, Watch topic modal. The markup is plain and the class names say what they are.

**The chart.** `spark()` and `paint()` in `app.js` are ~40 lines of vanilla SVG. Port them to a component; don't add a charting library for two lines. Investigation chart is a **0–100 axis** so a judge can read absolute probability. Sparklines scale to each row's own range so the gap shape is legible. On a flagged resolved market, the feed sparkline and numbers pin to the **flag moment**, not the terminal print.

## What NOT to take from it

**Invented evidence paths.** Idaho **market** prices are downsampled from `shared/fixtures/replay-market.json` (real CLOB). The evidence line is illustrative except the Aug 6 12:00 snapshot (`social_score` 86 / `web_score` 74 in `shared/fixtures/evidence.json`). Live-week history is illustrative until P1 fills `prices-history`. Explanation copy is illustrative until the correlator writes it. Build against `shared/fixtures/*.json` and the contract in [AGENTS.md](../AGENTS.md).

**A five-market Google/actor/album feed.** The locked vertical is Netflix Top 10. The feed is the live week plus the resolved Idaho week. Do not resurrect the old invented titles.

## Design rules an agent should follow

1. **One accent per state, not per element.** Blue is the market, ochre is the crowd. Crimson means flagged, green means aligned. Nothing else gets a color.
2. **Numbers are monospace and tabular.** Every odds figure, score, and timestamp. Columns of digits must line up.
3. **The explanation is body copy, not a tooltip.** It's the product. Give it room and a readable measure. On the feed, the one-sentence claim sits under the title — the judge should not have to click to learn the product.
4. **The counterargument always renders.** Visually recessed, never omitted. Render `supporting_reasons` (bull case) immediately above it.
5. **Replay only appears on resolved markets.** On unresolved ones show the locked state. The Idaho week is the only resolved market in the demo.
6. **Every color comes from a token.** Never hardcode a hex in a component. Dark-only on `--ground: #17161a` — do not add light mode.
7. **`odds_by_show` is a ranking, not a yes/no price.** Investigation lists each show. The chart and sparkline follow the focused show.
8. **The signal pill is `YES|NO|WATCH · score`.** That is `suggested_side` plus `divergence_score`. Do not substitute a "Diverged" label for the side.
9. **Confidence always renders** on the investigation score block, next to divergence.
10. **Aligned filter means aligned.** `tone === "calm"` only. Watching rows belong in All, not in Aligned.
11. **Feed numbers on a flagged resolved market are the flag snapshot.** Showing 99.5% next to a 78 divergence is a lie — the signal was 48% vs 86 at noon on Aug 6. Replay tells the rest.

## Status: the scaffold already adopted the tokens

`web/app/globals.css` carries this token set, wired into Tailwind v4 via `@theme inline`. Use the utilities — `bg-card`, `text-muted`, `border-hairline`, `text-market`, `text-evidence`, `bg-flag-bg` — instead of hardcoding hex values in components.

The app is **dark-only**. If a component needs a color that isn't a token, that's a signal the design is drifting — raise it rather than inventing a hex.
