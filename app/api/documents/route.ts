import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError, getAdminFromRequest } from "@/lib/server/auth";
import {
  getDbDocuments,
  createDbDocument,
  updateDbDocument,
  deleteDbDocument,
  syncDbDocuments,
} from "@/lib/server/db";
import { LiveDocumentAsset } from "@/lib/types";

export const dynamic = "force-dynamic";

// GET /api/documents - Returns live documents directly from PostgreSQL
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const admin = await getAdminFromRequest(req);

    const list = await getDbDocuments(category);
    const filteredList = admin ? list : list.filter((doc) => doc.isLive !== false);

    return NextResponse.json({
      success: true,
      source: "postgresql",
      count: filteredList.length,
      data: filteredList,
    });
  } catch (error: any) {
    console.error("[API GET /api/documents] Database read error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch documents." }, { status: 500 });
  }
}

// POST /api/documents - Add a single document directly to PostgreSQL
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const doc: LiveDocumentAsset = await req.json();
    if (!doc.id || !doc.title || !doc.fileUrl) {
      return NextResponse.json(
        { success: false, error: "Missing required document fields (id, title, fileUrl)." },
        { status: 400 }
      );
    }

    const created = await createDbDocument(doc);
    return NextResponse.json({ success: true, data: created });
  } catch (error: any) {
    console.error("[API POST /api/documents] Database write error:", error);
    return NextResponse.json({ success: false, error: "Failed to create document." }, { status: 500 });
  }
}

// PUT /api/documents - Batch save / publish all documents to PostgreSQL (atomic transaction with deletions)
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const docs: LiveDocumentAsset[] = Array.isArray(body) ? body : body.documents;

    if (!Array.isArray(docs)) {
      return NextResponse.json(
        { success: false, error: "Array of documents is required." },
        { status: 400 }
      );
    }

    const synced = await syncDbDocuments(docs);

    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${synced.length} documents live in PostgreSQL.`,
      count: synced.length,
      data: synced,
    });
  } catch (error: any) {
    console.error("[API PUT /api/documents] Database batch sync error:", error);
    return NextResponse.json({ success: false, error: "Failed to synchronize documents." }, { status: 500 });
  }
}

// PATCH /api/documents - Update single document fields directly in PostgreSQL
export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: "Document id is required." }, { status: 400 });
    }

    const dbUpdated = await updateDbDocument(id, updates);
    if (!dbUpdated) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: dbUpdated });
  } catch (error: any) {
    console.error("[API PATCH /api/documents] Database update error:", error);
    return NextResponse.json({ success: false, error: "Failed to update document." }, { status: 500 });
  }
}

// DELETE /api/documents - Delete document permanently from PostgreSQL
export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Document id is required." }, { status: 400 });
    }

    const deleted = await deleteDbDocument(id);
    return NextResponse.json({ success: true, deleted, id });
  } catch (error: any) {
    console.error("[API DELETE /api/documents] Database delete error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete document." }, { status: 500 });
  }
}
