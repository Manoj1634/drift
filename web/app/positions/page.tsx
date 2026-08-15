import AppShell from "@/components/AppShell";
import Link from "next/link";
import { LIVE_SLUG, REPLAY_SLUG } from "@/lib/market";

export default function PositionsPage() {
  return (
    <AppShell flaggedCount={1} current="positions">
      <div className="view">
        <p className="eyebrow">Paper positions</p>
        <h1>Two open. Nothing real was placed.</h1>
        <p className="lede">
          Every position Drift logs is local. There is no wallet, no signing, and
          no order ever reaches an exchange.
        </p>
        <div className="card" style={{ marginTop: 24 }}>
          <div className="pos-head">
            <span>Position</span>
            <span className="hide-s">Entry</span>
            <span className="r hide-s">Now</span>
            <span className="r">Stake</span>
            <span className="r">Change</span>
          </div>
          <Link href={`/market/${REPLAY_SLUG}`} className="pos-row">
            <span>
              <span className="pos-t">Idaho Murders · YES</span>
              <span className="pos-x">Resolved week · paper only</span>
            </span>
            <span className="hide-s num">48¢</span>
            <span className="r hide-s num">99¢</span>
            <span className="r num">$100</span>
            <span className="r num" style={{ color: "var(--calm)" }}>
              +$106
            </span>
          </Link>
          <Link href={`/market/${LIVE_SLUG}`} className="pos-row">
            <span>
              <span className="pos-t">Walter Boys · WATCH</span>
              <span className="pos-x">Live week · no stake yet</span>
            </span>
            <span className="hide-s num">—</span>
            <span className="r hide-s num">—</span>
            <span className="r num">$0</span>
            <span className="r num">—</span>
          </Link>
        </div>
        <p className="foot">
          Paper positions are logged locally for demonstration. Drift does not
          execute trades.
        </p>
      </div>
    </AppShell>
  );
}
