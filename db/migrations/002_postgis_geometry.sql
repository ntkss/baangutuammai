-- ============================================================
-- BaanGuTuamMai — PostGIS geometry columns
-- Migration: 002_postgis_geometry.sql
--
-- Adds geometry columns to tables created by Prisma Migrate.
-- Run AFTER `prisma db push` or `prisma migrate deploy`.
--
-- Prisma cannot manage geometry columns natively,
-- so they are added here as a supplemental migration.
-- ============================================================

-- Enable PostGIS (superuser required, idempotent)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Add geometry column to water_stations (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'water_stations' AND column_name = 'location'
  ) THEN
    ALTER TABLE water_stations
      ADD COLUMN location GEOMETRY(Point, 4326);

    CREATE INDEX idx_water_stations_location
      ON water_stations USING GIST (location);
  END IF;
END $$;

-- Add geometry column to rain_stations
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'rain_stations' AND column_name = 'location'
  ) THEN
    ALTER TABLE rain_stations
      ADD COLUMN location GEOMETRY(Point, 4326);

    CREATE INDEX idx_rain_stations_location
      ON rain_stations USING GIST (location);
  END IF;
END $$;

-- Add geometry column to reservoirs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'reservoirs' AND column_name = 'location'
  ) THEN
    ALTER TABLE reservoirs
      ADD COLUMN location GEOMETRY(Point, 4326);

    CREATE INDEX idx_reservoirs_location
      ON reservoirs USING GIST (location);
  END IF;
END $$;

-- Add geometry column to infrastructure_assets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'infrastructure_assets' AND column_name = 'location'
  ) THEN
    ALTER TABLE infrastructure_assets
      ADD COLUMN location GEOMETRY(Point, 4326);

    CREATE INDEX idx_infra_assets_location
      ON infrastructure_assets USING GIST (location);
  END IF;
END $$;

-- Historical flood extents table (not in Prisma schema — pure PostGIS)
CREATE TABLE IF NOT EXISTS historical_flood_extents (
  id                TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  event_year        INTEGER     NOT NULL,
  source            TEXT        NOT NULL,
  geometry          GEOMETRY(MultiPolygon, 4326),
  acquisition_date  DATE,
  confidence        TEXT        CHECK (confidence IN ('high','medium','low')),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flood_extents_geom
  ON historical_flood_extents USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_flood_extents_year
  ON historical_flood_extents (event_year);
