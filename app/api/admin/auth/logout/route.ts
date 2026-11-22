import { NextRequest, NextResponse } from "next/server";
import { destroyAdminSession, extractSessionToken, ADMIN_COOKIE_NAME, isCookieSecure } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const token = extractSessionToken(req);
    if (token) {
      await destroyAdminSession(token);
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: isCookieSecure(),
      sameSite: "strict",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (error: any) {
    console.error("[POST /api/admin/auth/logout Error]:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process logout." },
      { status: 500 }
    );
  }
}
