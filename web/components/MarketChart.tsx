import type { PricePoint } from "../../shared/types/contract";

type Props = {
  history: PricePoint[];
  cutoff?: string;
  revealAfterCutoff?: boolean;
};

function xOf(t: string, t0: number, t1: number, w: number, pad: number) {
  const span = t1 - t0 || 1;
  return pad + ((Date.parse(t) - t0) / span) * (w - pad * 2);
}

function yOf(p: number, h: number, pad: number) {
  return h - pad - p * (h - pad * 2);
}

function pct(p: number) {
  return `${Math.round(p * 100)}%`;
}

export function MarketChart({
  history,
  cutoff,
  revealAfterCutoff = true,
}: Props) {
  if (history.length === 0) {
    return (
      <div className="grid h-40 place-items-center rounded-xl bg-[#111] text-sm text-[#8b8b8b]">
        No history
      </div>
    );
  }

  const w = 640;
  const h = 220;
  const pad = 36;
  const t0 = Date.parse(history[0].t);
  const t1 = Date.parse(history[history.length - 1].t);
  const cutoffMs = cutoff ? Date.parse(cutoff) : null;

  const before = cutoffMs
    ? history.filter((pt) => Date.parse(pt.t) <= cutoffMs)
    : history;
  const after = cutoffMs
    ? history.filter((pt) => Date.parse(pt.t) > cutoffMs)
    : [];

  const toPoints = (pts: PricePoint[]) =>
    pts
      .map((pt, i) => {
        const x = xOf(pt.t, t0, t1, w, pad);
        const y = yOf(pt.p, h, pad);
        return `${i === 0 ? "M" : "L"}${x},${y}`;
      })
      .join(" ");

  const start = history[0];
  const end = history[history.length - 1];
  const atCut = before[before.length - 1] ?? start;

  const cutX =
    cutoffMs != null ? xOf(new Date(cutoffMs).toISOString(), t0, t1, w, pad) : null;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-[220px] w-full rounded-xl bg-[#111]">
      {cutX != null ? (
        <>
          <line
            x1={cutX}
            x2={cutX}
            y1={pad - 8}
            y2={h - pad}
            stroke="#8b8b8b"
            strokeDasharray="4 4"
          />
          <text x={cutX + 6} y={18} fill="#8b8b8b" fontSize="10">
            Water Cooler flag — Aug 6, 12:00 UTC
          </text>
        </>
      ) : null}
      <path d={toPoints(before)} fill="none" stroke="#2E6CFF" strokeWidth="2.25" />
      {revealAfterCutoff && after.length > 0 ? (
        <path
          d={toPoints(
            before.length ? [before[before.length - 1], ...after] : after,
          )}
          fill="none"
          stroke="#2E6CFF"
          strokeWidth="2.25"
          opacity="0.45"
        />
      ) : null}
      <text x={pad} y={h - 8} fill="#f5f5f5" fontSize="12" fontWeight="600">
        {pct(start.p)}
      </text>
      {atCut ? (
        <text x={w / 2 - 16} y={h - 8} fill="#f5f5f5" fontSize="12" fontWeight="600">
          {pct(atCut.p)}
        </text>
      ) : null}
      <text x={w - pad - 28} y={h - 8} fill="#f5f5f5" fontSize="12" fontWeight="600">
        {pct(end.p)}
      </text>
    </svg>
  );
}
