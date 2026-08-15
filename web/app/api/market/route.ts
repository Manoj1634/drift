import { NextRequest, NextResponse } from "next/server";
import { getMarket } from "@/lib/market";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  const asOf = req.nextUrl.searchParams.get("asOf") ?? undefined;
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }
  const market = await getMarket(slug, asOf);
  return NextResponse.json(market);
}
