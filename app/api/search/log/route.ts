import { NextRequest, NextResponse } from "next/server";
import { logDbSearchQuery } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const term = typeof body.term === "string" ? body.term.trim() : "";
    const resultsCount = typeof body.results_count === "number" ? body.results_count : 0;
    const source = typeof body.source === "string" ? body.source : "panel";

    if (term.length >= 2) {
      // Fire-and-forget DB logging
      logDbSearchQuery(term, resultsCount, source).catch((err) => {
        console.warn("[Search Log Error]:", err);
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
