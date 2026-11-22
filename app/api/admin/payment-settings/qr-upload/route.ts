import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import { getDbPool, initializeDatabase } from "@/lib/server/db";
import sharp from "sharp";
import jsQR from "jsqr";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

function detectMimeFromMagicBytes(buffer: Buffer): "image/png" | "image/jpeg" | null {
  if (buffer.length >= 8) {
    // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return "image/png";
    }
  }
  if (buffer.length >= 3) {
    // JPEG magic bytes: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return "image/jpeg";
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    await initializeDatabase();
    const pool = getDbPool();

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { success: false, error: "Content-Type must be multipart/form-data." },
        { status: 400 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided in 'file' field." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. File size check (max 2MB)
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "File size exceeds 2MB limit." },
        { status: 400 }
      );
    }

    if (buffer.length === 0) {
      return NextResponse.json(
        { success: false, error: "Uploaded file is empty." },
        { status: 400 }
      );
    }

    // 2. Validate magic bytes (PNG or JPEG only)
    const detectedMime = detectMimeFromMagicBytes(buffer);
    if (!detectedMime) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid image format. Only PNG and JPEG images are allowed (magic bytes validation failed).",
        },
        { status: 400 }
      );
    }

    // 3. Decode QR code via jsQR
    let decodedUpiId: string | null = null;
    try {
      const { data: rawPixels, info } = await sharp(buffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const code = jsQR(new Uint8ClampedArray(rawPixels), info.width, info.height);
      if (code && code.data) {
        const rawData = code.data.trim();
        const paMatch = rawData.match(/[?&]pa=([^&]+)/i);
        if (paMatch) {
          decodedUpiId = decodeURIComponent(paMatch[1]).trim();
        } else if (/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(rawData)) {
          decodedUpiId = rawData;
        }
      }
    } catch (decodeErr) {
      console.warn("[qr-upload jsQR warning]:", decodeErr);
    }

    // 4. Insert into uploaded_files table
    const randomHex = crypto.randomUUID().replace(/-/g, "").substring(0, 16);
    const fileId = `file-qr-${randomHex}`;
    const originalName = file.name ? file.name.replace(/[^a-zA-Z0-9._-]/g, "_") : "";
    const filename = originalName || (detectedMime === "image/png" ? "qr-code.png" : "qr-code.jpg");

    await pool.query(
      `INSERT INTO uploaded_files (id, filename, mime_type, file_data, file_size, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW());`,
      [fileId, filename, detectedMime, buffer, buffer.length]
    );

    return NextResponse.json({
      success: true,
      id: fileId,
      url: `/api/uploads/${fileId}`,
      filename,
      decodedUpiId: decodedUpiId || null,
    });
  } catch (error: any) {
    console.error("[POST /api/admin/payment-settings/qr-upload Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to upload and process QR code." },
      { status: 500 }
    );
  }
}
