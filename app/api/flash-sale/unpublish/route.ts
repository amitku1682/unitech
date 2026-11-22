import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import { unpublishFlashSale } from "@/lib/server/flashSaleStore";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const body = await req.json().catch(() => ({}));
    const id = body.id || "";
    const updated = await unpublishFlashSale(id);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to unpublish flash sale" },
      { status: 400 }
    );
  }
}
