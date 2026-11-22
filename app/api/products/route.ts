import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import {
  getDbProducts,
  getDbProductBySlug,
  createDbProduct,
  updateDbProduct,
  deleteDbProduct,
} from "@/lib/server/db";
import { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/products - Query live catalog directly from PostgreSQL
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;
    const slug = searchParams.get("slug") || undefined;

    if (slug) {
      const item = await getDbProductBySlug(slug);
      if (item) {
        return NextResponse.json({ success: true, source: "postgresql", data: item });
      }
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    const list = await getDbProducts(category, search);
    return NextResponse.json({
      success: true,
      source: "postgresql",
      count: list.length,
      data: list,
    });
  } catch (error: any) {
    console.error("[API GET /api/products] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST /api/products - Admin only: Create new product in PostgreSQL
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const product: Product = {
      ...body,
      id: body.id || `prod-${Date.now()}`,
    };

    if (!product.name || !product.slug || !product.category) {
      return NextResponse.json(
        { success: false, error: "Missing required product fields (name, slug, category)." },
        { status: 400 }
      );
    }

    const created = await createDbProduct(product);
    return NextResponse.json({ success: true, source: "postgresql", data: created }, { status: 201 });
  } catch (error: any) {
    console.error("[API POST /api/products] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create product." }, { status: 500 });
  }
}

// PATCH /api/products - Admin only: Update product in PostgreSQL
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: "Product id is required." }, { status: 400 });
    }

    const dbUpdated = await updateDbProduct(id, updates);
    if (!dbUpdated) {
      return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, source: "postgresql", data: dbUpdated });
  } catch (error: any) {
    console.error("[API PATCH /api/products] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update product." }, { status: 500 });
  }
}

// DELETE /api/products - Admin only: Delete product from PostgreSQL
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Product id is required." }, { status: 400 });
    }

    const deleted = await deleteDbProduct(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, source: "postgresql", deleted: true });
  } catch (error: any) {
    console.error("[API DELETE /api/products] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete product." }, { status: 500 });
  }
}
