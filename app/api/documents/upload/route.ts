import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/server/db";
import {
  detectMagicBytes,
  generateRandomizedFilename,
  MAX_DOCUMENT_SIZE,
} from "@/lib/server/uploadSecurity";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file was uploaded." }, { status: 400 });
    }

    // 1. Enforce 10 MB file size limit
    if (file.size > MAX_DOCUMENT_SIZE) {
      return NextResponse.json(
        { success: false, error: "File size exceeds the 10 MB maximum limit for document uploads." },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. Validate PDF magic bytes
    const detectedType = detectMagicBytes(buffer);
    if (detectedType === "svg" || file.name.toLowerCase().endsWith(".svg")) {
      return NextResponse.json(
        { success: false, error: "SVG files are strictly disallowed due to security policies." },
        { status: 400 }
      );
    }

    if (detectedType !== "pdf") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid document format: Only authentic PDF files are permitted (magic bytes verification failed).",
        },
        { status: 400 }
      );
    }

    // 3. Generate unguessable randomized filename
    const randomizedFilename = generateRandomizedFilename(".pdf", "doc");
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1) + " MB";

    // 4. Save to PostgreSQL uploaded_files table
    await saveUploadedFile(
      randomizedFilename,
      buffer,
      "application/pdf",
      sizeInMb
    );

    const fileUrl = `/downloads/${randomizedFilename}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      filename: randomizedFilename,
      fileSize: sizeInMb,
    });
  } catch (error: any) {
    console.error("[Upload PDF API Error]:", error);
    return NextResponse.json({ success: false, error: "Failed to process document upload." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const { searchParams } = new URL(req.url);
    const filename = searchParams.get("filename") || "";
    if (!filename) {
      return NextResponse.json({ success: false, error: "Filename is required" }, { status: 400 });
    }

    const deleted = await deleteUploadedFile(filename);
    return NextResponse.json({ success: true, deleted, filename });
  } catch (error: any) {
    console.error("[DELETE /api/documents/upload Error]:", error);
    return NextResponse.json({ success: false, error: "Failed to delete document" }, { status: 500 });
  }
}
