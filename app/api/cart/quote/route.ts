import { NextRequest, NextResponse } from "next/server";
import { calculateCartQuote } from "@/lib/server/pricing";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawItems = Array.isArray(body)
      ? body
      : Array.isArray(body.items)
      ? body.items
      : [];

    const quote = await calculateCartQuote(rawItems);

    return NextResponse.json({
      success: true,
      ...quote,
      data: quote,
    });
  } catch (error: any) {
    console.error("[POST /api/cart/quote Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate server cart quote." },
      { status: 500 }
    );
  }
}
