import { NextResponse } from "next/server";
import { getActiveFlashSale } from "@/lib/server/flashSaleStore";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const active = await getActiveFlashSale();
    if (!active) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(
      {
        ...active,
        success: true,
        data: active,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30",
        },
      }
    );
  } catch (error: any) {
    console.error("[GET /api/flash-sale/active Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch active flash sale." },
      { status: 500 }
    );
  }
}
