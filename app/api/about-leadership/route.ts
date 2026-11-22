import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import { getDbLeadership, saveDbLeadership } from "@/lib/server/db";
import { LeadershipDirector } from "@/lib/leadershipData";

export const dynamic = "force-dynamic";

// GET /api/about-leadership - Returns active executive leadership directly from PostgreSQL
export async function GET() {
  try {
    const data = await getDbLeadership();
    return NextResponse.json({ success: true, source: "postgresql", count: data.length, data });
  } catch (error: any) {
    console.error("[API GET /api/about-leadership] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch leadership team." }, { status: 500 });
  }
}

// POST /api/about-leadership - Admin only: Persist updated leadership roster directly to PostgreSQL
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ success: false, error: "Expected an array of directors" }, { status: 400 });
    }

    const saved = await saveDbLeadership(body as LeadershipDirector[]);
    return NextResponse.json({ success: true, source: "postgresql", data: saved });
  } catch (error: any) {
    console.error("[API POST /api/about-leadership] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update leadership team." }, { status: 500 });
  }
}
