import { NextRequest, NextResponse } from "next/server";
import { investigateSlug } from "@/lib/feed";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug required" }, { status: 400 });
  }
  try {
    const row = await investigateSlug(slug);
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "investigate failed" },
      { status: 200 },
    );
  }
}
