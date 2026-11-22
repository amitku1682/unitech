import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDbPool } from "@/lib/server/db";
import { checkForgotPasswordRateLimit, hashToken } from "@/lib/server/auth";
import { sendPasswordResetEmail } from "@/lib/server/email";

export const dynamic = "force-dynamic";

const GENERIC_RESPONSE = {
  success: true,
  message: "If this email belongs to an admin account, a reset link has been sent.",
};

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim() : "";

    // Rate limit check: 3 requests / 15 min per IP and per email
    const rateCheck = checkForgotPasswordRateLimit(ip, email);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many reset attempts. Please try again later.",
          retryAfter: rateCheck.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateCheck.retryAfterSeconds) },
        }
      );
    }

    if (!email || !email.includes("@")) {
      return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
    }

    const db = getDbPool();
    const userRes = await db.query(
      `SELECT id, email, is_active FROM admin_users WHERE LOWER(email) = LOWER($1);`,
      [email]
    );

    if (userRes.rows.length === 0 || !userRes.rows[0].is_active) {
      return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
    }

    const adminUser = userRes.rows[0];

    // Generate random 32-byte token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Invalidate prior unused tokens for this admin
    await db.query(
      `UPDATE admin_password_resets 
       SET used_at = CURRENT_TIMESTAMP 
       WHERE admin_user_id = $1 AND used_at IS NULL;`,
      [adminUser.id]
    );

    // Insert new token hash
    await db.query(
      `INSERT INTO admin_password_resets (admin_user_id, token_hash, expires_at, request_ip)
       VALUES ($1, $2, $3, $4);`,
      [adminUser.id, tokenHash, expiresAt, ip]
    );

    // Build reset link from runtime server variable (APP_BASE_URL, falling back to NEXT_PUBLIC_BASE_URL)
    // If neither is set, use request's x-forwarded-proto + x-forwarded-host/host header — never 0.0.0.0, localhost or 127.0.0.1
    const isForbiddenHost = (h: string) => {
      const clean = h.replace(/^https?:\/\//i, "").split("/")[0].split(":")[0].toLowerCase();
      return !clean || clean === "0.0.0.0" || clean === "localhost" || clean === "127.0.0.1" || clean.startsWith("127.");
    };

    let baseUrl = (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "").trim().replace(/\/+$/, "");

    if (!baseUrl || isForbiddenHost(baseUrl)) {
      const proto =
        req.headers.get("x-forwarded-proto")?.split(",")[0].trim() ||
        (req.url.startsWith("https:") ? "https" : "http");
      const host =
        req.headers.get("x-forwarded-host")?.split(",")[0].trim() ||
        req.headers.get("host")?.trim() ||
        "";

      if (host && !isForbiddenHost(host)) {
        baseUrl = `${proto}://${host}`.replace(/\/+$/, "");
      } else {
        baseUrl = "https://unitechcctv.com";
      }
    }

    const resetUrl = `${baseUrl}/admin/reset-password?token=${rawToken}`;

    // Send reset email
    sendPasswordResetEmail(adminUser.email, resetUrl).catch((err) => {
      console.error("[forgot-password] Email dispatch error:", err);
    });

    return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
  } catch (err: any) {
    console.error("[forgot-password] Error:", err);
    return NextResponse.json(GENERIC_RESPONSE, { status: 200 });
  }
}
