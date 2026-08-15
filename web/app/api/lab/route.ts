import { NextRequest, NextResponse } from "next/server";
import { runLab } from "@/lib/lab";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("mode") === "replay" ? "replay" : "live";
  const result = await runLab(mode);
  return NextResponse.json(result);
}
