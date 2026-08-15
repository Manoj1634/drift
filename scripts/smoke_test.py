#!/usr/bin/env python3
"""Smoke-test all three Drift data sources and capture fixtures.

Run this before building anything. It answers the four questions that can kill
the demo, and writes one real response per source into shared/fixtures/ so
USE_DEMO_FIXTURES=true has something to fall back on.

  1. Does XAI_API_KEY work at all?
  2. Does x_search work on this key?  (funded-account gate)
  3. Does x_search work over a PAST date window?  (the backtest depends on it)
  4. Are Polymarket + Netflix reachable?

Usage:  python3 scripts/smoke_test.py
"""

import json
import os
import re
import pathlib
import sys

import requests

FIXTURES = pathlib.Path("shared/fixtures")
XAI_URL = "https://api.x.ai/v1/responses"
GAMMA = "https://gamma-api.polymarket.com"
CLOB = "https://clob.polymarket.com"
NETFLIX_TSV = "https://www.netflix.com/tudum/top10/data/all-weeks-countries.tsv"
UA = {"User-Agent": "drift-smoke/0.1"}

# The chosen backtest week: The Hawk went 0.14 -> 1.00 while the market had
# Little House on the Prairie at 0.82. See documentation/architecture/BACKTEST_WEEK.md
BACKTEST = {
    "event_id": "708398",
    "week_of": "2026-07-19",
    "winner": "The Hawk: Season 1",
    "false_favorite": "Little House on the Prairie: Season 1",
    "divergence_window": ("2026-07-17T00:00:00Z", "2026-07-19T00:00:00Z"),
}

results = []


def record(name, ok, detail):
    results.append((name, ok, detail))
    print(f"  [{'PASS' if ok else 'FAIL'}] {name}: {detail}")


def load_env():
    env = {}
    p = pathlib.Path(".env")
    if p.exists():
        for line in p.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip()
    # real env wins over .env
    for k in list(env):
        env[k] = os.environ.get(k, env[k])
    return env


def save(name, payload):
    FIXTURES.mkdir(parents=True, exist_ok=True)
    (FIXTURES / name).write_text(json.dumps(payload, indent=2))
    print(f"         -> shared/fixtures/{name}")


def xai_call(key, payload):
    r = requests.post(
        XAI_URL,
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        json=payload,
        timeout=180,
    )
    return r


def answer_text(body):
    out = ""
    for item in body.get("output", []) or []:
        if item.get("type") == "message":
            for c in item.get("content", []) or []:
                out += c.get("text") or ""
    return out


def tool_calls(body, tool):
    """How many times a server-side tool actually ran.

    Do NOT use usage.num_sources_used or body['citations'] - both come back 0/None
    even on successful searches. The authoritative counter is
    usage.server_side_tool_usage_details.<tool>_calls, and the citations
    themselves are inline markdown links in the message text.
    """
    details = (body.get("usage") or {}).get("server_side_tool_usage_details") or {}
    return details.get(f"{tool}_calls", 0)


def post_links(body):
    return len(set(re.findall(r"https://x\.com/\S+?/status/\d+", answer_text(body))))


