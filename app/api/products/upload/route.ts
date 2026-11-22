import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import { saveUploadedFile, deleteUploadedFile } from "@/lib/server/db";
import {
  detectMagicBytes,
  generateRandomizedFilename,
  MAX_IMAGE_SIZE,
} from "@/lib/server/uploadSecurity";
import sharp from "sharp";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No image file provided." }, { status: 400 });
    }

    // 1. Enforce 5 MB maximum image size limit
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Image exceeds maximum allowed size of 5 MB." },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);

    // 2. Validate raster image magic bytes (strictly reject SVG, HTML, and executables)
    const detectedType = detectMagicBytes(rawBuffer);
    if (detectedType === "svg" || file.name.toLowerCase().endsWith(".svg")) {
      return NextResponse.json(
        { success: false, error: "SVG images are strictly prohibited due to security risks." },
        { status: 400 }
      );
    }

    if (detectedType !== "jpeg" && detectedType !== "png" && detectedType !== "webp") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid image format: Only authentic JPEG, PNG, or WebP images are permitted (magic bytes verification failed).",
        },
        { status: 400 }
      );
    }

    // 3. Process image with sharp: auto-orient, strip EXIF metadata, standardize to clean WebP
    let processedBuffer: any = rawBuffer;
    try {
      const resized = await sharp(rawBuffer)
        .rotate() // auto-orient and automatically strip EXIF
        .trim({ threshold: 12 })
        .resize(860, 860, {
          fit: "inside",
          withoutEnlargement: false,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .toBuffer();

      const standardized = await sharp({
        create: {
          width: 1000,
          height: 1000,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        },
      })
        .composite([{ input: resized, gravity: "center" }])
        .webp({ quality: 90 }) // strips EXIF metadata
        .toBuffer();

      processedBuffer = standardized;
    } catch (sharpErr) {
      console.warn("[Sharp Optimization Fallback]:", sharpErr);
      // Fallback: re-encode to clean WebP to ensure EXIF is stripped
      processedBuffer = await sharp(rawBuffer).rotate().webp({ quality: 90 }).toBuffer();
    }

    const sizeInMb = (processedBuffer.length / (1024 * 1024)).toFixed(2) + " MB";
    // 4. Generate randomized filename
    const uniqueFilename = generateRandomizedFilename(".webp", "prod");

    // 5. Save to PostgreSQL uploaded_files table
    await saveUploadedFile(
      uniqueFilename,
      processedBuffer,
      "image/webp",
      sizeInMb
    );

    const fileUrl = `/uploads/products/${uniqueFilename}`;

    return NextResponse.json({
      success: true,
      fileUrl,
      filename: uniqueFilename,
      fileSize: sizeInMb,
    });
  } catch (error: any) {
    console.error("[Product Image Upload Error]:", error);
    return NextResponse.json({ success: false, error: "Failed to process image upload." }, { status: 500 });
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
    console.error("[DELETE /api/products/upload Error]:", error);
    return NextResponse.json({ success: false, error: "Failed to delete file" }, { status: 500 });
  }
}
