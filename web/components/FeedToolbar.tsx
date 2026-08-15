"use client";

import Link from "next/link";
import { useMemo, useState, type KeyboardEvent } from "react";
import { Sparkline } from "@/components/Sparkline";

export type FeedCard = {
  href: string;
  feedTitle: string;
  blurb: string;
  venue: string;
  focus: string;
  vol: string;
  marketSeries: number[];
  evidenceSeries: number[];
  marketPct: number;
  evidenceScore: number;
  side: string;
  score: number;
  tone: "flag" | "calm";
  flagAt: number | null;
};

const FILTERS = [
  { id: "all", label: "All" },
  { id: "flag", label: "Diverged" },
  { id: "calm", label: "Aligned" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

function pct(v: number) {
  const p = Math.round(v * 1000) / 10;
  return `${p % 1 ? p.toFixed(1) : p}%`;
}

export default function FeedToolbar({
  cards,
  liveHint,
}: {
  cards: FeedCard[];
  liveHint: string;
}) {
  const [filter, setFilter] = useState<FilterId>("all");

  const shown = useMemo(() => {
    return cards.filter((c) => {
      if (filter === "all") return true;
      if (filter === "flag") return c.tone === "flag";
      return c.tone === "calm";
    });
  }, [cards, filter]);

  function moveFilter(next: FilterId, host: HTMLElement) {
    setFilter(next);
    const btn = host.querySelector<HTMLButtonElement>(`button[data-f="${next}"]`);
    btn?.focus();
  }

  function onSegKeyDown(ev: KeyboardEvent<HTMLDivElement>) {
    const i = FILTERS.findIndex((f) => f.id === filter);
    const host = ev.currentTarget;
    if (ev.key === "ArrowRight" || ev.key === "ArrowDown") {
      ev.preventDefault();
      moveFilter(FILTERS[(i + 1) % FILTERS.length].id, host);
    } else if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") {
      ev.preventDefault();
      moveFilter(FILTERS[(i - 1 + FILTERS.length) % FILTERS.length].id, host);
    } else if (ev.key === "Home") {
      ev.preventDefault();
      moveFilter("all", host);
    } else if (ev.key === "End") {
      ev.preventDefault();
      moveFilter("calm", host);
    }
  }

  return (
    <>
      <div className="toolbar">
        <div
          className="seg"
          role="group"
          aria-label="Filter signals"
          onKeyDown={onSegKeyDown}
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              data-f={f.id}
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="live">
          <i className="pulse" />
          {liveHint}
        </div>
      </div>
      <div className="card feed">
        <div className="feed-head">
          <span>Market</span>
          <span className="hide-s">Gap shape</span>
          <span className="r hide-s">Market</span>
          <span className="r hide-s">Evidence</span>
          <span className="r">Signal</span>
        </div>
        {shown.map((c) => {
          const sparkM =
            c.flagAt != null ? c.marketSeries.slice(0, c.flagAt + 1) : c.marketSeries;
          const sparkE =
            c.flagAt != null
              ? c.evidenceSeries.slice(0, c.flagAt + 1)
              : c.evidenceSeries;
          return (
            <Link key={c.href} href={c.href} className="row">
              <span className="q">
                <span className="q-t">{c.feedTitle}</span>
                <span className="q-x">{c.blurb}</span>
                <span className="q-m">
                  <span>{c.venue}</span>
                  <span>{c.focus}</span>
                  <span>Vol {c.vol}</span>
                  <span className="why-link">View Why</span>
                </span>
              </span>
              <span className="hide-s">
                <Sparkline market={sparkM} evidence={sparkE} />
              </span>
              <span className="num big r hide-s">{pct(c.marketPct / 100)}</span>
              <span className="num r hide-s">{c.evidenceScore}</span>
              <span className="r">
                <span className={`pill ${c.tone}`}>
                  <i className="dot" />
                  {c.side} · {c.score}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
