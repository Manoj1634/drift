# UI reference mock

`index.html` is a **working, self-contained mock of both screens**. Open it in a browser — the feed filters, the rows navigate, the replay scrubber redraws the chart, the paper ticket logs.

It exists so four people building in parallel with coding agents produce **one interface instead of four**.

## What to take from it

**The tokens.** The `:root` block at the top is the whole design system — colors for light and dark, type stack, radii, shadows. Copy it verbatim into `web/app/globals.css` and reference the variables from Tailwind (`bg-[var(--card)]`, `text-[var(--muted)]`) rather than inventing a parallel palette. The two series colors are validated for colorblind separation in both themes; don't re-pick them by eye.

**The components.** Signal row, divergence pill, market chart with the shaded gap, the "What ran" agent strip, the counterargument block, the replay scrubber, the paper ticket. The markup is plain and the class names say what they are.

**The chart.** `spark()` and `paint()` are ~40 lines of vanilla SVG. Port them to a component; don't add a charting library for two lines.

## What NOT to take from it

**The data.** Every market, name, number, and snippet in the mock is invented. The real inputs are `shared/fixtures/*.json` and the contract in [AGENTS.md](../AGENTS.md). The mock predates the locked Netflix decision, so its example markets are the wrong ones — ignore them.

**The market selection.** Locked separately: Netflix #1 US show, live + replay. See the fixtures.

## Design rules an agent should follow

1. **One accent per state, not per element.** Blue is the market, ochre is the crowd. Crimson means flagged, green means aligned. Nothing else gets a color.
2. **Numbers are monospace and tabular.** Every odds figure, score, and timestamp. Columns of digits must line up.
3. **The explanation is body copy, not a tooltip.** It's the product. Give it room and a readable measure.
4. **The counterargument always renders.** Visually recessed, never omitted. It's what makes this read as an analyst rather than a hype machine.
5. **Replay only appears on resolved markets.** On unresolved ones show the locked state — that's honest, and it's already built.
6. **Both themes or neither.** Every color comes from a token. Never hardcode a hex in a component.

## Note on the P4 scaffold prompt

The scaffold ticket says "dark theme, one accent color, big typography." This mock is light-first with a dark mode and two series colors, because the product's core graphic is two lines that must stay distinguishable. **Use the mock.** If the scaffold already shipped dark-only, keep it — the tokens support both, so it's a variable swap, not a rewrite.
