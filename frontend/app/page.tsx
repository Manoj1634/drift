import Link from "next/link";
import { MARKETS, suggestedMarkets } from "@/lib/markets";
import { Shell } from "./shell";

export default function Home() {
  const suggested = suggestedMarkets();

  return (
    <Shell>
      <h1 className="text-xl font-semibold">Watched markets</h1>
      <p className="mt-1 text-sm text-muted">
        Agents flag when odds and public evidence stop agreeing.
      </p>

      <h2 className="mt-8 text-sm font-medium text-muted">Suggested calls</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {suggested.map((m) => (
          <Link
            key={m.id}
            href={`/market/${m.id}`}
            className="rounded-xl border border-yes/30 bg-yes-bg p-4 hover:bg-[#1e4633]"
          >
            <div className="text-[11px] font-semibold uppercase tracking-wide text-yes">
              Call · {m.category}
            </div>
            <p className="mt-2 text-sm text-muted">{m.question}</p>
            <p className="mt-2 text-base font-semibold">
              {m.call?.side} {m.call?.contract} @ {m.call?.price}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#d8efe4]">{m.call?.why}</p>
          </Link>
        ))}
      </div>

      <h2 className="mt-10 text-sm font-medium text-muted">All bets</h2>
      <div className="mt-3 overflow-hidden rounded-xl border border-line">
        {MARKETS.map((m, i) => (
          <Link
            key={m.id}
            href={`/market/${m.id}`}
            className={`flex items-center gap-4 px-4 py-3 hover:bg-hover ${
              i !== MARKETS.length - 1 ? "border-b border-line" : ""
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{m.question}</div>
              <div className="text-xs text-muted">
                {m.category} · {m.volume} vol
              </div>
            </div>
            <div className="hidden text-right text-sm sm:block">
              <div>{m.favorite}</div>
              <div className="text-muted">{m.favoriteOdds}%</div>
            </div>
            {m.call ? (
              <span className="rounded-full bg-yes-bg px-2 py-0.5 text-[11px] font-medium text-yes">
                Call
              </span>
            ) : (
              <span className="text-[11px] text-muted">Aligned</span>
            )}
          </Link>
        ))}
      </div>
    </Shell>
  );
}
