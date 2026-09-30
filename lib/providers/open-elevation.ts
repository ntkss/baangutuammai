/**
 * BaanGuTuamMai — Open-Elevation Provider
 *
 * Verified endpoint: https://api.open-elevation.com/api/v1/lookup
 * Auth:             None required
 * Source:           SRTM 90m DEM data (public domain)
 * Last verified:    2026-09-30 (live, returns 7.07m for Nonthaburi)
 *
 * IMPORTANT — From DATA_SOURCE_RESEARCH.md and SKILL.md:
 * Do NOT call this "ground floor elevation of the house."
 * Label all values as "estimated terrain elevation."
 * User can override with their actual floor elevation via settings.
 *
 * Precision: SRTM is ~30-90m resolution, ±5-15m vertical accuracy.
 * For MVP this is acceptable as a rough indicator.
 * Higher-res HII LiDAR data should replace this in Phase 2.
 */

// ─── Types ────────────────────────────────────────────────────────────────

type OpenElevationResult = {
  latitude: number;
  longitude: number;
  elevation: number; // metres MSL
};

type OpenElevationResponse = {
  results: OpenElevationResult[];
};

// ─── Provider ─────────────────────────────────────────────────────────────

const OPEN_ELEVATION_URL = "https://api.open-elevation.com/api/v1/lookup";

export type ElevationResult = {
  latitude: number;
  longitude: number;
  /** Estimated terrain elevation in metres above MSL (SRTM source) */
  terrainElevationM: number;
  source: "open-elevation/srtm";
  fetchedAt: string;
};

/**
 * Fetch terrain elevation for a single lat/lng point.
 * Returns null if the API is unavailable (graceful degradation).
 */
export async function fetchTerrainElevation(
  lat: number,
  lng: number
): Promise<ElevationResult | null> {
  try {
    const url = `${OPEN_ELEVATION_URL}?locations=${lat},${lng}`;

    const res = await fetch(url, {
      next: { revalidate: 86400 }, // Cache 24h — terrain doesn't change
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000), // 8s timeout
    });

    if (!res.ok) {
      console.warn(`[elevation] API returned ${res.status}`);
      return null;
    }

    const json: OpenElevationResponse = await res.json();
    const result = json.results?.[0];

    if (!result || result.elevation === undefined) {
      console.warn("[elevation] No result in response");
      return null;
    }

    return {
      latitude: lat,
      longitude: lng,
      terrainElevationM: result.elevation,
      source: "open-elevation/srtm",
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.warn("[elevation] Fetch failed:", err);
    return null;
  }
}

/**
 * Calculate elevation risk factor (0–1) from terrain elevation.
 *
 * Lower elevation = higher risk in flood-prone areas.
 * Thresholds based on Chao Phraya plain characteristics:
 * - < 0.5 m : extreme risk (below typical flood levels)
 * - 0.5–1.5 m : high risk
 * - 1.5–3.0 m : moderate risk
 * - 3.0–5.0 m : low risk
 * - > 5.0 m : very low risk
 *
 * Uses user's floor elevation if available, falls back to terrain DEM.
 */
export function calcElevationRisk(params: {
  terrainElevationM: number | null;
  floorElevationM?: number | null;
}): number {
  // Prefer user-supplied floor elevation over DEM terrain
  const elevM = params.floorElevationM ?? params.terrainElevationM;

  if (elevM === null || elevM === undefined) return 0.3; // unknown = moderate

  if (elevM < 0) return 1.0; // below sea level
  if (elevM < 0.5) return 0.9;
  if (elevM < 1.0) return 0.75;
  if (elevM < 1.5) return 0.6;
  if (elevM < 2.0) return 0.45;
  if (elevM < 3.0) return 0.3;
  if (elevM < 5.0) return 0.15;
  return 0.05;
}