def test_xai(env):
    print("\n== 1. xAI key ==")
    key = env.get("XAI_API_KEY", "")
    if not key:
        record("XAI_API_KEY present", False, "not set in .env or environment")
        return
    record("XAI_API_KEY present", True, f"len {len(key)}, prefix {key[:4]}…")

    # --- plain completion: is the key valid and funded at all?
    r = xai_call(key, {"model": "grok-4.6", "input": "Reply with exactly: OK"})
    if r.status_code != 200:
        record("plain completion", False, f"HTTP {r.status_code}: {r.text[:200]}")
        return
    record("plain completion", True, "grok-4.6 responded")

    # --- x_search live
    r = xai_call(
        key,
        {
            "model": "grok-4.6",
            "input": "What are people saying on X about Netflix's top show this week? Cite posts.",
            "tools": [{"type": "x_search"}],
        },
    )
    if r.status_code != 200:
        record("x_search (live)", False, f"HTTP {r.status_code}: {r.text[:300]}")
    else:
        body = r.json()
        n, links = tool_calls(body, "x_search"), post_links(body)
        record("x_search (live)", n > 0, f"{n} search calls, {links} post links cited")
        save("grok_x_search_live.json", body)

    # --- x_search over the backtest window: THE critical one
    start, end = BACKTEST["divergence_window"]
    r = xai_call(
        key,
        {
            "model": "grok-4.6",
            "input": (
                f"What were people on X saying about the Netflix show "
                f"\"{BACKTEST['winner']}\" between {start} and {end}? Cite posts."
            ),
            "tools": [{"type": "x_search", "from_date": start, "to_date": end}],
        },
    )
    if r.status_code != 200:
        record("x_search (backtest window)", False, f"HTTP {r.status_code}: {r.text[:300]}")
    else:
        body = r.json()
        n, links = tool_calls(body, "x_search"), post_links(body)
        record("x_search (backtest window)", n > 0 and links > 0,
               f"{n} search calls, {links} post links from {start[:10]}..{end[:10]}")
        save("grok_x_search_backtest.json", body)

    # --- web_search fallback
    r = xai_call(
        key,
        {
            "model": "grok-4.6",
            "input": "What was the #1 show on Netflix in the US the week of July 19, 2026?",
            "tools": [{"type": "web_search"}],
        },
    )
    if r.status_code != 200:
        record("web_search (fallback)", False, f"HTTP {r.status_code}: {r.text[:200]}")
    else:
        body = r.json()
        record("web_search (fallback)", tool_calls(body, "web_search") > 0,
               f"{tool_calls(body, 'web_search')} search calls")
        save("grok_web_search.json", body)


def test_polymarket():
    print("\n== 2. Polymarket ==")
    r = requests.get(f"{GAMMA}/events/{BACKTEST['event_id']}", headers=UA, timeout=25)
    if r.status_code != 200:
        record("gamma event", False, f"HTTP {r.status_code}")
        return
    event = r.json()
    record("gamma event", True, f"{event['title']} ({len(event['markets'])} markets)")
    save("polymarket_backtest_event.json", event)

    token = None
    for m in event["markets"]:
        if BACKTEST["winner"].split(":")[0] in (m.get("groupItemTitle") or ""):
            token = json.loads(m["clobTokenIds"])[0]
    if not token:
        record("clob price history", False, "winner token not found")
        return

    # interval=max returns [] on closed markets - explicit window is required.
    import datetime

    def ts(s):
        return int(datetime.datetime.fromisoformat(s.replace("Z", "+00:00")).timestamp())

    start, end = ts(event["startDate"]), ts(event["endDate"])
    r = requests.get(
        f"{CLOB}/prices-history?market={token}&startTs={start}&endTs={end}&fidelity=60",
        headers=UA,
        timeout=25,
    )
    hist = r.json().get("history", [])
    record("clob price history", len(hist) > 0, f"{len(hist)} points for {BACKTEST['winner']}")
    save("polymarket_backtest_prices.json", {"token_id": token, "history": hist})


def test_netflix():
    print("\n== 3. Netflix Top 10 ==")
    r = requests.get(NETFLIX_TSV, headers=UA, timeout=90)
    if r.status_code != 200:
        record("tudum tsv", False, f"HTTP {r.status_code}")
        return
    lines = r.text.splitlines()
    header = lines[0].split("\t")
    rows = []
    for line in lines[1:]:
        f = line.split("\t")
        if len(f) == len(header) and f[0] == "United States" and f[3] == "TV":
            rows.append(dict(zip(header, f)))
    week = [x for x in rows if x["week"] == BACKTEST["week_of"]]
    week.sort(key=lambda x: int(x["weekly_rank"]))
    ok = bool(week) and week[0]["season_title"] == BACKTEST["winner"]
    record(
        "tudum tsv",
        ok,
        f"{len(rows)} US TV rows; #1 for {BACKTEST['week_of']} = {week[0]['season_title'] if week else 'n/a'}",
    )
    save(
        "netflix_backtest_top10.json",
        {
            "week_of": BACKTEST["week_of"],
            "source": "netflix_tudum",
            "official_rank": [x["season_title"] for x in week],
        },
    )


def main():
    env = load_env()
    test_xai(env)
    test_polymarket()
    test_netflix()

    print("\n" + "=" * 62)
    failed = [n for n, ok, _ in results if not ok]
    for name, ok, detail in results:
        print(f"  {'PASS' if ok else 'FAIL'}  {name}")
    if failed:
        print(f"\n{len(failed)} FAILED: {', '.join(failed)}")
        sys.exit(1)
    print("\nAll sources live. Fixtures captured in shared/fixtures/.")


if __name__ == "__main__":
    main()
