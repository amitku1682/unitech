import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError, getAdminFromRequest } from "@/lib/server/auth";
import {
  getDbBanners,
  createDbBanner,
  updateDbBanner,
  deleteDbBanner,
} from "@/lib/server/db";
import { AnnouncementBanner } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/banners
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminFromRequest(req);
    try {
      const list = await getDbBanners();
      const filteredList = admin ? list : list.filter((b) => b.isActive !== false);
      return NextResponse.json({
        success: true,
        source: "postgresql",
        count: filteredList.length,
        data: filteredList,
      });
    } catch (dbErr: any) {
      console.warn("[API GET /api/banners] PostgreSQL offline:", dbErr?.message || "DB unreachable");
      return NextResponse.json({
        success: true,
        source: "empty-fallback",
        count: 0,
        data: [],
      });
    }
  } catch (error: any) {
    console.error("[API GET /api/banners] Fatal error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch banners." }, { status: 500 });
  }
}

// POST /api/banners
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const banner: AnnouncementBanner = await req.json();
    if (!banner.id || !banner.title || !banner.type) {
      return NextResponse.json(
        { success: false, error: "Missing required banner fields (id, title, type)." },
        { status: 400 }
      );
    }
    const created = await createDbBanner(banner);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error("[API POST /api/banners] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create banner." }, { status: 500 });
  }
}

// PATCH /api/banners
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: "Banner id is required." }, { status: 400 });
    }
    const updated = await updateDbBanner(id, updates);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("[API PATCH /api/banners] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update banner." }, { status: 500 });
  }
}

// DELETE /api/banners
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Banner id is required." }, { status: 400 });
    }
    const deleted = await deleteDbBanner(id);
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    console.error("[API DELETE /api/banners] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete banner." }, { status: 500 });
  }
}

