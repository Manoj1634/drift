# Drift — 3-Minute Demo Script

**Hard cap: 3:00.** The submission form rejects longer. This script runs ~2:40 and leaves 20s of slack.

Record against the frozen snapshot in `fixtures/demo/`, not live APIs. You should be able to re-record five times and get the identical divergence every time.

## Goal

The judge should remember one moment:

> The market and the public evidence disagreed. Grok caught the gap, explained it, argued the other side, and the replay showed the same signal appearing before the answer was known.

---

## 0:00–0:20 — Problem

> Prediction markets tell you what people are willing to bet. The internet tells you what people are beginning to believe. Traders connect those by hand. Drift does it automatically.

Show the screen with the hero market already on it. Don't narrate the UI.

---

## 0:20–1:20 — The divergence, and Why

> Here's what the market is pricing. Here's what the public evidence says. Drift scores the gap.

Show: probability chart · divergence score · `HIGH DIVERGENCE`.

Click **Why?**

> Grok compares the signals — it isn't applying a hardcoded threshold. It says what agrees, what conflicts, and — this part matters — the strongest case that it's wrong.

Show: explanation · **counterargument** · sources with real snippets.

This is the wow moment. Get here by 0:30 or the video is mis-paced.

---

## 1:20–2:20 — Replay

Click **Replay Last Week**.

> A signal after the fact is easy. The real question is whether it showed up before the answer was obvious.

Scrub through: market odds flat → evidence strengthening → Drift flags → market reprices → official outcome.

Real historical values only. Never present a fabricated number as real.

---

## 2:20–2:40 — Close

> We demonstrated this vertical because it has a clean market, a live public conversation, and an official outcome to check against. The architecture is the same for sports, politics, anything with a market and a crowd.

> Drift doesn't promise a winning trade. It shows you when the market and the world are telling different stories — while that difference still exists.

---

## Cut from the 5-minute version

Kept out on purpose, not forgotten: the agent-status walkthrough ("Market Pulse reads Polymarket, Evidence Scout searches X..."), the standalone source-drawer segment, and per-agent signal narration. The architecture shows through the output. Narrating it costs 90 seconds and adds nothing a judge scores.

## Claims discipline

Say: divergence signal · evidence gap · potential mismatch.
Never say: guaranteed profit · manipulation detected · the market is wrong.
