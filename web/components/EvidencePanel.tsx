import type { Evidence, EvidenceTrend } from "../../shared/types/contract";

type Props = {
  evidence: Evidence;
};

function trendGlyph(trend: EvidenceTrend) {
  if (trend === "rising") return "↑";
  if (trend === "falling") return "↓";
  return "→";
}

function trendColor(trend: EvidenceTrend) {
  if (trend === "rising") return "text-[#3dd68c]";
  if (trend === "falling") return "text-[#ff6b6b]";
  return "text-[#8b8b8b]";
}

function hasPlaceholder(evidence: Evidence): boolean {
  if (evidence.top_sources.some((s) => s.includes("PLACEHOLDER"))) return true;
  return evidence.snippets.some(
    (s) =>
      s.text.includes("PLACEHOLDER") ||
      s.source.includes("PLACEHOLDER") ||
      s.date.includes("PLACEHOLDER"),
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
    timeZoneName: "short",
  });
}

export function EvidencePanel({ evidence }: Props) {
  const showSnippets = evidence.snippets.length > 0 && !hasPlaceholder(evidence);
  const offline =
    evidence.source === "fixture" ||
    evidence.source === "grok_reasoning" ||
    !showSnippets;

  return (
    <section className="rounded-xl border border-[#2a2a2a] bg-[#111] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#8b8b8b]">
            External Evidence
          </div>
          <h3 className="mt-1 text-base font-medium">{evidence.show}</h3>
          <p className="mt-1 text-xs text-[#8b8b8b]">
            {formatDate(evidence.window_start)} → {formatDate(evidence.window_end)}
          </p>
        </div>
        <div className={`text-2xl font-semibold ${trendColor(evidence.trend)}`}>
          {trendGlyph(evidence.trend)}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-[#2a2a2a] bg-black/40 p-3">
          <div className="text-[11px] uppercase tracking-wide text-[#8b8b8b]">
            Social
          </div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">
            {evidence.social_score}
          </div>
        </div>
        <div className="rounded-lg border border-[#2a2a2a] bg-black/40 p-3">
          <div className="text-[11px] uppercase tracking-wide text-[#8b8b8b]">
            Web
          </div>
          <div className="mt-1 text-3xl font-semibold tabular-nums">
            {evidence.web_score}
          </div>
        </div>
      </div>

      {offline && (
        <p className="mt-3 text-xs text-[#8b8b8b]">
          {evidence.source === "grok_reasoning"
            ? "Evidence scores from Grok reasoning — live sources offline."
            : evidence.source === "fixture"
              ? "Showing cached evidence fixture."
              : "Scores only — snippet sources unavailable for this window."}
        </p>
      )}

      {showSnippets ? (
        <ul className="mt-4 space-y-3">
          {evidence.snippets.map((snippet, i) => (
            <li
              key={`${snippet.source}-${i}`}
              className="rounded-lg border border-[#2a2a2a] bg-black/30 p-3"
            >
              <p className="text-sm leading-relaxed text-[#ededed]">
                &ldquo;{snippet.text}&rdquo;
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#8b8b8b]">
                <span className="rounded bg-[#1a1a1a] px-2 py-0.5">
                  {snippet.source}
                </span>
                <time dateTime={snippet.date}>{formatDate(snippet.date)}</time>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export default EvidencePanel;
