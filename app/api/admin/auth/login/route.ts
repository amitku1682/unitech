import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDbPool } from "@/lib/server/db";
import {
  verifyPassword,
  createAdminSession,
  checkLoginRateLimit,
  recordLoginFailure,
  clearLoginRateLimit,
  ADMIN_COOKIE_NAME,
  SESSION_DURATION_HOURS,
  isCookieSecure,
} from "@/lib/server/auth";

export const dynamic = "force-dynamic";

const LoginSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || undefined;

    const body = await req.json().catch(() => ({}));
    const parseResult = LoginSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 400 }
      );
    }

    const { email, password } = parseResult.data;
    const rateLimitKey = `${ip}:${email.toLowerCase()}`;
    const rateCheck = checkLoginRateLimit(rateLimitKey);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many failed login attempts. Please try again later.",
          retryAfterSeconds: rateCheck.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateCheck.retryAfterSeconds),
          },
        }
      );
    }

    const db = getDbPool();
    const userRes = await db.query(
      `SELECT id, email, name, password_hash, role, is_active 
       FROM admin_users 
       WHERE email = $1 
       LIMIT 1;`,
      [email.toLowerCase()]
    );

    if (userRes.rows.length === 0) {
      recordLoginFailure(rateLimitKey);
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = userRes.rows[0];

    if (!user.is_active) {
      recordLoginFailure(rateLimitKey);
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const passwordValid = await verifyPassword(password, user.password_hash);
    if (!passwordValid) {
      recordLoginFailure(rateLimitKey);
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Login successful
    clearLoginRateLimit(rateLimitKey);
    const { token, expiresAt } = await createAdminSession(user.id, ip, userAgent);

    const response = NextResponse.json({
      success: true,
      message: "Authentication successful",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: isCookieSecure(),
      sameSite: "strict",
      path: "/",
      maxAge: SESSION_DURATION_HOURS * 60 * 60,
      expires: expiresAt,
    });

    return response;
  } catch (error: any) {
    console.error("[POST /api/admin/auth/login Error]:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during login." },
      { status: 500 }
    );
  }
}
