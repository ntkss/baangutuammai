/**
 * BaanGuTuamMai — PostGIS supplemental migration runner
 *
 * Applies SQL files from db/migrations/ that cannot be handled by Prisma Migrate
 * (i.e., PostGIS geometry columns and spatial indexes).
 *
 * Usage:
 *   npm run db:postgis
 *   -- or via full setup --
 *   npm run db:setup   (runs prisma db push THEN this)
 *
 * Run AFTER prisma db push / prisma migrate deploy.
 * All files use IF NOT EXISTS / idempotent patterns — safe to re-run.
 */

import fs from "fs";
import path from "path";
import { Pool } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const MIGRATIONS_DIR = path.join(__dirname, "migrations");

// Only run supplemental files (PostGIS etc.), skip 001 which is the legacy raw schema
const SKIP_FILES = ["001_initial.sql"];

async function runPostgisMigrations() {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("❌  Neither DIRECT_URL nor DATABASE_URL is set in .env.local");
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith(".sql") && !SKIP_FILES.includes(f))
      .sort();

    if (files.length === 0) {
      console.log("ℹ️  No supplemental migrations to run.");
      return;
    }

    console.log(`📂  Found ${files.length} supplemental migration(s)`);

    for (const file of files) {
      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(filePath, "utf8");

      console.log(`▶   Running: ${file}`);
      await pool.query(sql);
      console.log(`✓   Done: ${file}`);
    }

    console.log("\n✅  PostGIS migrations applied successfully.");
    console.log("    Spatial columns and indexes are ready.");
  } catch (err) {
    console.error("❌  PostGIS migration failed:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runPostgisMigrations();
