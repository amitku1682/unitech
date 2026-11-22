import { NextRequest, NextResponse } from "next/server";
import { getDbHomepageCategories } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("all") === "true";

    try {
      const cards = await getDbHomepageCategories();
      const filtered = includeInactive ? cards : cards.filter((c) => c.isVisible);
      return NextResponse.json({
        success: true,
        source: "postgresql",
        count: filtered.length,
        data: filtered,
      });
    } catch (dbErr: any) {
      console.warn(
        "[API GET /api/homepage-categories] DB error:",
        dbErr?.message || "unreachable"
      );
      return NextResponse.json({
        success: true,
        source: "empty",
        count: 0,
        data: [],
      });
    }
  } catch (error: any) {
    console.error("[API GET /api/homepage-categories] Fatal error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch homepage categories." }, { status: 500 });
  }
}
