import { NextRequest, NextResponse } from "next/server";

// In-memory rate limiting table: routeKey:ip -> { count, resetAt }
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const rateLimitBuckets = new Map<string, RateLimitBucket>();

function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfter: number } {
  const now = Date.now();

  // Prune expired buckets if table grows large
  if (rateLimitBuckets.size > 5000) {
    for (const [k, b] of rateLimitBuckets.entries()) {
      if (b.resetAt <= now) {
        rateLimitBuckets.delete(k);
      }
    }
  }

  const bucket = rateLimitBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count++;
  return { allowed: true, retryAfter: 0 };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  // 1. Rate Limiting for Public Endpoints (SEC-HIGH-06)
  if (request.method === "POST") {
    let limit = 0;
    let windowMs = 0;
    let rateKey = "";

    if (pathname === "/api/enquiries") {
      // 5 requests / 10 min / IP
      limit = 5;
      windowMs = 10 * 60 * 1000;
      rateKey = `enquiries:${ip}`;
    } else if (pathname === "/api/orders") {
      // 10 requests / 10 min / IP
      limit = 10;
      windowMs = 10 * 60 * 1000;
      rateKey = `orders:${ip}`;
    } else if (pathname === "/api/search/log") {
      // 60 requests / 1 min / IP
      limit = 60;
      windowMs = 60 * 1000;
      rateKey = `search_log:${ip}`;
    } else if (pathname.startsWith("/api/flash-sale/") && pathname.endsWith("/claim")) {
      // 10 requests / 10 min / IP
      limit = 10;
      windowMs = 10 * 60 * 1000;
      rateKey = `flash_claim:${ip}`;
    }

    if (limit > 0) {
      const rl = checkRateLimit(rateKey, limit, windowMs);
      if (!rl.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: "Too many requests. Please slow down and try again later.",
            retryAfterSeconds: rl.retryAfter,
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(rl.retryAfter),
            },
          }
        );
      }
    }
  }

  // 2. Admin API Gate: /api/admin/* (SEC-CRIT-01)
  if (pathname.startsWith("/api/admin/")) {
    // Whitelist unauthenticated auth endpoints: login, forgot-password, reset-password
    const isPublicAuth =
      pathname.startsWith("/api/admin/auth/login") ||
      pathname.startsWith("/api/admin/auth/forgot-password") ||
      pathname.startsWith("/api/admin/auth/reset-password");

    if (!isPublicAuth) {
      const sessionCookie = request.cookies.get("unitech_admin_session")?.value;
      const authHeader = request.headers.get("authorization");
      if (!sessionCookie && (!authHeader || !authHeader.toLowerCase().startsWith("bearer "))) {
        return NextResponse.json(
          { success: false, error: "Unauthorized: Admin session required." },
          { status: 401 }
        );
      }

      // CSRF check on mutating methods
      if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
        const origin = request.headers.get("origin");
        const host = request.headers.get("host");
        if (origin && host) {
          const originHost = origin.replace(/^https?:\/\//, "");
          if (originHost !== host) {
            return NextResponse.json(
              { success: false, error: "Forbidden: CSRF validation failed." },
              { status: 403 }
            );
          }
        }
      }
    }
  }

  // 3. Prepare response with Security Headers (SEC-HIGH-05)
  const response = NextResponse.next();

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self'",
    "frame-src 'self' https://www.google.com https://maps.google.com",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // HSTS only sent for HTTPS requests
  const proto = request.headers.get("x-forwarded-proto") || (request.url.startsWith("https://") ? "https" : "http");
  if (proto === "https") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
