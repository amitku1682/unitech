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
      return NextResponse.json(
        { success: false, error: "No image file provided." },
        { status: 400 }
      );
    }

    // Max 5 MB check
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Image size exceeds the 5 MB limit." },
        { status: 413 }
      );
    }

    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);

    // Validate magic bytes
    const detected = detectMagicBytes(rawBuffer);
    if (detected === "svg" || file.name.toLowerCase().endsWith(".svg")) {
      return NextResponse.json(
        { success: false, error: "SVG images are strictly prohibited due to security policy." },
        { status: 400 }
      );
    }

    if (detected !== "jpeg" && detected !== "png" && detected !== "webp") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid image format: Only JPEG, PNG, or WebP images are permitted (magic bytes verification failed).",
        },
        { status: 400 }
      );
    }

    let processedBuffer: any = rawBuffer;
    let thumbBuffer: any = rawBuffer;
    let width = 1000;
    let height = 1000;
    let warning: string | undefined = undefined;

    if (sharp) {
      const meta = await sharp(rawBuffer).metadata();
      const origW = meta.width || 1000;
      const origH = meta.height || 1000;

      // Min 400px check to support standard 480x620 card images and product photos
      if (origW < 400 || origH < 400) {
        return NextResponse.json(
          {
            success: false,
            error: `Image dimensions (${origW}×${origH}) are below the minimum required 400×400 px.`,
          },
          { status: 400 }
        );
      }

      // Warning below 1000x1000
      if (origW < 1000 || origH < 1000) {
        warning = `Image resolution (${origW}×${origH}) is below recommended 1000×1000 px for high-res zoom.`;
      }

      if (meta.format !== "svg") {
        // 1. Process full-res image: auto-orient, max 1600px longest side, convert to WebP
        let pipeline = sharp(rawBuffer).rotate().resize(1600, 1600, {
          fit: "inside",
          withoutEnlargement: true,
        });

        // Background transparency: flood-fill neutral white/near-white pixels starting from edges
        try {
          const { data: rawPixels, info } = await pipeline.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
          const w = info.width;
          const h = info.height;
          const visited = new Uint8Array(w * h);
          const queue: number[] = [];

          const isWhite = (x: number, y: number) => {
            const idx = (y * w + x) * 4;
            const r = rawPixels[idx];
            const g = rawPixels[idx + 1];
            const b = rawPixels[idx + 2];
            // Neutral near-white/light-grey background check:
            return r >= 235 && g >= 235 && b >= 235 && Math.abs(r - g) < 20 && Math.abs(r - b) < 20 && Math.abs(g - b) < 20;
          };

          // Seed queue with border pixels
          for (let x = 0; x < w; x++) {
            if (isWhite(x, 0)) { visited[0 * w + x] = 1; queue.push(x, 0); }
            if (isWhite(x, h - 1)) { visited[(h - 1) * w + x] = 1; queue.push(x, h - 1); }
          }
          for (let y = 0; y < h; y++) {
            if (isWhite(0, y)) { visited[y * w + 0] = 1; queue.push(0, y); }
            if (isWhite(w - 1, y)) { visited[y * w + (w - 1)] = 1; queue.push(w - 1, y); }
          }

          // BFS flood fill to turn outer white pixels fully transparent
          let qIdx = 0;
          while (qIdx < queue.length) {
            const cx = queue[qIdx++];
            const cy = queue[qIdx++];
            const pIdx = (cy * w + cx) * 4;
            rawPixels[pIdx + 3] = 0; // Alpha 0

            const neighbors = [
              [cx + 1, cy],
              [cx - 1, cy],
              [cx, cy + 1],
              [cx, cy - 1]
            ];
            for (const [nx, ny] of neighbors) {
              if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                const nOffset = ny * w + nx;
                if (!visited[nOffset] && isWhite(nx, ny)) {
                  visited[nOffset] = 1;
                  queue.push(nx, ny);
                }
              }
            }
          }

          pipeline = sharp(rawPixels, {
            raw: { width: w, height: h, channels: 4 }
          });
        } catch (e) {
          console.warn("[Background removal fallback]:", e);
        }

        const fullRes = await pipeline
          .webp({ quality: 90 })
          .toBuffer({ resolveWithObject: true });

        processedBuffer = fullRes.data;
        width = fullRes.info.width;
        height = fullRes.info.height;

        // 2. Process thumbnail (~200px)
        const thumbRes = await sharp(processedBuffer)
          .resize(200, 200, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toBuffer();

        thumbBuffer = thumbRes;
      }
    }

    const fullFilename = generateRandomizedFilename(".webp", "gal");
    const thumbFilename = generateRandomizedFilename(".webp", "gal-thumb");

    const fullSizeMb = (processedBuffer.length / (1024 * 1024)).toFixed(2) + " MB";
    const thumbSizeMb = (thumbBuffer.length / (1024 * 1024)).toFixed(2) + " MB";

    // Store both in PostgreSQL uploaded_files table
    await saveUploadedFile(fullFilename, processedBuffer, "image/webp", fullSizeMb);
    await saveUploadedFile(thumbFilename, thumbBuffer, "image/webp", thumbSizeMb);

    const url = `/uploads/products/${fullFilename}`;
    const thumb_url = `/uploads/products/${thumbFilename}`;

    return NextResponse.json({
      success: true,
      url,
      thumb_url,
      width,
      height,
      warning,
    });
  } catch (error: any) {
    console.error("[Product Image Upload Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process image upload." },
      { status: 500 }
    );
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
    console.error("[DELETE /api/admin/uploads/product-image Error]:", error);
    return NextResponse.json({ success: false, error: "Failed to delete image" }, { status: 500 });
  }
}
