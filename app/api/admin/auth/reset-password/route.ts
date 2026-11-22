import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/server/db";
import { hashToken, hashPassword } from "@/lib/server/auth";
import { sendPasswordChangedNotification } from "@/lib/server/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Reset token is required." },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < 12) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 12 characters long." },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: "Passwords do not match." },
        { status: 400 }
      );
    }

    const tokenHash = hashToken(token);
    const db = getDbPool();

    const resetRes = await db.query(
      `SELECT r.id, r.admin_user_id, r.expires_at, r.used_at, u.email, u.is_active
       FROM admin_password_resets r
       JOIN admin_users u ON u.id = r.admin_user_id
       WHERE r.token_hash = $1;`,
      [tokenHash]
    );

    if (resetRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid reset token. Please request a new reset link." },
        { status: 400 }
      );
    }

    const record = resetRes.rows[0];

    if (record.used_at) {
      return NextResponse.json(
        { success: false, error: "This reset link has already been used. Please request a new one." },
        { status: 400 }
      );
    }

    if (new Date(record.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, error: "This reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (!record.is_active) {
      return NextResponse.json(
        { success: false, error: "This administrator account is currently inactive." },
        { status: 400 }
      );
    }

    // Hash new password using bcrypt (cost 12)
    const newHash = await hashPassword(newPassword);

    // Update password, mark token as used, and invalidate ALL sessions for this admin
    await db.query(
      `UPDATE admin_password_resets 
       SET used_at = CURRENT_TIMESTAMP 
       WHERE id = $1;`,
      [record.id]
    );

    await db.query(
      `UPDATE admin_users 
       SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2;`,
      [newHash, record.admin_user_id]
    );

    await db.query(
      `DELETE FROM admin_sessions 
       WHERE admin_user_id = $1;`,
      [record.admin_user_id]
    );

    // Send confirmation email
    sendPasswordChangedNotification(record.email).catch((err) => {
      console.error("[reset-password] Confirmation email error:", err);
    });

    return NextResponse.json(
      {
        success: true,
        message: "Password updated successfully — please log in.",
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("[reset-password] Error:", err);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred while resetting password." },
      { status: 500 }
    );
  }
}
