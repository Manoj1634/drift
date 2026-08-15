"use client";

import { useState } from "react";

type Outcome = { label: string; odds: string };

export default function PaperTicket({ outcomes }: { outcomes: Outcome[] }) {
  const [chosen, setChosen] = useState(0);
  const [filled, setFilled] = useState(false);

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
              ? `$100 on ${outcomes[chosen]?.label} at ${outcomes[chosen]?.odds} · paper only`
              : ""}
          </span>
        </div>
      </div>
    </section>
  );
}
