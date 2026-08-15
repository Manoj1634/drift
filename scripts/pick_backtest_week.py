#!/usr/bin/env python3
"""Rank past #1-US-Netflix-Show weeks by how good a backtest they'd make.

A good backtest week is one where the market was *wrong for a while*: the show
that eventually won traded cheap early and only got repriced late. That gap is
exactly what Drift claims to detect, so it gives the demo a real divergence to
narrate instead of a market that was right the whole time.

Usage:  python3 scripts/pick_backtest_week.py
"""

import datetime
import json

import requests  # uses certifi; stdlib urllib fails SSL verify on this macOS python

GAMMA = "https://gamma-api.polymarket.com"
CLOB = "https://clob.polymarket.com"
SERIES_ID = 10772  # "#1 US Netflix Show", weekly
MIN_VOLUME = 90_000  # thin weeks have unreadable price history


def ts(iso):
    return int(datetime.datetime.fromisoformat(iso.replace("Z", "+00:00")).timestamp())


def get(url):
    try:
        r = requests.get(url, timeout=25, headers={"User-Agent": "drift-backtest/0.1"})
        r.raise_for_status()
        return r.json()
    except Exception as exc:
        print(f"  ! GET failed {url[:80]}: {exc}")
        return None


def real_markets(event):
    """Drop the unfilled 'Show A'..'Show G' placeholder slots."""
    out = []
    for m in event.get("markets", []):
        title = m.get("groupItemTitle") or ""
        if not title or (title.startswith("Show ") and len(title) == 6):
            continue
        out.append(m)
    return out


def final_price(market):
    try:
        return float(json.loads(market["outcomePrices"])[0])
    except Exception:
        return 0.0


def history(token, start, end):
    # NOTE: interval=max returns [] for closed markets. Explicit startTs/endTs
    # is the only way to read history off a resolved market.
    h = get(f"{CLOB}/prices-history?market={token}&startTs={start}&endTs={end}&fidelity=60")
    return [p["p"] for p in (h or {}).get("history", [])]


def main():
    events = get(f"{GAMMA}/events?series_id={SERIES_ID}&closed=true&limit=60") or []
    if not isinstance(events, list):
        events = events.get("data", [])

    candidates = [e for e in events if e.get("volume", 0) > MIN_VOLUME]
    print(f"{len(events)} closed weeks, {len(candidates)} above ${MIN_VOLUME:,} volume\n")

    ranked = []
    for e in sorted(candidates, key=lambda x: x["endDate"]):
        start, end = ts(e["startDate"]), ts(e["endDate"])
        markets = real_markets(e)
        if not markets:
            continue
        winner = max(markets, key=final_price)

        print(f"--- {e['endDate'][:10]}  vol=${round(e['volume']):,}  WINNER={winner['groupItemTitle'][:34]}")
        for m in markets:
            token = json.loads(m["clobTokenIds"])[0]
            prices = history(token, start, end)
            if not prices or max(prices) < 0.30:
                continue
            won = m is winner
            mark = ">" if won else " "
            print(
                f"    {mark} {m['groupItemTitle'][:30]:<32} "
                f"open={prices[0]:.2f} peak={max(prices):.2f} "
                f"low={min(prices):.2f} final={prices[-1]:.2f} n={len(prices)}"
            )
            if won:
                ranked.append(
                    {
                        "week_of": e["endDate"][:10],
                        "event_id": e["id"],
                        "slug": e["slug"],
                        "volume": round(e["volume"]),
                        "winner": m["groupItemTitle"],
                        "open": prices[0],
                        "final": prices[-1],
                        "swing": round(prices[-1] - prices[0], 3),
                    }
                )

    print("\n=== best backtest weeks (winner opened cheapest = biggest missed signal) ===")
    for r in sorted(ranked, key=lambda x: x["open"]):
        print(
            f"  {r['week_of']}  vol=${r['volume']:>8,}  {r['winner'][:32]:<34} "
            f"open={r['open']:.2f} -> final={r['final']:.2f}  (swing {r['swing']:+.2f})"
        )

    with open("shared/fixtures/backtest_candidates.json", "w") as f:
        json.dump(sorted(ranked, key=lambda x: x["open"]), f, indent=2)
    print("\nwrote shared/fixtures/backtest_candidates.json")


if __name__ == "__main__":
    main()
