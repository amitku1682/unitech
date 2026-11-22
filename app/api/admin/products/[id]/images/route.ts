import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import {
  getDbProductImages,
  saveDbProductImages,
  getDbProductById,
} from "@/lib/server/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const dynamic = "force-dynamic";

const ImageItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().optional(),
  url: z.string().min(1, "Image URL is required"),
  thumbUrl: z.string().optional(),
  thumb_url: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  label: z.string().default("Front view"),
  alt: z.string().max(125, "Alt text must be at most 125 characters").default(""),
  position: z.number().int().min(0).max(5),
});

const SaveGallerySchema = z.object({
  images: z
    .array(ImageItemSchema)
    .min(1, "At least 1 product image is required.")
    .max(6, "Maximum 6 images allowed per product."),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Product ID is required." },
        { status: 400 }
      );
    }

    let images = await getDbProductImages(id);

    // If no gallery images in table yet, check product's cover image
    if (images.length === 0) {
      const product = await getDbProductById(id);
      if (product && product.imageUrl) {
        images = [
          {
            id: `img-${id}-0`,
            productId: id,
            url: product.imageUrl,
            thumbUrl: product.imageUrl,
            width: 1000,
            height: 1000,
            label: "Front view",
            alt: `${product.name} — front view`,
            position: 0,
          },
        ];
      }
    }

    return NextResponse.json({
      success: true,
      images,
      count: images.length,
    });
  } catch (error: any) {
    console.error("[GET /api/admin/products/:id/images Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch gallery images." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "Product ID is required." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = SaveGallerySchema.safeParse(body);

    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => i.message).join(", ");
      return NextResponse.json(
        { success: false, error: `Validation failed: ${issues}` },
        { status: 400 }
      );
    }

    // Ensure positions are continuous 0..n-1
    const normalizedImages = parsed.data.images.map((img, index) => ({
      ...img,
      thumbUrl: img.thumbUrl || img.thumb_url || img.url,
      position: index,
    }));

    // Save in PostgreSQL via transaction
    const saved = await saveDbProductImages(id, normalizedImages);

    const coverUrl = saved[0]?.url || "";

    // Cache invalidation
    try {
      revalidatePath("/catalogue");
      revalidatePath(`/product/[slug]`, "page");
    } catch (revErr) {
      console.warn("[revalidatePath warning]:", revErr);
    }

    return NextResponse.json({
      success: true,
      images: saved,
      coverUrl,
      count: saved.length,
    });
  } catch (error: any) {
    console.error("[PUT /api/admin/products/:id/images Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save product images." },
      { status: 500 }
    );
  }
}
