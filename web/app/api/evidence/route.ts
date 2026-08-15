import { NextRequest, NextResponse } from "next/server";
import { getEvidence } from "@/lib/evidence";

function defaultWindowStart(windowEnd: string): string {
  const end = Date.parse(windowEnd);
  if (!Number.isFinite(end)) return new Date(Date.now() - 3 * 864e5).toISOString();
  return new Date(end - 3 * 864e5).toISOString();
}

export async function GET(req: NextRequest) {
  const show = req.nextUrl.searchParams.get("show");
  const windowEnd = req.nextUrl.searchParams.get("windowEnd");
  const windowStart =
    req.nextUrl.searchParams.get("windowStart") ??
    (windowEnd ? defaultWindowStart(windowEnd) : undefined);

  if (!show || !windowEnd || !windowStart) {
    return NextResponse.json(
      { error: "show and windowEnd required (windowStart optional)" },
      { status: 400 },
    );
  }

  const evidence = await getEvidence(show, windowStart, windowEnd);
  return NextResponse.json(evidence);
}
