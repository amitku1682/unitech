import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/server/auth";
import { initializeDatabase, getDbPool } from "@/lib/server/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin(req);
    if (isAuthError(auth)) return auth;

    const ready = await initializeDatabase();
    if (!ready) {
      return NextResponse.json(
        {
          success: false,
          connected: false,
          error: "Database initialization failed or unreachable.",
        },
        { status: 500 }
      );
    }

    const pool = getDbPool();
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name ASC;
    `);

    const tables = result.rows.map((r: any) => r.table_name);

    return NextResponse.json({
      success: true,
      connected: true,
      tablesCount: tables.length,
      tables,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}

