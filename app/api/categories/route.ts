import { NextResponse } from "next/server";
import { getDbCategories } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const categories = await getDbCategories({ activeOnly: true, includeSeries: true });
    return NextResponse.json({
      success: true,
      count: categories.length,
      data: categories,
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Failed to fetch public categories:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories", data: [] },
      { status: 500 }
    );
  }
}
