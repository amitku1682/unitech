import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import { scrapeGoogleReviews } from "@/lib/server/googleReviewsScraper";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const result = await scrapeGoogleReviews();
    return NextResponse.json({
      success: true,
      source: result.source,
      count: result.reviews.length,
      data: result.reviews,
    });
  } catch (error: any) {
    console.error("[API GET /api/reviews/fetch-google] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch Google reviews." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}

