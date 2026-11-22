import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import { getDbSearchInsights } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(req.url);
    const daysParam = searchParams.get("days");
    const days = daysParam === "30" ? 30 : 7;

    const insights = await getDbSearchInsights(days);
    return NextResponse.json({
      success: true,
      data: insights,
    });
  } catch (error: any) {
    console.error("[API GET /api/admin/search/insights] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch search insights." },
      { status: 500 }
    );
  }
}
