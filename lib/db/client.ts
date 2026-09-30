/**
 * BaanGuTuamMai — Prisma client with Neon serverless adapter
 *
 * Uses @prisma/adapter-neon so the same Prisma client works in:
 *   - Vercel Serverless Functions
 *   - Vercel Edge Functions (with Neon HTTP driver)
 *   - Local development (via direct Neon connection)
 *
 * Environment variables required:
 *   DATABASE_URL  — Neon pooled connection string (for runtime)
 *   DIRECT_URL    — Neon direct connection string (for Prisma Migrate)
 *
 * Get both from: https://console.neon.tech → your project → Connection Details
 */

import { PrismaClient } from "@prisma/client";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";

// WebSocket is needed for Neon serverless in Node.js environments.
// In Edge runtime (Vercel Edge Functions), this is handled natively.
if (typeof window === "undefined" && process.env.NODE_ENV !== "test") {
  // Dynamic import to avoid bundling ws in edge runtime
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  neonConfig.webSocketConstructor = require("ws");
}

// ─── Singleton Prisma client ───────────────────────────────────────────────

declare global {
  // Prevent multiple Prisma instances during Next.js hot reload
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set.\n" +
      "Copy .env.local.example to .env.local and fill in your Neon connection strings."
    );
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaNeon(pool);

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
  });
}

export const prisma: PrismaClient =
  globalThis.__prisma ?? (globalThis.__prisma = createPrismaClient());

// ─── Raw spatial query helper ──────────────────────────────────────────────

/**
 * Execute a raw PostGIS query and return typed rows.
 * Use this for ST_DWithin, ST_Distance, ST_Contains, etc.
 *
 * Example:
 *   const rows = await spatialQuery<{ id: string; distance_km: number }>(
 *     sql`SELECT id, ST_Distance(...) / 1000 AS distance_km FROM water_stations WHERE ...`
 *   );
 */
export async function spatialQuery<T>(
  sql: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  // prisma.$queryRaw accepts tagged template literals
  return prisma.$queryRaw<T[]>(sql, ...values) as Promise<T[]>;
}

// ─── Health check ──────────────────────────────────────────────────────────

export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
