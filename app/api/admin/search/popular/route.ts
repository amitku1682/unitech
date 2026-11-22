import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import { getDbPopularSearchTerms, saveDbPopularSearchTerms } from "@/lib/server/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";

export const dynamic = "force-dynamic";

const PopularTermSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Label is required").max(32, "Label max 32 characters"),
  query: z.string().min(1, "Query is required").max(60, "Query max 60 characters"),
  linkUrl: z.string().optional().nullable(),
  link_url: z.string().optional().nullable(),
  position: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  is_active: z.boolean().optional(),
  updatedBy: z.string().optional(),
});

const SavePayloadSchema = z.object({
  terms: z.array(PopularTermSchema).refine((items) => {
    const activeCount = items.filter((i) => i.isActive !== false && i.is_active !== false).length;
    return activeCount <= 10;
  }, "Maximum 10 active chips allowed."),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    try {
      const list = await getDbPopularSearchTerms(false);
      return NextResponse.json({
        success: true,
        data: list,
      });
    } catch (dbErr: any) {
      console.warn("[API GET /api/admin/search/popular] DB offline:", dbErr?.message);
      return NextResponse.json({
        success: true,
        source: "empty-fallback",
        data: [],
      });
    }
  } catch (error: any) {
    console.error("[API GET /api/admin/search/popular] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch popular search chips." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const parsed = SavePayloadSchema.safeParse(body);
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

    const normalized = parsed.data.terms.map((t, idx) => ({
      id: t.id || `pop-${idx}-${Date.now().toString(36)}`,
      label: t.label.trim().substring(0, 32),
      query: (t.query || t.label).trim().substring(0, 60),
      linkUrl: t.linkUrl || t.link_url || null,
      position: idx,
      isActive: t.isActive !== false && t.is_active !== false,
      updatedBy: t.updatedBy || "admin",
    }));

    const saved = await saveDbPopularSearchTerms(normalized as any);

    // Invalidate edge cache
    try {
      revalidatePath("/");
      revalidatePath("/catalogue");
      revalidateTag("search-popular");
    } catch (revErr) {
      console.warn("[Cache Revalidation Warning]:", revErr);
    }

    return NextResponse.json({
      success: true,
      data: saved,
      message: "Popular searches updated · live on the website",
    });
  } catch (error: any) {
    console.error("[API PUT /api/admin/search/popular] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update popular search chips." },
      { status: 500 }
    );
  }
}
