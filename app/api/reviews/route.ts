import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError, getAdminFromRequest } from "@/lib/server/auth";
import {
  getDbReviews,
  createDbReview,
  updateDbReview,
  deleteDbReview,
  saveDbReviews,
} from "@/lib/server/db";
import { GoogleReview } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/reviews - Fetch live reviews directly from PostgreSQL
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminFromRequest(req);
    const list = await getDbReviews();
    const filteredList = admin ? list : list.filter((r) => r.isFeatured !== false);

    return NextResponse.json({
      success: true,
      source: "postgresql",
      count: filteredList.length,
      data: filteredList,
    });
  } catch (error: any) {
    console.error("[API GET /api/reviews] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch reviews." }, { status: 500 });
  }
}

// POST /api/reviews - Add or upsert a single review in PostgreSQL
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const review: GoogleReview = await req.json();
    if (!review.id || !review.authorName || !review.reviewText) {
      return NextResponse.json(
        { success: false, error: "Missing required review fields (id, authorName, reviewText)." },
        { status: 400 }
      );
    }

    const created = await createDbReview(review);
    return NextResponse.json({ success: true, source: "postgresql", data: created }, { status: 201 });
  } catch (error: any) {
    console.error("[API POST /api/reviews] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to create review." }, { status: 500 });
  }
}

// PUT /api/reviews - Batch update / save entire reviews array directly in PostgreSQL
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const reviews: GoogleReview[] = Array.isArray(body) ? body : body.reviews;

    if (!Array.isArray(reviews)) {
      return NextResponse.json(
        { success: false, error: "Array of reviews is required." },
        { status: 400 }
      );
    }

    const saved = await saveDbReviews(reviews);

    return NextResponse.json({
      success: true,
      source: "postgresql",
      message: `Persisted ${saved.length} reviews in PostgreSQL successfully.`,
      count: saved.length,
      data: saved,
    });
  } catch (error: any) {
    console.error("[API PUT /api/reviews] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update reviews." }, { status: 500 });
  }
}

// PATCH /api/reviews - Pin, unpin or edit review in PostgreSQL
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: "Review id is required." }, { status: 400 });
    }

    const updated = await updateDbReview(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Review not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, source: "postgresql", data: updated });
  } catch (error: any) {
    console.error("[API PATCH /api/reviews] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to update review." }, { status: 500 });
  }
}

// DELETE /api/reviews - Delete a review from PostgreSQL
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Review id is required." }, { status: 400 });
    }

    const deleted = await deleteDbReview(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Review not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, source: "postgresql", deleted: true });
  } catch (error: any) {
    console.error("[API DELETE /api/reviews] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete review." }, { status: 500 });
  }
}
