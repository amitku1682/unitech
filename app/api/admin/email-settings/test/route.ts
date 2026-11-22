import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import { sendTestNotification } from "@/lib/server/email";
import { z } from "zod";

export const dynamic = "force-dynamic";

const TestEmailSchema = z.object({
  recipientEmail: z.string().email("A valid recipient email address is required."),
});

// POST /api/admin/email-settings/test
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const body = await req.json().catch(() => ({}));
    const parsed = TestEmailSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid recipient email address.",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const result = await sendTestNotification(parsed.data.recipientEmail);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Failed to send test email.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email dispatched successfully to ${parsed.data.recipientEmail}.`,
    });
  } catch (error: any) {
    console.error("[API POST /api/admin/email-settings/test] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to execute test email." },
      { status: 500 }
    );
  }
}
