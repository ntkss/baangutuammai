/**
 * BaanGuTuamMai — Health check API (updated for Prisma)
 *
 * GET /api/health
 */

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const status: {
    ok: boolean;
    timestamp: string;
    version: string;
    database: "connected" | "unavailable" | "not_configured";
  } = {
    ok: true,
    timestamp: new Date().toISOString(),
    version: "0.1.0-phase1",
    database: "not_configured",
  };

  if (process.env.DATABASE_URL) {
    try {
      const { checkDatabaseHealth } = await import("@/lib/db/client");
      const healthy = await checkDatabaseHealth();
      status.database = healthy ? "connected" : "unavailable";
      if (!healthy) status.ok = false;
    } catch {
      status.database = "unavailable";
      status.ok = false;
    }
  }

  return NextResponse.json(status, { status: status.ok ? 200 : 503 });
}
