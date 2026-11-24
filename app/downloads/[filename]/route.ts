import { NextRequest, NextResponse } from "next/server";
import { getUploadedFile } from "@/lib/server/db";
import { generateBrandedPdf } from "@/lib/server/pdfGenerator";
import crypto from "crypto";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, props: { params: Promise<{ filename: string }> }) {
  const params = await props.params;
  try {
    const rawFilename = params.filename || "";
    let decodedFilename = rawFilename;
    try {
      decodedFilename = decodeURIComponent(rawFilename);
    } catch {
      return NextResponse.json({ error: "Invalid URI encoding" }, { status: 400 });
    }

    // Reject null bytes, empty filenames, or directory traversal
    if (!decodedFilename || decodedFilename.includes("\0") || decodedFilename.includes("..")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Sanitize filename to strict base name
    const safeFilename = path.basename(decodedFilename);
    if (!safeFilename || safeFilename === "." || safeFilename === "..") {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const ext = path.extname(safeFilename).toLowerCase();
    // Enforce PDF-only access for downloads
    if (ext !== ".pdf") {
      return NextResponse.json({ error: "Only PDF documents may be accessed via this endpoint" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const isDownload = searchParams.get("download") === "1";
    const dispositionType = isDownload ? "attachment" : "inline";

    // 1. Check PostgreSQL uploaded_files table (no disk reads)
    const dbFile = await getUploadedFile(safeFilename);
    if (dbFile && dbFile.buffer) {
      const etag = `"${crypto.createHash("md5").update(dbFile.buffer).digest("hex")}"`;

      // 304 conditional request check
      const ifNoneMatch = req.headers.get("if-none-match");
      if (ifNoneMatch && ifNoneMatch === etag) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            "ETag": etag,
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }

      // Uniquely named documents (e.g. doc-uuid.pdf) get immutable caching
      const isUniqueUpload = /^doc-[a-z0-9-]+/i.test(safeFilename) || /^[a-f0-9-]{36}\.pdf$/i.test(safeFilename);
      const cacheControl = isUniqueUpload
        ? "public, max-age=31536000, immutable"
        : "public, max-age=3600";

      return new NextResponse(new Uint8Array(dbFile.buffer), {
        status: 200,
        headers: {
          "Content-Type": dbFile.mimeType || "application/pdf",
          "Content-Disposition": `${dispositionType}; filename="${dbFile.filename || safeFilename}"`,
          "Cache-Control": cacheControl,
          "ETag": etag,
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // 2. On-demand fallback: generate branded PDF specification sheet
    const cleanTitle = safeFilename
      .replace(/\.pdf$/i, "")
      .replace(/[-_]/g, " ")
      .toUpperCase();

    const generatedBuffer = generateBrandedPdf(
      `UNITECH - ${cleanTitle}`,
      "Official Factory Surveillance Equipment Specification & Technical Datasheet",
      "v2026.1",
      "November 2026"
    );

    const genEtag = `"${crypto.createHash("md5").update(generatedBuffer).digest("hex")}"`;
    const ifNoneMatch = req.headers.get("if-none-match");
    if (ifNoneMatch && ifNoneMatch === genEtag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          "ETag": genEtag,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    return new NextResponse(new Uint8Array(generatedBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${dispositionType}; filename="${safeFilename}"`,
        "Cache-Control": "public, max-age=3600",
        "ETag": genEtag,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    console.error("[GET /downloads/[filename] Error]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
