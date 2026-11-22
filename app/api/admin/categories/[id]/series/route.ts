import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import {
  getDbCategorySeries,
  createDbCategorySeries,
  updateDbCategorySeries,
  deleteDbCategorySeries,
  reorderDbCategorySeries,
} from "@/lib/server/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateSeriesSchema = z.object({
  id: z.string().trim().max(64).optional(),
  label: z.string().trim().min(1).max(100),
  slug: z.string().trim().min(1).max(100).optional(),
  position: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
});

const UpdateSeriesSchema = z.object({
  seriesId: z.string().trim().min(1).max(64),
  label: z.string().trim().min(1).max(100).optional(),
  slug: z.string().trim().min(1).max(100).optional(),
  position: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const ReorderSeriesSchema = z.object({
  action: z.literal("reorder"),
  orderedIds: z.array(z.string().trim().min(1)),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    const categoryId = params.id;
    const series = await getDbCategorySeries(categoryId, false);
    return NextResponse.json({ success: true, count: series.length, data: series });
  } catch (error) {
    console.error("Admin category series GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch category series" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    const categoryId = params.id;
    const body = await req.json();

    if (body.action === "reorder") {
      const parsedReorder = ReorderSeriesSchema.safeParse(body);
      if (!parsedReorder.success) {
        return NextResponse.json({ success: false, error: parsedReorder.error.message }, { status: 400 });
      }
      await reorderDbCategorySeries(categoryId, parsedReorder.data.orderedIds);
      const updated = await getDbCategorySeries(categoryId, false);
      return NextResponse.json({ success: true, data: updated });
    }

    const parsed = CreateSeriesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }

    const created = await createDbCategorySeries({
      id: parsed.data.id,
      categoryId,
      label: parsed.data.label,
      slug: parsed.data.slug,
      position: parsed.data.position,
      isActive: parsed.data.isActive,
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error("Admin category series POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create series" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = UpdateSeriesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }

    const updated = await updateDbCategorySeries(parsed.data.seriesId, {
      label: parsed.data.label,
      slug: parsed.data.slug,
      position: parsed.data.position,
      isActive: parsed.data.isActive,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Series not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Admin category series PUT error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update series" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const seriesId = searchParams.get("seriesId");
    if (!seriesId) {
      return NextResponse.json({ success: false, error: "seriesId parameter is required" }, { status: 400 });
    }

    const deleted = await deleteDbCategorySeries(seriesId);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Series not found or could not be deleted" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Series ${seriesId} deleted successfully` });
  } catch (error: any) {
    console.error("Admin category series DELETE error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to delete series" }, { status: 500 });
  }
}
