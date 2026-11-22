import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError, getAdminFromRequest } from "@/lib/server/auth";
import {
  getDbDealers,
  createDbDealer,
  updateDbDealer,
  deleteDbDealer,
} from "@/lib/server/db";
import { DealerHub } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/dealers - PostgreSQL driven
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminFromRequest(req);
    try {
      const list = await getDbDealers();
      const filteredList = admin ? list : list.filter((d) => d.isActive !== false);
      return NextResponse.json({
        success: true,
        source: "postgresql",
        count: filteredList.length,
        data: filteredList,
      });
    } catch (dbErr: any) {
      console.warn("[API GET /api/dealers] PostgreSQL offline:", dbErr?.message || "DB unreachable");
      return NextResponse.json({
        success: true,
        source: "empty-fallback",
        count: 0,
        data: [],
      });
    }
  } catch (error: any) {
    console.error("[API GET /api/dealers] Fatal error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch dealers." }, { status: 500 });
  }
}

// POST /api/dealers - Create a new dealer hub in PostgreSQL
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const body: DealerHub = await req.json();
    if (!body.state || !body.city || !body.contact) {
      return NextResponse.json(
        { success: false, error: "Missing required dealer fields (state, city, contact)." },
        { status: 400 }
      );
    }
    const created = await createDbDealer(body);
    return NextResponse.json({ success: true, source: "postgresql", data: created });
  } catch (error: any) {
    console.error("[API POST /api/dealers] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create dealer." }, { status: 500 });
  }
}

// PUT /api/dealers - Update or toggle an existing dealer hub in PostgreSQL
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const body: Partial<DealerHub> & { id: string } = await req.json();
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: "Missing dealer id for update." },
        { status: 400 }
      );
    }
    const updated = await updateDbDealer(body.id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Dealer not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, source: "postgresql", data: updated });
  } catch (error: any) {
    console.error("[API PUT /api/dealers] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update dealer." }, { status: 500 });
  }
}

// DELETE /api/dealers - Remove a dealer hub from PostgreSQL
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing dealer id parameter." }, { status: 400 });
    }
    const deleted = await deleteDbDealer(id);
    return NextResponse.json({ success: true, source: "postgresql", deletedId: id, deleted });
  } catch (error: any) {
    console.error("[API DELETE /api/dealers] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete dealer." }, { status: 500 });
  }
}
