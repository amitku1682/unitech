import { NextResponse } from "next/server";
import { getPublicPaymentSettings } from "@/lib/server/db";

export const dynamic = "force-dynamic";

// GET /api/payment-settings - Public endpoint for storefront checkout
// Returns strictly sanitized payment credentials without admin metadata
export async function GET() {
  try {
    const settings = await getPublicPaymentSettings();
    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error: any) {
    console.error("[GET /api/payment-settings Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load payment settings." },
      { status: 500 }
    );
  }
}
