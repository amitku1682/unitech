import { NextRequest, NextResponse } from "next/server";
import { getUploadedFile } from "@/lib/server/db";
import crypto from "crypto";
import path from "path";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jfif": "image/jpeg",
  ".pdf": "application/pdf",
};

export async function GET(req: NextRequest, props: { params: Promise<{ path?: string[] }> }) {
  const params = await props.params;
  try {
    const segments = params.path || [];
    if (!segments.length) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const rawFilename = segments[segments.length - 1] || "";
    let decodedFilename = rawFilename;
    try {
      decodedFilename = decodeURIComponent(rawFilename);
    } catch {
      return NextResponse.json({ error: "Invalid URI encoding" }, { status: 400 });
    }

    // Path traversal & null byte validation
    if (!decodedFilename || decodedFilename.includes("\0") || decodedFilename.includes("..")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Sanitize filename to strict base name
    const safeFilename = path.basename(decodedFilename);
    if (!safeFilename || safeFilename === "." || safeFilename === "..") {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const ext = path.extname(safeFilename).toLowerCase();
    const defaultMime = ext ? ALLOWED_MIME_TYPES[ext] : null;
    if (ext && !defaultMime) {
      return NextResponse.json({ error: "Unsupported or disallowed file extension" }, { status: 400 });
    }

    // Retrieve directly from PostgreSQL uploaded_files table (no disk reads)
    const dbFile = await getUploadedFile(safeFilename);
    if (!dbFile || !dbFile.buffer) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const mime = dbFile.mimeType || defaultMime || "image/png";
    const allowedMimes = Object.values(ALLOWED_MIME_TYPES);
    if (!allowedMimes.includes(mime)) {
      return NextResponse.json({ error: "Unsupported MIME type" }, { status: 400 });
    }

    const etag = `"${crypto.createHash("md5").update(dbFile.buffer).digest("hex")}"`;

    // 304 conditional request handling
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

    const headers: Record<string, string> = {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=31536000, immutable",
      "ETag": etag,
      "X-Content-Type-Options": "nosniff",
    };

    if (ext === ".pdf") {
      const isDownload = req.nextUrl.searchParams.get("download") === "1";
      headers["Content-Disposition"] = `${isDownload ? "attachment" : "inline"}; filename="${safeFilename}"`;
    }

    return new NextResponse(new Uint8Array(dbFile.buffer), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("[GET /uploads/[...path] Error]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
