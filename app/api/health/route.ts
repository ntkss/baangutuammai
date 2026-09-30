/**
 * BaanGuTuamMai — Health check API
 *
 * GET /api/health
 *
 * Returns app status and timestamp.
 * No database in use — returns "not_configured" for database field.
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    version: "0.1.0-phase1",
    database: "not_configured",
  });
}
