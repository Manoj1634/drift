import Link from "next/link";

type Props = {
  children: React.ReactNode;
  flaggedCount?: number;
  current?: "feed" | "positions" | "dashboard";
};

export default function AppShell({
  children,
  flaggedCount = 1,
  current = "feed",
}: Props) {
  return (
    <div className="app">
      <aside className="rail">
        <div className="mark">
          <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
            <path
              d="M2 11 C 7 11, 8 11, 11 11 C 14 11, 15 5, 20 4"
              fill="none"
              stroke="var(--evidence)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M2 11 C 7 11, 8 11, 11 11 C 14 11, 15 16, 20 18"
              fill="none"
              stroke="var(--market)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <span className="mark-name">Drift</span>
        </div>
        <nav className="nav">
          <div className="nav-h">Workspace</div>
          <Link
            href="/"
            aria-current={current === "feed" ? "true" : undefined}
          >
            Signals{" "}
            <span className={`count${flaggedCount > 0 ? " hot" : ""}`}>
              {flaggedCount}
            </span>
          </Link>
          <Link
            href="/dashboard"
            aria-current={current === "dashboard" ? "true" : undefined}
          >
            Markets
          </Link>
          <Link
            href="/positions"
            aria-current={current === "positions" ? "true" : undefined}
          >
            Paper positions <span className="count">2</span>
          </Link>
        </nav>
        <div className="rail-foot">
          <div className="bal-l">Paper balance</div>
          <div className="bal-v">$1,052.00</div>
          <div className="bal-d">+$52.00 since open</div>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
