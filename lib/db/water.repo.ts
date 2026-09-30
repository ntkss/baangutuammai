/**
 * BaanGuTuamMai — Water station repository (Prisma + PostGIS)
 *
 * Non-spatial queries use Prisma ORM.
 * Spatial queries (proximity, distance) use prisma.$queryRaw with PostGIS.
 */

import { prisma } from "@/lib/db/client";
import { Prisma } from "@prisma/client";
import type {
  WaterStation,
  WaterObservation,
  FreshnessStatus,
} from "@/lib/types/domain";

// ─── Types ────────────────────────────────────────────────────────────────

type SpatialStationRow = {
  id: string;
  provider: string;
  external_id: string;
  name: string;
  lat: number;
  lng: number;
  river: string | null;
  basin: string | null;
  datum: string | null;
  unit: string;
  status: string | null;
  distance_km: number;
};

// ─── Mappers ─────────────────────────────────────────────────────────────

function prismaToWaterStation(row: {
  id: string;
  provider: string;
  externalId: string;
  name: string;
  river: string | null;
  basin: string | null;
  datum: string | null;
  unit: string;
  status: string | null;
}): WaterStation {
  return {
    id: row.id,
    provider: row.provider,
    externalId: row.externalId,
    name: row.name,
    latitude: 0,  // filled by spatial query
    longitude: 0, // filled by spatial query
    river: row.river ?? undefined,
    basin: row.basin ?? undefined,
    datum: row.datum ?? undefined,
    unit: row.unit,
    status: row.status ?? undefined,
  };
}

function spatialRowToStation(
  row: SpatialStationRow
): WaterStation & { distanceKm: number } {
  return {
    id: row.id,
    provider: row.provider,
    externalId: row.external_id,
    name: row.name,
    latitude: Number(row.lat),
    longitude: Number(row.lng),
    river: row.river ?? undefined,
    basin: row.basin ?? undefined,
    datum: row.datum ?? undefined,
    unit: row.unit,
    status: row.status ?? undefined,
    distanceKm: Number(row.distance_km),
  };
}

function prismaObsToWaterObservation(row: {
  stationId: string;
  observedAt: Date;
  fetchedAt: Date;
  waterLevelM: Prisma.Decimal | null;
  dischargeM3s: Prisma.Decimal | null;
  quality: string | null;
  provider: string;
}): WaterObservation {
  return {
    stationId: row.stationId,
    observedAt: row.observedAt.toISOString(),
    fetchedAt: row.fetchedAt.toISOString(),
    waterLevelM: row.waterLevelM !== null ? Number(row.waterLevelM) : undefined,
    dischargeM3s: row.dischargeM3s !== null ? Number(row.dischargeM3s) : undefined,
    quality: row.quality ?? undefined,
    provider: row.provider,
  };
}

// ─── Station queries ──────────────────────────────────────────────────────

/**
 * Find water stations within radiusKm of a point, ordered by distance.
 * Uses PostGIS ST_DWithin with geography casting for accurate km distances.
 */
export async function findNearbyWaterStations(
  lat: number,
  lng: number,
  radiusKm: number = 30,
  limit: number = 5
): Promise<Array<WaterStation & { distanceKm: number }>> {
  const rows = await prisma.$queryRaw<SpatialStationRow[]>`
    SELECT
      id,
      provider,
      external_id,
      name,
      ST_Y(location::geometry)  AS lat,
      ST_X(location::geometry)  AS lng,
      river,
      basin,
      datum,
      unit,
      status,
      ST_Distance(
        location::geography,
        ST_SetSRID(ST_MakePoint(${lng}::float, ${lat}::float), 4326)::geography
      ) / 1000 AS distance_km
    FROM water_stations
    WHERE
      status != 'offline'
      AND ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint(${lng}::float, ${lat}::float), 4326)::geography,
        ${radiusKm * 1000}::float
      )
    ORDER BY distance_km ASC
    LIMIT ${limit}
  `;

  return rows.map(spatialRowToStation);
}

/**
 * Get a single water station by id (Prisma ORM — no spatial needed).
 */
export async function getWaterStation(id: string): Promise<WaterStation | null> {
  const row = await prisma.waterStation.findUnique({ where: { id } });
  if (!row) return null;
  return { ...prismaToWaterStation(row), latitude: 0, longitude: 0 };
}

/**
 * Upsert a water station (used by ingestion jobs).
 * location must be set via raw SQL since Prisma doesn't support geometry writes.
 */
export async function upsertWaterStation(station: WaterStation): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO water_stations
      (id, provider, external_id, name, location, river, basin, datum, unit, status, updated_at)
    VALUES (
      ${station.id},
      ${station.provider},
      ${station.externalId},
      ${station.name},
      ST_SetSRID(ST_MakePoint(${station.longitude}::float, ${station.latitude}::float), 4326),
      ${station.river ?? null},
      ${station.basin ?? null},
      ${station.datum ?? null},
      ${station.unit},
      ${station.status ?? "unknown"},
      NOW()
    )
    ON CONFLICT (provider, external_id) DO UPDATE SET
      name       = EXCLUDED.name,
      location   = EXCLUDED.location,
      river      = EXCLUDED.river,
      basin      = EXCLUDED.basin,
      datum      = EXCLUDED.datum,
      unit       = EXCLUDED.unit,
      status     = EXCLUDED.status,
      updated_at = NOW()
  `;
}

// ─── Observation queries ──────────────────────────────────────────────────

/**
 * Get the most recent water observation for a station.
 */
export async function getLatestWaterObservation(
  stationId: string
): Promise<WaterObservation | null> {
  const row = await prisma.waterObservation.findFirst({
    where: { stationId },
    orderBy: { observedAt: "desc" },
  });
  if (!row) return null;
  return prismaObsToWaterObservation(row);
}

/**
 * Get water observations for a station within a time range (ascending).
 */
export async function getWaterObservations(
  stationId: string,
  from: Date,
  to: Date
): Promise<WaterObservation[]> {
  const rows = await prisma.waterObservation.findMany({
    where: {
      stationId,
      observedAt: { gte: from, lte: to },
    },
    orderBy: { observedAt: "asc" },
  });
  return rows.map(prismaObsToWaterObservation);
}

/**
 * Bulk insert water observations (used by ingestion job).
 * Uses createMany with skipDuplicates for performance.
 */
export async function insertWaterObservations(
  observations: WaterObservation[]
): Promise<number> {
  if (observations.length === 0) return 0;

  const result = await prisma.waterObservation.createMany({
    data: observations.map((obs) => ({
      stationId: obs.stationId,
      observedAt: new Date(obs.observedAt),
      fetchedAt: new Date(obs.fetchedAt),
      waterLevelM: obs.waterLevelM ?? null,
      dischargeM3s: obs.dischargeM3s ?? null,
      quality: obs.quality ?? null,
      provider: obs.provider,
    })),
    skipDuplicates: true,
  });

  return result.count;
}

// ─── Freshness ────────────────────────────────────────────────────────────

export function getWaterFreshness(
  latestObservation: WaterObservation | null,
  expectedIntervalMinutes: number = 10
): FreshnessStatus {
  if (!latestObservation) return "unavailable";

  const ageMs = Date.now() - new Date(latestObservation.observedAt).getTime();
  const ageMins = ageMs / 60_000;

  if (ageMins <= expectedIntervalMinutes * 2) return "fresh";
  if (ageMins <= expectedIntervalMinutes * 6) return "aging";
  if (ageMins <= 120) return "stale";
  return "unavailable";
}
