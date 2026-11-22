import { NextResponse } from "next/server";
import { getPublicSocialLinks } from "@/lib/server/db";

export const dynamic = "force-dynamic";

// GET /api/social-links - Public cached endpoint for active social & platform links
export async function GET() {
  try {
    const links = await getPublicSocialLinks();
    return NextResponse.json(
      {
        success: true,
        links,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error: any) {
    console.error("[GET /api/social-links Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load social links." },
      { status: 500 }
    );
  }
}
