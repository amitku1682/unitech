import crypto from "crypto";

export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10 MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;    // 5 MB

export type DetectedFileType = "pdf" | "jpeg" | "png" | "webp" | "svg" | "unknown";

/**
 * Validates authentic file magic bytes from binary header.
 * Disallows executable scripts, HTML, and SVGs (XSS risk).
 */
export function detectMagicBytes(buffer: Buffer): DetectedFileType {
  if (!buffer || buffer.length < 4) return "unknown";

  // PDF: %PDF- (0x25 0x50 0x44 0x46)
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return "pdf";
  }

  // PNG: \x89PNG (0x89 0x50 0x4E 0x47)
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return "png";
  }

  // JPEG: 0xFF 0xD8 0xFF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return "jpeg";
  }

  // WebP: 'RIFF' .... 'WEBP'
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 && // RIFF
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50   // WEBP
  ) {
    return "webp";
  }

  // Text inspection for XML/SVG/HTML to protect against renamed script payloads
  const sample = buffer.subarray(0, Math.min(1024, buffer.length)).toString("utf8").toLowerCase();
  if (
    sample.includes("<svg") ||
    sample.includes("<?xml") ||
    sample.includes("<html") ||
    sample.includes("<script") ||
    sample.includes("<!doctype")
  ) {
    return "svg";
  }

  return "unknown";
}

/**
 * Generates an unguessable randomized filename using crypto.randomUUID().
 * Eliminates user-controlled path traversal or file overwrites.
 */
export function generateRandomizedFilename(extension: string, prefix = ""): string {
  const safeExt = extension.startsWith(".") ? extension.toLowerCase() : `.${extension.toLowerCase()}`;
  const uuid = crypto.randomUUID();
  return prefix ? `${prefix}-${uuid}${safeExt}` : `${uuid}${safeExt}`;
}
