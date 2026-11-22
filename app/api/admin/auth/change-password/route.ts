import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDbPool } from "@/lib/server/db";
import { requireAdmin, isAuthError, checkChangePasswordRateLimit, hashPassword } from "@/lib/server/auth";
import { sendPasswordChangedNotification } from "@/lib/server/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // Rate limit: 5 attempts per 15 minutes
    const rateCheck = checkChangePasswordRateLimit(ip, auth.user.id);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many password change attempts. Please try again later.",
          retryAfter: rateCheck.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateCheck.retryAfterSeconds) },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    if (!currentPassword) {
      return NextResponse.json(
        { success: false, error: "Current password is required." },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 12) {
      return NextResponse.json(
        { success: false, error: "New password must be at least 12 characters long." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "New password and confirmation do not match." },
        { status: 400 }
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        { success: false, error: "New password cannot be the same as your current password." },
        { status: 400 }
      );
    }

    const db = getDbPool();
    const userRes = await db.query(
      `SELECT password_hash, email FROM admin_users WHERE id = $1;`,
      [auth.user.id]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Admin user not found." },
        { status: 404 }
      );
    }

    const storedHash = userRes.rows[0].password_hash;
    const isValidCurrent = await bcrypt.compare(currentPassword, storedHash);

    if (!isValidCurrent) {
      return NextResponse.json(
        { success: false, error: "Incorrect current password." },
        { status: 400 }
      );
    }

    // Hash new password using bcrypt (cost 12)
    const newHash = await hashPassword(newPassword);

    // Update password
    await db.query(
      `UPDATE admin_users 
       SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2;`,
      [newHash, auth.user.id]
    );

    // Delete all OTHER sessions of this admin, keeping the current session
    await db.query(
      `DELETE FROM admin_sessions 
       WHERE admin_user_id = $1 AND id != $2;`,
      [auth.user.id, auth.session.id]
    );

    // Send confirmation email
    sendPasswordChangedNotification(userRes.rows[0].email).catch((err) => {
      console.error("[change-password] Confirmation email error:", err);
    });

    return NextResponse.json(
      {
        success: true,
        message: "Password updated successfully. All other active sessions have been terminated.",
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[change-password] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to update password." },
      { status: 500 }
    );
  }
}
