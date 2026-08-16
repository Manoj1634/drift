"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkline } from "@/components/Sparkline";
import BetDesk from "@/components/BetDesk";
import type { FeedPayload, FeedRow } from "@/lib/feed";

type View = "feed" | "watching" | "detail" | "positions";
type Tag = "all" | "netflix" | "live" | "flagged";
type PaperPos = {
  title: string;
  entry: string;
  now: string;
  stake: string;
  change: string;
};

const WATCH_KEY = "drift-watching";

function pctInt(v: number) {
  return `${Math.round(v)}%`;
}

function initials(name: string) {
  const parts = name
    .replace(/[^A-Za-z0-9 ]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const a = parts[0]?.[0] ?? "?";
  const b = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
  return (a + b).toUpperCase();
}

function gapCta(row: FeedRow, scouting: boolean) {
  if (scouting) return "scouting X…";
  if (!row.scored) return "Scout X";
  const m = row.market[row.market.length - 1] ?? 0;
  const e = row.evidence[row.evidence.length - 1] ?? 0;
  const d = Math.round(e - m);
  if (d > 0) return `+${d}`;
  if (d < 0) return `${d}`;
  return `gap ${row.score}`;
}

function isNetflix(row: FeedRow) {
  return row.featured || /netflix/i.test(row.q) || /netflix/i.test(row.feedTitle);
}

function MarketCard({
  row,
  scouting,
  onClick,
}: {
  row: FeedRow;
  scouting: boolean;
  onClick: () => void;
}) {
  const ranks = row.ranks.slice(0, 2);
  const cta = gapCta(row, scouting);
  const upto = row.flagAt != null ? row.flagAt + 1 : row.market.length;
  const sparkM = row.market.slice(0, Math.max(2, upto));
  const sparkE = row.evidence.slice(0, Math.max(2, upto));
  return (
    <button
      type="button"
      className={`mk-card${scouting ? " scout" : ""}`}
      onClick={onClick}
    >
      <div className="mk-head">
        <span className="mk-thumb" aria-hidden="true">
          {initials(row.focus)}
        </span>
        <span className="mk-title">{row.q}</span>
      </div>
      {ranks.map(([name, p]) => (
        <div className="mk-out" key={name}>
          <span className="mk-out-n">{name}</span>
          <span className="mk-out-p">{pctInt(p)}</span>
        </div>
      ))}
      <div className="mk-gap">
        <Sparkline market={sparkM} evidence={sparkE} />
        <span className="mk-cta">{cta}</span>
      </div>
      <div className="mk-foot">
        <span>{row.vol !== "—" ? `${row.vol} Vol.` : ""}</span>
      </div>
    </button>
  );
}

function GhostCard({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="mk-card ghost" onClick={onClick}>
      <div className="mk-head">
        <span className="mk-thumb" aria-hidden="true">
          +
        </span>
        <span className="mk-title mute">Watch a market</span>
      </div>
      <div className="mk-ghost-lines">
        <i />
        <i />
      </div>
      <div className="mk-foot">
        <span>Paper only</span>
        <span className="mk-cta">Empty</span>
      </div>
    </button>
  );
}

export default function DriftShell({
  initial,
  initialSlug,
}: {
  initial: FeedPayload;
  initialSlug?: string;
}) {
  const [rows, setRows] = useState(initial.rows);
  const [view, setView] = useState<View>(initialSlug ? "detail" : "feed");
  const [tag, setTag] = useState<Tag>("all");
  const [curId, setCurId] = useState(initialSlug ?? null);
  const [watchOpen, setWatchOpen] = useState(false);
  const [watchQ, setWatchQ] = useState("");
  const [positions, setPositions] = useState<PaperPos[]>([]);
  const [watching, setWatching] = useState<string[] | null>(null);
  const [scouting, setScouting] = useState<Record<string, boolean>>({});
  const router = useRouter();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WATCH_KEY);
      if (!raw) {
        setWatching([]);
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      setWatching(Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : []);
    } catch {
      setWatching([]);
    }
  }, []);

  useEffect(() => {
    if (watching === null) return;
    localStorage.setItem(WATCH_KEY, JSON.stringify(watching));
  }, [watching]);

  const watched = watching ?? [];

  const cur = rows.find((r) => r.slug === curId || r.id === curId) ?? null;
  const flaggedCount = rows.filter((r) => r.tone === "flag").length;

  const suggested = useMemo(() => {
    return rows.filter((m) => {
      if (m.slug.startsWith("watch-")) return false;
      if (tag === "netflix") return isNetflix(m);
      if (tag === "live") return !isNetflix(m);
      if (tag === "flagged") return m.tone === "flag";
      return true;
    });
  }, [rows, tag]);

  const watchedRows = useMemo(() => {
    const set = new Set(watched);
    return rows.filter((m) => set.has(m.slug) || m.slug.startsWith("watch-"));
  }, [rows, watched]);

  const openDetail = useCallback(async (row: FeedRow) => {
    setCurId(row.slug);
    setView("detail");
    window.scrollTo(0, 0);
    if (row.scored) return;
    try {
      const res = await fetch(`/api/investigate?slug=${encodeURIComponent(row.slug)}`);
      const next = (await res.json()) as FeedRow;
      if (next?.slug) {
        setRows((prev) => prev.map((r) => (r.slug === next.slug ? next : r)));
      }
    } catch {
      /* keep row */
    }
  }, []);

  const openInvestigation = useCallback(
    (row: FeedRow) => {
      if (row.slug.startsWith("watch-")) {
        void openDetail(row);
        return;
      }
      router.push(`/market/${encodeURIComponent(row.slug)}`);
    },
    [openDetail, router],
  );

  const scoutAndWatch = useCallback(
    async (row: FeedRow) => {
      const already = watched.includes(row.slug);
      if (already && !scouting[row.slug]) {
        openInvestigation(row);
        return;
      }
      setWatching((prev) => {
        const cur = prev ?? [];
        return cur.includes(row.slug) ? cur : [...cur, row.slug];
      });
      if (row.slug.startsWith("watch-") || scouting[row.slug]) return;
      setScouting((s) => ({ ...s, [row.slug]: true }));
      try {
        const res = await fetch(`/api/investigate?slug=${encodeURIComponent(row.slug)}`);
        const next = (await res.json()) as FeedRow;
        if (next?.slug) {
          setRows((prev) => prev.map((r) => (r.slug === next.slug ? { ...next, featured: r.featured } : r)));
        }
      } finally {
        setScouting((s) => ({ ...s, [row.slug]: false }));
      }
    },
    [watched, scouting, openInvestigation],
  );

  useEffect(() => {
    if (!initialSlug) return;
    const row = initial.rows.find((r) => r.slug === initialSlug);
    if (row && !row.scored) void openDetail(row);
  }, [initialSlug, initial.rows, openDetail]);

  function go(v: View) {
    setView(v);
    window.scrollTo(0, 0);
  }

  function addWatch() {
    const q = watchQ.trim();
    if (!q) return;
    const slug = `watch-${Date.now()}`;
    const flat = Array.from({ length: 15 }, () => 50);
    const row: FeedRow = {
      id: slug,
      slug,
      venue: "Watching · no market yet",
      vol: "—",
      q,
      feedTitle: q,
      focus: q,
      blurb: "Pinned.",
      market: flat,
      evidence: flat,
      times: Array.from({ length: 15 }, () => "—"),
      xTicks: [
        [0, "—"],
        [14, "—"],
      ],
      score: 0,
      confidence: 0,
      side: "WATCH",
      verdict: "Watching",
      tone: "mute",
      flagAt: null,
      ranks: [[q, 50]],
      explain:
        "This topic is watched, not scored. Add a Polymarket market and an evidence window before Drift will take a side.",
      reasons: ["No CLOB price yet.", "No evidence window yet."],
      counter: "A watched topic with no market is a reminder, not a signal.",
      sources: [],
      outcomes: [[q, "—"]],
      replay: null,
      agents: {
        market: "none",
        evidence: "none",
        correlator: "none",
        investigator: "none",
      },
      scored: true,
      featured: false,
      hint: "Watched",
    };
    setRows((prev) => [...prev, row]);
    setWatching((prev) => [...(prev ?? []), slug]);
    setWatchOpen(false);
    setWatchQ("");
    go("watching");
  }

  const cats: { id: Tag; label: string }[] = [
    { id: "all", label: "All" },
    { id: "netflix", label: "Netflix" },
    { id: "live", label: "Live" },
    { id: "flagged", label: "Flagged" },
  ];

  return (
    <div className="app">
      <aside className="rail">
        <div className="mark">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <path
              d="M2 11 C 7 11, 8 11, 11 11 C 14 11, 15 5, 20 4"
              fill="none"
              stroke="var(--evidence)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M2 11 C 7 11, 8 11, 11 11 C 14 11, 15 16, 20 18"
              fill="none"
              stroke="var(--market)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="mark-name">Drift</span>
        </div>
        <nav className="nav">
          <div className="nav-h">Workspace</div>
          <button
            type="button"
            aria-current={view === "feed" || view === "detail" ? "true" : undefined}
            onClick={() => go("feed")}
          >
            Suggested{" "}
            <span className={`count${flaggedCount ? " hot" : ""}`}>{suggested.length}</span>
          </button>
          <button
            type="button"
            aria-current={view === "watching" ? "true" : undefined}
            onClick={() => go("watching")}
          >
            Watching <span className="count">{watchedRows.length}</span>
          </button>
          <button
            type="button"
            aria-current={view === "positions" ? "true" : undefined}
            onClick={() => go("positions")}
          >
            Active bets <span className="count">{positions.length}</span>
          </button>
          <button type="button" onClick={() => setWatchOpen(true)}>
            + Watch topic
          </button>
          <Link href="/">Signal feed</Link>
        </nav>
        <div className="rail-foot">
          <div className="bal-l">Paper balance</div>
          <div className="bal-v">$1,000.00</div>
          <div className="bal-d">Paper only</div>
        </div>
      </aside>
      <main className="main dash">
        <div className="view" hidden={view !== "feed"}>
          <div className="cats">
            {cats.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={tag === c.id}
                onClick={() => setTag(c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>
          <p className="sec-label">Active bets</p>
          <div className="mk-grid">
            {positions.length === 0 ? (
              <>
                <GhostCard onClick={() => setWatchOpen(true)} />
                <GhostCard onClick={() => setWatchOpen(true)} />
                <GhostCard onClick={() => setWatchOpen(true)} />
              </>
            ) : (
              positions.map((p) => (
                <div className="mk-card static" key={p.title + p.entry}>
                  <div className="mk-head">
                    <span className="mk-thumb" aria-hidden="true">
                      P
                    </span>
                    <span className="mk-title">{p.title}</span>
                  </div>
                  <div className="mk-out">
                    <span className="mk-out-n">Entry {p.entry}</span>
                    <span className="mk-out-p">{p.now}</span>
                  </div>
                  <div className="mk-foot">
                    <span>{p.stake} paper</span>
                    <span className="mk-cta">{p.change}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <p className="sec-label">Suggested</p>
          <div className="mk-grid">
            {suggested.map((m) => (
              <MarketCard
                key={m.id}
                row={m}
                scouting={!!scouting[m.slug]}
                onClick={() => void scoutAndWatch(m)}
              />
            ))}
          </div>
          <p className="foot">
            Paper only. Not financial advice. No real trades. No claim of market manipulation.
          </p>
        </div>

        <div className="view" hidden={view !== "watching"}>
          <p className="sec-label">Watching</p>
          {watchedRows.length === 0 ? (
            <p className="empty-note">Click a suggested market to scout X and pin it here.</p>
          ) : (
            <div className="mk-grid">
              {watchedRows.map((m) => (
                <MarketCard
                  key={m.id}
                  row={m}
                  scouting={!!scouting[m.slug]}
                  onClick={() => {
                    if (scouting[m.slug]) return;
                    openInvestigation(m);
                  }}
                />
              ))}
            </div>
          )}
          <p className="foot">
            Paper only. Not financial advice. No real trades. No claim of market manipulation.
          </p>
        </div>

        <div className="view" hidden={view !== "detail"}>
          <button className="back" type="button" onClick={() => go("feed")}>
            ← Suggested
          </button>
          {cur ? (
            <BetDesk
              title={cur.q}
              venue={cur.venue}
              volumeLabel={cur.vol}
              marketSeries={cur.market}
              evidenceSeries={cur.evidence}
              labels={cur.xTicks}
              outcomes={cur.outcomes.map(([label, odds]) => ({ label, odds }))}
            />
          ) : (
            <p className="lede">Pick a market from the feed.</p>
          )}
        </div>

        <div className="view" hidden={view !== "positions"}>
          <p className="sec-label">Active bets</p>
          <div className="mk-grid">
            {positions.length === 0 ? (
              <>
                <GhostCard onClick={() => go("feed")} />
                <GhostCard onClick={() => go("feed")} />
                <GhostCard onClick={() => go("feed")} />
              </>
            ) : (
              positions.map((p) => (
                <div className="mk-card static" key={p.title + p.entry}>
                  <div className="mk-head">
                    <span className="mk-thumb" aria-hidden="true">
                      P
                    </span>
                    <span className="mk-title">{p.title}</span>
                  </div>
                  <div className="mk-out">
                    <span className="mk-out-n">Entry {p.entry}</span>
                    <span className="mk-out-p">{p.now}</span>
                  </div>
                  <div className="mk-foot">
                    <span>{p.stake} paper</span>
                    <span className="mk-cta">{p.change}</span>
                  </div>
                </div>
              ))
            )}
          </div>
          <p className="foot">
            Paper positions are local. Drift does not execute trades.
          </p>
        </div>
      </main>

      <div
        className="modal"
        hidden={!watchOpen}
        onClick={(ev) => {
          if (ev.target === ev.currentTarget) setWatchOpen(false);
        }}
      >
        <div className="card modal-card" role="dialog" aria-labelledby="watch-title">
          <p className="eyebrow">Watchlist</p>
          <h2 id="watch-title">Watch a topic</h2>
          <p className="lede">Pin a show. Not a watchlist product.</p>
          <label htmlFor="watch-input">Show or topic</label>
          <input
            id="watch-input"
            type="text"
            placeholder="e.g. Tires: Season 3"
            value={watchQ}
            onChange={(e) => setWatchQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addWatch();
              if (e.key === "Escape") setWatchOpen(false);
            }}
          />
          <div className="modal-actions">
            <button className="btn ghost" type="button" onClick={() => setWatchOpen(false)}>
              Cancel
            </button>
            <button className="btn" type="button" onClick={addWatch}>
              Watch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
