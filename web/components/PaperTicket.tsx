"use client";

import { useState } from "react";

const STAKE = 100;

type Outcome = { label: string; odds: string; price: number };
type Side = "YES" | "NO" | "WATCH";

function paperReturn(price: number, stake = STAKE) {
  if (!Number.isFinite(price) || price <= 0) return null;
  return Math.round(stake / price);
}

function cents(price: number) {
  return `${Math.round(price * 100)}¢`;
}

function defaultIndex(side: Side, n: number) {
  if (side === "NO" && n > 1) return 1;
  return 0;
}

export default function PaperTicket({
  outcomes,
  suggestedSide = "WATCH",
  resolved,
}: {
  outcomes: Outcome[];
  suggestedSide?: Side;
  /** Resolved replay only — historical paper, not a live call. */
  resolved?: { winnerLabel: string; entryPrice: number };
}) {
  const [chosen, setChosen] = useState(() =>
    defaultIndex(suggestedSide, outcomes.length),
  );
  const [filled, setFilled] = useState(false);
  const pick = outcomes[chosen];
  const hypo = pick ? paperReturn(pick.price) : null;
  const won = Boolean(
    resolved && pick && pick.label === resolved.winnerLabel,
  );
  const settled =
    resolved && Number.isFinite(resolved.entryPrice) && resolved.entryPrice > 0
      ? won
        ? paperReturn(resolved.entryPrice)
        : 0
      : null;

  return (
    <section className="card ticket">
      <div className="ticket-main">
        <p className="eyebrow">Paper position · nothing is placed on-chain</p>
        <h2>Take a side</h2>
        <div className="outcomes">
          {outcomes.map((o, i) => (
            <button
              key={o.label}
              type="button"
              className="outcome"
              aria-pressed={i === chosen}
              onClick={() => {
                setChosen(i);
                setFilled(false);
              }}
            >
              {o.label} <span>{o.odds}</span>
            </button>
          ))}
        </div>
        {hypo != null && pick ? (
          <p className="ticket-hypo">
            If this side is right: ${STAKE} → ${hypo}
            <span className="mute">
              {" "}
              · paper only if {pick.label} at {cents(pick.price)} is correct ·
              not advice
            </span>
          </p>
        ) : null}
        {resolved && settled != null ? (
          <p className="ticket-hypo">
            Would have settled: ${settled}
            <span className="mute">
              {" "}
              · historical paper
              {won
                ? ` · $100 YES at ${cents(resolved.entryPrice)} resolved YES`
                : " · this side did not resolve"}{" "}
              · not a live prediction
            </span>
          </p>
        ) : null}
      </div>
      <div>
        <button
          className="btn"
          type="button"
          disabled={filled}
          onClick={() => setFilled(true)}
        >
          {filled ? "Position logged" : "Log paper position"}
        </button>
        <div className={`filled${filled ? " on" : ""}`}>
          <i className="dot" />
          <span>
            {filled
              ? `$100 on ${pick?.label} at ${pick?.odds} · paper only`
              : ""}
          </span>
        </div>
      </div>
    </section>
  );
}
