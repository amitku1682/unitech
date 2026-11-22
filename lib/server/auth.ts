import crypto from "crypto";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { getDbPool } from "@/lib/server/db";

export const ADMIN_COOKIE_NAME = "unitech_admin_session";
export const SESSION_DURATION_HOURS = 8;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_WINDOW_MINUTES = 15;

export function isCookieSecure(): boolean {
  if (process.env.COOKIE_SECURE !== undefined && process.env.COOKIE_SECURE !== "") {
    return process.env.COOKIE_SECURE === "true" || process.env.COOKIE_SECURE === "1";
  }
  return process.env.NODE_ENV === "production";
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "editor";
  isActive: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminSession {
  id: string;
  adminUserId: string;
  expiresAt: Date;
  createdAt: Date;
  ip?: string;
  userAgent?: string;
}

// In-memory rate limiting for login attempts
interface RateLimitEntry {
  attempts: number;
  resetAt: number;
}
const loginRateLimitMap = new Map<string, RateLimitEntry>();

export function checkLoginRateLimit(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = loginRateLimitMap.get(key);

  if (!entry || entry.resetAt <= now) {
    loginRateLimitMap.set(key, { attempts: 0, resetAt: now + LOGIN_WINDOW_MINUTES * 60 * 1000 });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.attempts >= MAX_LOGIN_ATTEMPTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds: retryAfter };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordLoginFailure(key: string): void {
  const now = Date.now();
  const entry = loginRateLimitMap.get(key);
  if (!entry || entry.resetAt <= now) {
    loginRateLimitMap.set(key, { attempts: 1, resetAt: now + LOGIN_WINDOW_MINUTES * 60 * 1000 });
  } else {
    entry.attempts += 1;
  }
}

export function clearLoginRateLimit(key: string): void {
  loginRateLimitMap.delete(key);
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAdminSession(
  adminUserId: string,
  ip?: string,
  userAgent?: string
): Promise<{ token: string; expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString("hex");
  const sessionId = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  const db = getDbPool();
  await db.query(
    `INSERT INTO admin_sessions (id, admin_user_id, expires_at, ip, user_agent)
     VALUES ($1, $2, $3, $4, $5);`,
    [sessionId, adminUserId, expiresAt, ip || null, userAgent ? userAgent.substring(0, 500) : null]
  );

  // Update user last_login_at
  await db.query(
    `UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1;`,
    [adminUserId]
  );

  return { token, expiresAt };
}

export async function validateAdminSession(token: string): Promise<{ user: AdminUser; session: AdminSession } | null> {
  if (!token || typeof token !== "string" || token.length < 32) {
    return null;
  }

  try {
    const sessionId = hashToken(token);
    const db = getDbPool();

    const res = await db.query(
      `SELECT 
        s.id as session_id, s.admin_user_id, s.expires_at, s.created_at as session_created_at, s.ip, s.user_agent,
        u.id as user_id, u.email, u.name, u.role, u.is_active, u.last_login_at, u.created_at as user_created_at, u.updated_at as user_updated_at
       FROM admin_sessions s
       JOIN admin_users u ON s.admin_user_id = u.id
       WHERE s.id = $1 AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = true
       LIMIT 1;`,
      [sessionId]
    );

    if (res.rows.length === 0) {
      return null;
    }

    const row = res.rows[0];

    // Optional rolling session extension if within last 4 hours of expiry
    const expiresAt = new Date(row.expires_at);
    const now = Date.now();
    if (expiresAt.getTime() - now < 4 * 60 * 60 * 1000) {
      const newExpiry = new Date(now + SESSION_DURATION_HOURS * 60 * 60 * 1000);
      db.query(`UPDATE admin_sessions SET expires_at = $1 WHERE id = $2;`, [newExpiry, sessionId]).catch(() => {});
    }

    return {
      user: {
        id: row.user_id,
        email: row.email,
        name: row.name,
        role: row.role,
        isActive: row.is_active,
        lastLoginAt: row.last_login_at ? new Date(row.last_login_at) : undefined,
        createdAt: new Date(row.user_created_at),
        updatedAt: new Date(row.user_updated_at),
      },
      session: {
        id: row.session_id,
        adminUserId: row.admin_user_id,
        expiresAt: new Date(row.expires_at),
        createdAt: new Date(row.session_created_at),
        ip: row.ip,
        userAgent: row.user_agent,
      },
    };
  } catch (err) {
    console.error("[validateAdminSession Error]:", err);
    return null;
  }
}

export async function destroyAdminSession(token: string): Promise<boolean> {
  if (!token) return false;
  try {
    const sessionId = hashToken(token);
    const db = getDbPool();
    await db.query(`DELETE FROM admin_sessions WHERE id = $1;`, [sessionId]);
    return true;
  } catch (err) {
    console.error("[destroyAdminSession Error]:", err);
    return false;
  }
}

export function extractSessionToken(req: NextRequest): string | null {
  const cookieToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (cookieToken) return cookieToken;

  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Validates request session in the database.
 * Returns { user, session } if authenticated, or a 401 NextResponse if unauthorized.
 */
export async function requireAdmin(
  req: NextRequest
): Promise<{ user: AdminUser; session: AdminSession } | NextResponse> {
  const token = extractSessionToken(req);

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Admin session required." },
      { status: 401 }
    );
  }

  const authResult = await validateAdminSession(token);
  if (!authResult) {
    return NextResponse.json(
      { success: false, error: "Unauthorized: Invalid or expired session." },
      { status: 401 }
    );
  }

  return authResult;
}

export async function getAdminFromRequest(req: NextRequest): Promise<AdminUser | null> {
  const token = extractSessionToken(req);
  if (!token) return null;
  const authResult = await validateAdminSession(token);
  return authResult ? authResult.user : null;
}

export function isAuthError(result: any): result is NextResponse {
  return result instanceof NextResponse;
}

// Rate limiter for forgot-password: 3 requests per 15 minutes per IP and per email
const forgotPasswordRateLimitMap = new Map<string, { attempts: number; resetAt: number }>();

export function checkForgotPasswordRateLimit(ip: string, email: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const normalizedEmail = (email || "").toLowerCase().trim();
  const keys = [`ip:${ip || "unknown"}`, `email:${normalizedEmail}`];

  for (const key of keys) {
    const entry = forgotPasswordRateLimitMap.get(key);
    if (entry && entry.resetAt > now) {
      if (entry.attempts >= 3) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return { allowed: false, retryAfterSeconds: retryAfter };
      }
    }
  }

  // Increment attempts for both keys
  for (const key of keys) {
    const entry = forgotPasswordRateLimitMap.get(key);
    if (!entry || entry.resetAt <= now) {
      forgotPasswordRateLimitMap.set(key, { attempts: 1, resetAt: now + windowMs });
    } else {
      entry.attempts += 1;
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

// Rate limiter for change-password: 5 attempts per 15 minutes
const changePasswordRateLimitMap = new Map<string, { attempts: number; resetAt: number }>();

export function checkChangePasswordRateLimit(ip: string, adminId: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const keys = [`ip:${ip || "unknown"}`, `admin:${adminId}`];

  for (const key of keys) {
    const entry = changePasswordRateLimitMap.get(key);
    if (entry && entry.resetAt > now) {
      if (entry.attempts >= 5) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return { allowed: false, retryAfterSeconds: retryAfter };
      }
    }
  }

  // Increment attempts
  for (const key of keys) {
    const entry = changePasswordRateLimitMap.get(key);
    if (!entry || entry.resetAt <= now) {
      changePasswordRateLimitMap.set(key, { attempts: 1, resetAt: now + windowMs });
    } else {
      entry.attempts += 1;
    }
  }

  return { allowed: true, retryAfterSeconds: 0 };
}
