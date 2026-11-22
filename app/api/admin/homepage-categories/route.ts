import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import { getDbHomepageCategories, saveDbHomepageCategories } from "@/lib/server/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const dynamic = "force-dynamic";

const CategoryCardSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1, "Category ID is required"),
  position: z.number().int().min(0),
  isVisible: z.boolean().default(true),
  title: z.string().min(1).max(40, "Title must be at most 40 characters"),
  badge: z.string().max(32).optional().nullable(),
  buttonText: z.string().max(64).optional().default("Explore Catalogue"),
  description: z.string().min(1).max(110, "Description must be at most 110 characters"),
  chips: z
    .array(z.string().max(22, "Chip text must be at most 22 characters"))
    .max(4, "Max 4 chips allowed")
    .default([]),
  scenePreset: z
    .enum(["graphite", "navy", "grid", "sand", "concrete", "red", "custom_image"])
    .default("graphite"),
  backgroundImageUrl: z.string().optional().nullable(),
  productImageUrls: z.array(z.string()).max(3, "Max 3 product images allowed").default([]),
  linkUrl: z.string().min(1, "Link URL is required"),
  skuCount: z.number().optional(),
  updatedBy: z.string().optional(),
});

const SaveCardsPayloadSchema = z.object({
  cards: z.array(CategoryCardSchema).min(1, "At least 1 category card is required."),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    try {
      const cards = await getDbHomepageCategories();
      return NextResponse.json({
        success: true,
        data: cards,
      });
    } catch (dbErr: any) {
      console.warn("[API GET /api/admin/homepage-categories] DB error:", dbErr?.message);
      return NextResponse.json({
        success: false,
        error: "Failed to fetch homepage categories",
        data: [],
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[API GET /api/admin/homepage-categories] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch category showcase." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const parsed = SaveCardsPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const savedCards = await saveDbHomepageCategories(parsed.data.cards as any);

    // Edge cache invalidation for homepage
    try {
      revalidatePath("/");
      revalidatePath("/catalogue");
    } catch (revErr) {
      console.warn("[Cache Revalidation Warning]:", revErr);
    }

    return NextResponse.json({
      success: true,
      data: savedCards,
      message: "Homepage category showcase updated successfully.",
    });
  } catch (error: any) {
    console.error("[API PUT /api/admin/homepage-categories] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update category showcase." },
      { status: 500 }
    );
  }
}
