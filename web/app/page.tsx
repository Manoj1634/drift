import { MarketChart } from "@/components/MarketChart";
import { EvidencePanel } from "@/components/EvidencePanel";
import {
  LIVE_SLUG,
  REPLAY_CUTOFF,
  REPLAY_SLUG,
  getMarket,
} from "@/lib/market";
import {
  REPLAY_SHOW,
  REPLAY_WINDOW_END,
  REPLAY_WINDOW_START,
  getEvidence,
} from "@/lib/evidence";

function leading(odds: Record<string, number>) {
  return Object.entries(odds).sort((a, b) => b[1] - a[1])[0];
}

export default async function Feed() {
  const live = await getMarket(LIVE_SLUG);
  const replay = await getMarket(REPLAY_SLUG, REPLAY_CUTOFF);
  const replayEvidence = await getEvidence(
    REPLAY_SHOW,
    REPLAY_WINDOW_START,
    REPLAY_WINDOW_END,
  );
  const liveLead = leading(live.odds_by_outcome);
  const replayLead = leading(replay.odds_by_outcome);

  return (
    <main className="mx-auto max-w-3xl space-y-6 bg-black p-6 text-white">
      <h1 className="text-xl font-semibold">Signal Feed</h1>
      <p className="text-sm text-[#8b8b8b]">
        P1 Market Pulse · source {live.source}/{replay.source}
      </p>

      <article className="rounded-xl border border-[#2a2a2a] bg-[#111] p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#3dd68c]">
          Aligned
        </div>
        <h2 className="mt-1 text-lg font-medium">{live.title}</h2>
        {liveLead ? (
          <p className="mt-2 text-sm">
            {liveLead[0]} · {(liveLead[1] * 100).toFixed(1)}%
          </p>
        ) : null}
        <div className="mt-3">
          <MarketChart history={live.history} />
        </div>
      </article>

      <article className="rounded-xl border border-[#2a2a2a] bg-[#111] p-4">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#ff6b6b]">
          Replay · Aug 6 12:00 UTC
        </div>
        <h2 className="mt-1 text-lg font-medium">{replay.title}</h2>
        {replayLead ? (
          <p className="mt-2 text-sm">
            {replayLead[0]} · {(replayLead[1] * 100).toFixed(1)}% at cutoff
          </p>
        ) : null}
        <div className="mt-3">
          <MarketChart
            history={replay.history}
            cutoff={REPLAY_CUTOFF}
            revealAfterCutoff={false}
          />
        </div>
        <div className="mt-4">
          <EvidencePanel evidence={replayEvidence} />
        </div>
      </article>
    </main>
  );
}
