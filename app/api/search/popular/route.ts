import { NextResponse } from "next/server";
import { getDbPopularSearchTerms } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    try {
      const list = await getDbPopularSearchTerms(true);
      return NextResponse.json(
        {
          success: true,
          data: list.map((item) => ({
            id: item.id,
            label: item.label,
            query: item.query,
            link_url: item.linkUrl,
            position: item.position,
          })),
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        }
      );
    } catch (dbErr: any) {
      console.warn("[API GET /api/search/popular] DB offline:", dbErr?.message);
      return NextResponse.json({
        success: true,
        source: "empty-fallback",
        data: [],
      });
    }
  } catch (error: any) {
    console.error("[API GET /api/search/popular] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch popular search terms." }, { status: 500 });
  }
}
