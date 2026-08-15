import Link from "next/link";

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-blue text-[11px] font-bold">
              W
            </span>
            <span className="text-[15px] font-semibold">Water Cooler</span>
          </Link>
          <span className="text-xs text-muted">Agent watch · mock</span>
        </div>
      </header>
      <div className="mx-auto max-w-[1100px] px-4 py-8">{children}</div>
    </div>
  );
}
