import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import { toggleFlashSaleEnabled } from "@/lib/server/flashSaleStore";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const body = await req.json();
    const id = body.id || "";
    const isEnabled = typeof body.isEnabled === "boolean" ? body.isEnabled : !!body.is_enabled;
    const updated = await toggleFlashSaleEnabled(id, isEnabled);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to toggle flash sale" },
      { status: 400 }
    );
  }
}
