import { NextResponse } from "next/server";
import { processFlashSaleClaim } from "@/lib/server/flashSaleStore";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await props.params;
    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const qty = typeof body.qty === "number" ? body.qty : parseInt(body.qty || "1", 10);

    const result = await processFlashSaleClaim(id, isNaN(qty) ? 1 : qty);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Claim failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      cartItem: result.cartItem,
      claimsCount: result.claimsCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
