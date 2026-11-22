import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError, getAdminFromRequest } from "@/lib/server/auth";
import {
  getDbHeroSlides,
  createDbHeroSlide,
  updateDbHeroSlide,
  deleteDbHeroSlide,
} from "@/lib/server/db";
import { HeroSlideCard } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/hero-slides
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminFromRequest(req);
    try {
      const list = await getDbHeroSlides();
      const filteredList = admin ? list : list.filter((s) => s.isActive !== false);
      return NextResponse.json({
        success: true,
        source: "postgresql",
        count: filteredList.length,
        data: filteredList,
      });
    } catch (dbErr: any) {
      console.warn("[API GET /api/hero-slides] PostgreSQL offline:", dbErr?.message || "DB unreachable");
      return NextResponse.json({
        success: true,
        source: "empty-fallback",
        count: 0,
        data: [],
      });
    }
  } catch (error: any) {
    console.error("[API GET /api/hero-slides] Fatal error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch hero slides." }, { status: 500 });
  }
}

// POST /api/hero-slides
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const slide: HeroSlideCard = await req.json();
    if (!slide.id || !slide.headline || !slide.tabLabel) {
      return NextResponse.json(
        { success: false, error: "Missing required hero slide fields." },
        { status: 400 }
      );
    }
    const created = await createDbHeroSlide(slide);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error("[API POST /api/hero-slides] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create hero slide." }, { status: 500 });
  }
}

// PATCH /api/hero-slides
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: "Hero slide id is required." }, { status: 400 });
    }
    const updated = await updateDbHeroSlide(id, updates);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("[API PATCH /api/hero-slides] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update hero slide." }, { status: 500 });
  }
}

// DELETE /api/hero-slides
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Hero slide id is required." }, { status: 400 });
    }
    const deleted = await deleteDbHeroSlide(id);
    return NextResponse.json({ success: true, deleted });
  } catch (error: any) {
    console.error("[API DELETE /api/hero-slides] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete hero slide." }, { status: 500 });
  }
}

