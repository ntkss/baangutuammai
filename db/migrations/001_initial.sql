-- ============================================================
-- BaanGuTuamMai — Initial Database Schema
-- Migration: 001_initial.sql
--
-- Requires: PostgreSQL 14+ with PostGIS extension
--
-- Run:
--   psql -d <DATABASE_URL> -f db/migrations/001_initial.sql
-- ============================================================

-- Enable PostGIS (must be run by superuser once per database)
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- ─── Data source registry ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS data_sources (
  id                     TEXT PRIMARY KEY,
  name                   TEXT NOT NULL,
  organization           TEXT NOT NULL,
  category               TEXT NOT NULL CHECK (
    category IN ('water_level','rainfall','reservoir','infrastructure','tide','elevation','historical_flood')
  ),
  base_url               TEXT NOT NULL,
  endpoint               TEXT,
  auth_type              TEXT NOT NULL DEFAULT 'none' CHECK (
    auth_type IN ('none','api_key','oauth','other')
  ),
  update_frequency_min   INTEGER,       -- expected update interval in minutes
  historical_start_year  INTEGER,
  format                 TEXT,
  license                TEXT,
  attribution            TEXT,
  status                 TEXT NOT NULL DEFAULT 'unverified' CHECK (
    status IN ('verified','partially_verified','research_only','unverified','deprecated')
  ),
  last_verified_at       TIMESTAMPTZ,
  notes                  TEXT,

  -- Runtime ingestion health
  last_successful_fetch  TIMESTAMPTZ,
  last_observation_time  TIMESTAMPTZ,
  fetch_status           TEXT CHECK (fetch_status IN ('ok','error','degraded')),
  error_message          TEXT,

  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Water stations ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS water_stations (
  id            TEXT PRIMARY KEY,
  provider      TEXT NOT NULL,              -- e.g. 'HII', 'DWR'
  external_id   TEXT NOT NULL,             -- ID as used by the provider
  name          TEXT NOT NULL,
  location      GEOMETRY(Point, 4326),     -- PostGIS point (lon, lat)
  river         TEXT,
  basin         TEXT,
  datum         TEXT,                      -- vertical reference description
  unit          TEXT NOT NULL DEFAULT 'm',
  status        TEXT DEFAULT 'unknown',    -- active / offline / unknown
  metadata      JSONB,                     -- provider-specific extras
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (provider, external_id)
);

CREATE INDEX IF NOT EXISTS idx_water_stations_location
  ON water_stations USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_water_stations_provider
  ON water_stations (provider);

-- ─── Water observations ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS water_observations (
  id               BIGSERIAL PRIMARY KEY,
  station_id       TEXT NOT NULL REFERENCES water_stations(id) ON DELETE CASCADE,
  observed_at      TIMESTAMPTZ NOT NULL,
  fetched_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  water_level_m    NUMERIC(8,3),
  discharge_m3s    NUMERIC(10,3),
  quality          TEXT,
  provider         TEXT NOT NULL,
  raw_value        TEXT,                   -- original string from provider before parsing

  UNIQUE (station_id, observed_at)
);

CREATE INDEX IF NOT EXISTS idx_water_obs_station_time
  ON water_observations (station_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_water_obs_observed_at
  ON water_observations (observed_at DESC);

-- ─── Rainfall stations ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rain_stations (
  id            TEXT PRIMARY KEY,
  provider      TEXT NOT NULL,
  external_id   TEXT NOT NULL,
  name          TEXT NOT NULL,
  location      GEOMETRY(Point, 4326),
  basin         TEXT,
  status        TEXT DEFAULT 'unknown',
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (provider, external_id)
);

CREATE INDEX IF NOT EXISTS idx_rain_stations_location
  ON rain_stations USING GIST (location);

-- ─── Rainfall observations ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS rain_observations (
  id              BIGSERIAL PRIMARY KEY,
  station_id      TEXT NOT NULL REFERENCES rain_stations(id) ON DELETE CASCADE,
  observed_at     TIMESTAMPTZ NOT NULL,
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rainfall_mm     NUMERIC(8,2),
  window_hours    NUMERIC(4,1),           -- accumulation window (null = instantaneous)
  provider        TEXT NOT NULL,

  UNIQUE (station_id, observed_at, window_hours)
);

CREATE INDEX IF NOT EXISTS idx_rain_obs_station_time
  ON rain_observations (station_id, observed_at DESC);

-- ─── Reservoirs ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reservoirs (
  id              TEXT PRIMARY KEY,
  provider        TEXT NOT NULL,
  external_id     TEXT NOT NULL,
  name            TEXT NOT NULL,
  location        GEOMETRY(Point, 4326),
  capacity_mcm    NUMERIC(12,3),          -- million cubic metres
  metadata        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (provider, external_id)
);

CREATE INDEX IF NOT EXISTS idx_reservoirs_location
  ON reservoirs USING GIST (location);

-- ─── Reservoir observations ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reservoir_observations (
  id                BIGSERIAL PRIMARY KEY,
  reservoir_id      TEXT NOT NULL REFERENCES reservoirs(id) ON DELETE CASCADE,
  observed_at       TIMESTAMPTZ NOT NULL,
  fetched_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  storage_mcm       NUMERIC(12,3),
  storage_percent   NUMERIC(5,2),
  inflow_m3s        NUMERIC(10,3),
  outflow_m3s       NUMERIC(10,3),
  provider          TEXT NOT NULL,

  UNIQUE (reservoir_id, observed_at)
);

CREATE INDEX IF NOT EXISTS idx_reservoir_obs_id_time
  ON reservoir_observations (reservoir_id, observed_at DESC);

-- ─── Infrastructure assets (gates, pumps, weirs) ─────────────────────────

CREATE TABLE IF NOT EXISTS infrastructure_assets (
  id            TEXT PRIMARY KEY,
  provider      TEXT NOT NULL,
  external_id   TEXT NOT NULL,
  name          TEXT NOT NULL,
  asset_type    TEXT NOT NULL CHECK (asset_type IN ('gate','pump','weir','other')),
  location      GEOMETRY(Point, 4326),
  river         TEXT,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (provider, external_id)
);

CREATE INDEX IF NOT EXISTS idx_infra_assets_location
  ON infrastructure_assets USING GIST (location);

-- ─── Infrastructure observations ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS infrastructure_observations (
  id                BIGSERIAL PRIMARY KEY,
  asset_id          TEXT NOT NULL REFERENCES infrastructure_assets(id) ON DELETE CASCADE,
  observed_at       TIMESTAMPTZ NOT NULL,
  fetched_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status            TEXT,
  opening_percent   NUMERIC(5,2),
  flow_m3s          NUMERIC(10,3),
  provider          TEXT NOT NULL,

  UNIQUE (asset_id, observed_at)
);

-- ─── Historical observations (2011, 2017, 2021...) ────────────────────────

CREATE TABLE IF NOT EXISTS historical_observations (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  station_id          TEXT NOT NULL REFERENCES water_stations(id),
  event_year          INTEGER NOT NULL,       -- 2011, 2017, 2021...
  observed_date       DATE NOT NULL,
  water_level_m       NUMERIC(8,3),
  rainfall_mm         NUMERIC(8,2),
  known_flood_status  TEXT,                   -- flooded / near-flood / normal
  source              TEXT NOT NULL,          -- RID PDF, HII archive, etc.
  datum               TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (station_id, event_year, observed_date)
);

CREATE INDEX IF NOT EXISTS idx_hist_obs_station_year
  ON historical_observations (station_id, event_year, observed_date);

-- ─── Historical flood extents (PostGIS polygons) ─────────────────────────

CREATE TABLE IF NOT EXISTS historical_flood_extents (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  event_year        INTEGER NOT NULL,
  source            TEXT NOT NULL,           -- GISTDA, RID, academic, etc.
  geometry          GEOMETRY(MultiPolygon, 4326),
  acquisition_date  DATE,
  confidence        TEXT CHECK (confidence IN ('high','medium','low')),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flood_extents_geom
  ON historical_flood_extents USING GIST (geometry);
CREATE INDEX IF NOT EXISTS idx_flood_extents_year
  ON historical_flood_extents (event_year);

-- ─── Risk assessments (cached results) ───────────────────────────────────

CREATE TABLE IF NOT EXISTS risk_assessments (
  id                            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  location_lat                  NUMERIC(9,6) NOT NULL,
  location_lng                  NUMERIC(9,6) NOT NULL,
  location_label                TEXT,
  generated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  level                         TEXT NOT NULL CHECK (level IN ('low','watch','high','severe')),
  score                         NUMERIC(4,3) NOT NULL,
  confidence                    TEXT NOT NULL CHECK (confidence IN ('high','medium','limited')),
  water_level_risk              NUMERIC(4,3),
  water_trend_risk              NUMERIC(4,3),
  rainfall_risk                 NUMERIC(4,3),
  upstream_risk                 NUMERIC(4,3),
  infrastructure_risk           NUMERIC(4,3),
  tide_risk                     NUMERIC(4,3),
  elevation_risk                NUMERIC(4,3),
  reasons                       TEXT[],
  recommended_action            TEXT,
  distance_to_critical_level_m  NUMERIC(6,2),
  estimated_elevation_margin_m  NUMERIC(6,2),
  primary_station_id            TEXT REFERENCES water_stations(id),
  weights_used                  JSONB,       -- snapshot of weights at assessment time
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_assessments_location
  ON risk_assessments (location_lat, location_lng, generated_at DESC);

-- ─── Ingestion job log ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ingestion_job_log (
  id            BIGSERIAL PRIMARY KEY,
  job_name      TEXT NOT NULL,           -- e.g. 'water-level-hii'
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at   TIMESTAMPTZ,
  status        TEXT CHECK (status IN ('running','ok','error','partial')),
  records_ingested INTEGER DEFAULT 0,
  error_message TEXT,
  metadata      JSONB
);

CREATE INDEX IF NOT EXISTS idx_ingestion_log_job_time
  ON ingestion_job_log (job_name, started_at DESC);

-- ─── Seed: known verified data sources ───────────────────────────────────

INSERT INTO data_sources (id, name, organization, category, base_url, status, format, license, attribution, notes)
VALUES
  (
    'hii-water-level',
    'HII Water Level',
    'Hydro-Informatics Institute (HII)',
    'water_level',
    'https://data.go.th/dataset/water-level',
    'partially_verified',
    'CSV',
    'CC BY-NC',
    'สถาบันสารสนเทศทรัพยากรน้ำ (HII)',
    'ThaiWater Standard format from Feb 2026. 10-minute intervals. Datum: ม.รทก. Missing values: -999, 999999, 9999, -'
  ),
  (
    'hii-rainfall',
    'HII Rainfall',
    'Hydro-Informatics Institute (HII)',
    'rainfall',
    'https://data.go.th/dataset/hii-rainfall',
    'partially_verified',
    'CSV/JSON',
    'CC BY-NC',
    'สถาบันสารสนเทศทรัพยากรน้ำ (HII)',
    'Hourly and daily accumulated rainfall in mm.'
  ),
  (
    'dwr-rainfall',
    'DWR Rainfall (EWS)',
    'Department of Water Resources (DWR)',
    'rainfall',
    'https://data.go.th/dataset/rainfall',
    'partially_verified',
    'JSON',
    'Open Government',
    'กรมทรัพยากรน้ำ (DWR)',
    'Early Warning System telemetry. Second independent rainfall source for confidence cross-check.'
  ),
  (
    'rid-reservoir',
    'RID Reservoir API',
    'Royal Irrigation Department (RID)',
    'reservoir',
    'https://app.rid.go.th/reservoir/api/document/dam',
    'partially_verified',
    'JSON',
    'Open Government',
    'กรมชลประทาน (RID)',
    'Fields: date, total, id, name, capacity, storage, active_storage, inflow, outflow, percent_storage.'
  ),
  (
    'hii-terrain',
    'HII Terrain / DEM',
    'Hydro-Informatics Institute (HII)',
    'elevation',
    'https://data.go.th/dataset/terrain',
    'research_only',
    'GeoTIFF/GIS service',
    'CC BY-NC',
    'สถาบันสารสนเทศทรัพยากรน้ำ (HII)',
    'LiDAR, drone, mobile mapping. High positional accuracy. Referenced to MSL.'
  ),
  (
    'thaiwater-standard',
    'ThaiWater Standard API',
    'Hydro-Informatics Institute (HII)',
    'water_level',
    'https://standard.thaiwater.net/',
    'research_only',
    'JSON',
    'CC BY-NC',
    'ThaiWater Standard',
    'Standardized API A001.1 (water level), A002.1 (runoff). Must verify endpoints before use.'
  )
ON CONFLICT (id) DO NOTHING;
