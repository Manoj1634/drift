/** Port of mock/app.js spark() — no chart library. */
export function Sparkline({
  market,
  evidence,
}: {
  market: number[];
  evidence: number[];
}) {
  const W = 120;
  const H = 38;
  const n = Math.max(market.length, evidence.length, 2);
  const m = market.length ? market : [0, 0];
  const e = evidence.length ? evidence : [0, 0];
  const all = [...m, ...e];
  let lo = Math.min(...all);
  let hi = Math.max(...all);
  const pad = Math.max(3, (hi - lo) * 0.12);
  lo -= pad;
  hi += pad;
  const X = (i: number) => (i / Math.max(1, n - 1)) * (W - 4) + 2;
  const Y = (v: number) => H - 4 - ((v - lo) / (hi - lo || 1)) * (H - 8);
  const d = (a: number[]) =>
    a
      .map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`)
      .join(" ");
  let area = d(m);
  for (let j = e.length - 1; j >= 0; j--) {
    area += `L${X(j).toFixed(1)} ${Y(e[j]).toFixed(1)} `;
  }
  return (
    <svg className="spark" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <path d={`${area}Z`} fill="var(--gap-fill)" />
      <path
        d={d(m)}
        fill="none"
        stroke="var(--market)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d={d(e)}
        fill="none"
        stroke="var(--evidence)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle
        cx={X(e.length - 1)}
        cy={Y(e[e.length - 1])}
        r="2.4"
        fill="var(--evidence)"
      />
      <circle
        cx={X(m.length - 1)}
        cy={Y(m[m.length - 1])}
        r="2.4"
        fill="var(--market)"
      />
    </svg>
  );
}
