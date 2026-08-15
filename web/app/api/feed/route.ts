import { NextResponse } from "next/server";
import { loadFeed } from "@/lib/feed";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const feed = await loadFeed();
    return NextResponse.json(feed);
  } catch (err) {
    return NextResponse.json(
      {
        rows: [],
        listed_at: new Date().toISOString(),
        error: err instanceof Error ? err.message : "feed failed",
      },
      { status: 200 },
    );
  }
}
