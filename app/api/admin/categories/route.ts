import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import {
  getDbCategories,
  getDbCategoryById,
  createDbCategory,
  updateDbCategory,
  deleteDbCategory,
  reorderDbCategories,
} from "@/lib/server/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CreateCategorySchema = z.object({
  id: z.string().trim().min(1).max(64).regex(/^[a-z0-9-]+$/, "ID must be lowercase letters, numbers, and hyphens").optional(),
  name: z.string().trim().min(1).max(100),
  shortLabel: z.string().trim().max(50).optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
  coverImageUrl: z.string().trim().max(500).optional().nullable(),
  position: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
  showInMenu: z.boolean().default(true),
  showInFooter: z.boolean().default(true),
});

const UpdateCategorySchema = z.object({
  id: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(100).optional(),
  shortLabel: z.string().trim().max(50).optional().nullable(),
  description: z.string().trim().max(1000).optional().nullable(),
  coverImageUrl: z.string().trim().max(500).optional().nullable(),
  position: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
  showInMenu: z.boolean().optional(),
  showInFooter: z.boolean().optional(),
});

const ReorderSchema = z.object({
  action: z.literal("reorder"),
  orderedIds: z.array(z.string().trim().min(1)),
});

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    const categories = await getDbCategories({ activeOnly: false, includeSeries: true });
    return NextResponse.json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    console.error("Admin categories GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json();

    if (body.action === "reorder") {
      const parsedReorder = ReorderSchema.safeParse(body);
      if (!parsedReorder.success) {
        return NextResponse.json({ success: false, error: parsedReorder.error.message }, { status: 400 });
      }
      await reorderDbCategories(parsedReorder.data.orderedIds);
      const updated = await getDbCategories({ activeOnly: false, includeSeries: true });
      return NextResponse.json({ success: true, data: updated });
    }

    const parsed = CreateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }

    const id = parsed.data.id || parsed.data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const existing = await getDbCategoryById(id);
    if (existing) {
      return NextResponse.json({ success: false, error: `Category with slug "${id}" already exists` }, { status: 409 });
    }

    const created = await createDbCategory({
      id,
      name: parsed.data.name,
      shortLabel: parsed.data.shortLabel,
      description: parsed.data.description,
      coverImageUrl: parsed.data.coverImageUrl,
      position: parsed.data.position,
      isActive: parsed.data.isActive,
      showInMenu: parsed.data.showInMenu,
      showInFooter: parsed.data.showInFooter,
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error("Admin category POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to create category" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = UpdateCategorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message || "Invalid payload" }, { status: 400 });
    }

    const updated = await updateDbCategory(parsed.data.id, {
      name: parsed.data.name,
      shortLabel: parsed.data.shortLabel,
      description: parsed.data.description,
      coverImageUrl: parsed.data.coverImageUrl,
      position: parsed.data.position,
      isActive: parsed.data.isActive,
      showInMenu: parsed.data.showInMenu,
      showInFooter: parsed.data.showInFooter,
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("Admin category PUT error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Category ID is required" }, { status: 400 });
    }

    const result = await deleteDbCategory(id);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error, canDeactivate: true }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `Category ${id} deleted successfully` });
  } catch (error: any) {
    console.error("Admin category DELETE error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to delete category" }, { status: 500 });
  }
}
