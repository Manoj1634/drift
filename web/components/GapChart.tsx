"use client";

/** Port of mock/app.js paint() — shaded gap between market % and evidence score. */
export function GapChart({
  market,
  evidence,
  flagAt,
  labels,
}: {
  market: number[];
  evidence: number[];
  flagAt?: number | null;
  labels?: Array<[number, string]>;
}) {
  const W = 760;
  const H = 240;
  const PL = 44;
  const PR = 54;
  const PT = 16;
  const PB = 28;
  const n = Math.max(market.length, evidence.length, 2);
  const X = (i: number) => PL + (i / Math.max(1, n - 1)) * (W - PL - PR);
  const Y = (v: number) => PT + (1 - v / 100) * (H - PT - PB);
  const lp = (a: number[]) =>
    a
      .map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`)
      .join(" ");
  let gap = lp(market) + " ";
  for (let j = evidence.length - 1; j >= 0; j--) {
    gap += `L${X(j).toFixed(1)} ${Y(evidence[j]).toFixed(1)} `;
  }
  gap += "Z";
  const endM = market[market.length - 1] ?? 0;
  const endE = evidence[evidence.length - 1] ?? 0;
  const fi = flagAt != null ? flagAt : null;

  return (
    <div className="chart-shell">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Market vs evidence">
        <g>
          {[0, 25, 50, 75, 100].map((v) => (
            <g key={v}>
              <line
                x1={PL}
                x2={W - PR}
                y1={Y(v)}
                y2={Y(v)}
                className="grid-line"
              />
              <text
                x={PL - 10}
                y={Y(v) + 3.5}
                className="axis-txt"
                textAnchor="end"
              >
                {v}
              </text>
            </g>
          ))}
          {(labels ?? []).map(([i, lab]) => (
            <text
              key={lab + i}
              x={X(i)}
              y={H - 7}
              className="axis-txt"
              textAnchor="middle"
            >
              {lab}
            </text>
          ))}
        </g>
        <path id="p-gap" d={gap} fill="var(--gap-fill)" />
        <path
          d={lp(market)}
          className="series-line"
          stroke="var(--market)"
        />
        <path
          d={lp(evidence)}
          className="series-line"
          stroke="var(--evidence)"
        />
        {fi != null && market[fi] != null ? (
          <g>
            <line
              x1={X(fi)}
              x2={X(fi)}
              y1={PT}
              y2={H - PB}
              stroke="var(--flag)"
              strokeDasharray="4 4"
              strokeWidth="1.5"
            />
            <circle
              cx={X(fi)}
              cy={Y(market[fi])}
              r="4"
              fill="var(--flag)"
            />
          </g>
        ) : null}
        <text
          x={W - PR + 6}
          y={Y(endM) + 4}
          className="end-label"
          fill="var(--market)"
        >
          {Math.round(endM)}%
        </text>
        <text
          x={W - PR + 6}
          y={Y(endE) + 4}
          className="end-label"
          fill="var(--evidence)"
        >
          {Math.round(endE)}
        </text>
      </svg>
      <div className="legend">
        <span>
          <i style={{ background: "var(--market)" }} />
          Market-implied probability <em>Polymarket</em>
        </span>
        <span>
          <i style={{ background: "var(--evidence)" }} />
          Public evidence score <em>Grok · X + web</em>
        </span>
        <span>
          <i className="sw-gap" />
          The gap Drift is scoring
        </span>
      </div>
    </div>
  );
}
