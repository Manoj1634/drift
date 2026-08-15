import { NextRequest, NextResponse } from "next/server";
import type { Culture, Evidence, Market } from "../../../../shared/types/contract";
import { correlate, correlateForSlug } from "@/lib/correlator";
import { REPLAY_CUTOFF, REPLAY_SLUG } from "@/lib/market";

export const dynamic = "force-dynamic";

type Body = {
  market?: Market;
  evidence?: Evidence;
  culture?: Culture;
  asOf?: string;
  slug?: string;
  mode?: string;
};

export async function POST(req: NextRequest) {
  try {
    const mode = req.nextUrl.searchParams.get("mode");
    let body: Body = {};
    try {
      body = (await req.json()) as Body;
    } catch {
      body = {};
    }
    const asOf =
      body.asOf ??
      req.nextUrl.searchParams.get("asOf") ??
      (mode === "asof" || body.mode === "asof" ? REPLAY_CUTOFF : undefined);
    const slug =
      body.slug ?? req.nextUrl.searchParams.get("slug") ?? REPLAY_SLUG;

    if (!body.market || !body.evidence || !body.culture) {
      return NextResponse.json(await correlateForSlug(slug, asOf ?? undefined));
    }

    return NextResponse.json(
      await correlate(body.market, body.evidence, body.culture, asOf ?? undefined),
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "correlate failed",
      },
      { status: 200 },
    );
  }
}

/** P3 timeline loader may call GET /api/correlate?mode=asof */
export async function GET(req: NextRequest) {
  try {
    const mode = req.nextUrl.searchParams.get("mode");
    const slug = req.nextUrl.searchParams.get("slug") ?? REPLAY_SLUG;
    const asOf =
      req.nextUrl.searchParams.get("asOf") ??
      (mode === "asof" ? REPLAY_CUTOFF : undefined);
    return NextResponse.json(await correlateForSlug(slug, asOf ?? undefined));
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "correlate failed",
      },
      { status: 200 },
    );
  }
}
