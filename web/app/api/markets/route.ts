import { NextResponse } from "next/server";
import { listMarkets } from "@/lib/market";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const markets = await listMarkets(16);
    return NextResponse.json({ source: "polymarket", markets });
  } catch (err) {
    return NextResponse.json(
      {
        source: "error",
        markets: [],
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }
}
