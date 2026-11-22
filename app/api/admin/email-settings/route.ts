import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import {
  getDbEmailSettings,
  saveDbEmailSettings,
  getDbEmailLogs,
} from "@/lib/server/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const EmailSettingsPayloadSchema = z.object({
  isEnabled: z.boolean().default(false),
  smtpHost: z.string().max(255).default(""),
  smtpPort: z.number().int().min(1).max(65535).default(587),
  smtpSecure: z.boolean().default(false),
  smtpUser: z.string().max(255).default(""),
  smtpPassword: z.string().max(255).optional().nullable(),
  senderEmail: z.string().email("Invalid sender email").or(z.literal("")).default("sales@unitechcctv.com"),
  senderName: z.string().max(255).default("Unitech CCTV Sales"),
  adminNotificationEmails: z.array(z.string().email("Invalid email address")).default([]),
  notifyOnOrderReceived: z.boolean().default(true),
  notifyOnPaymentConfirmed: z.boolean().default(true),
  notifyOnPaymentRejected: z.boolean().default(true),
  notifyAdminOnOrder: z.boolean().default(true),
  notifyAdminOnEnquiry: z.boolean().default(true),
});

// GET /api/admin/email-settings
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const settings = await getDbEmailSettings();
    const logs = await getDbEmailLogs(20);
    const hasEncryptionKey = Boolean(process.env.SETTINGS_ENCRYPTION_KEY || process.env.ADMIN_SESSION_SECRET);

    return NextResponse.json({
      success: true,
      data: settings,
      logs,
      hasEncryptionKey,
    });
  } catch (error: any) {
    console.error("[API GET /api/admin/email-settings] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch email settings." },
      { status: 500 }
    );
  }
}

// PUT /api/admin/email-settings
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const body = await req.json().catch(() => ({}));
    const parsed = EmailSettingsPayloadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const saved = await saveDbEmailSettings({
      ...parsed.data,
      smtpPassword: parsed.data.smtpPassword || undefined,
      updatedBy: auth.user.email,
    });

    return NextResponse.json({
      success: true,
      data: saved,
      message: "Email notification settings saved successfully.",
    });
  } catch (error: any) {
    console.error("[API PUT /api/admin/email-settings] Error:", error);
    const errorMessage = error?.message?.includes("SETTINGS_ENCRYPTION_KEY")
      ? error.message
      : "Failed to save email settings.";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
  }
}
