import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import { getUploadedFile } from "@/lib/server/db";
import sharp from "sharp";
import jsQR from "jsqr";
import path from "path";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    let buffer: Buffer | null = null;
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (file) {
        const bytes = await file.arrayBuffer();
        buffer = Buffer.from(bytes);
      }
    } else {
      const body = await req.json().catch(() => ({}));
      if (body.fileUrl && typeof body.fileUrl === "string") {
        const filename = path.basename(body.fileUrl);
        const dbFile = await getUploadedFile(filename);
        if (dbFile && dbFile.buffer) {
          buffer = dbFile.buffer;
        }
      } else if (body.base64 && typeof body.base64 === "string") {
        const base64Data = body.base64.replace(/^data:image\/\w+;base64,/, "");
        buffer = Buffer.from(base64Data, "base64");
      }
    }

    if (!buffer) {
      return NextResponse.json(
        { success: false, error: "No image file provided for QR decoding." },
        { status: 400 }
      );
    }

    // Convert image buffer to raw RGBA pixels via sharp
    const { data: rawPixels, info } = await sharp(buffer)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Decode QR code using jsQR
    const code = jsQR(new Uint8ClampedArray(rawPixels), info.width, info.height);

    if (!code || !code.data) {
      return NextResponse.json({
        success: true,
        qrFound: false,
        detectedUpiId: null,
        rawData: null,
        message: "No readable QR code found in the uploaded image.",
      });
    }

    const rawData = code.data.trim();
    let detectedUpiId: string | null = null;

    // Standard UPI URI format: upi://pay?pa=...
    const paMatch = rawData.match(/[?&]pa=([^&]+)/i);
    if (paMatch) {
      detectedUpiId = decodeURIComponent(paMatch[1]).trim();
    } else if (/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(rawData)) {
      detectedUpiId = rawData;
    }

    return NextResponse.json({
      success: true,
      qrFound: true,
      detectedUpiId,
      rawData,
    });
  } catch (error: any) {
    console.error("[POST /api/admin/payment-settings/qr-decode Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to decode QR code image." },
      { status: 500 }
    );
  }
}
