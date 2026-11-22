import { NextResponse } from "next/server";
import { getCachedTickerPayload } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await getCachedTickerPayload();
    return NextResponse.json(
      {
        success: true,
        settings: payload.settings,
        messages: payload.messages,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      }
    );
  } catch (error: any) {
    console.error("[GET /api/ticker error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to load ticker",
      },
      { status: 500 }
    );
  }
}
