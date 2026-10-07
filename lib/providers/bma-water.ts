/**
 * BaanGuTuamMai — Bangkok Metropolitan Administration (BMA) Water Level Provider
 * สำนักการระบายน้ำ กรุงเทพมหานคร (Drainage and Sewerage Department - DDS)
 *
 * Sourced directly from BMA Drainage Department live telemetry:
 * Endpoint: https://weather.bangkok.go.th/water/PageMap/GoogleMap
 * Method:   POST
 * Auth:     Public (no API key required)
 * Cache:    300 seconds (5 mins) in-memory + Next.js revalidate
 *
 * Covers 311 canal and river telemetry stations across 50 districts of Bangkok
 * and bordering vicinities (Pathum Thani, Nonthaburi, Samut Prakan).
 */

import type {
  WaterStation,
  WaterObservation,
  FreshnessStatus,
} from "@/lib/types/domain";
import { normalizeWaterLevel } from "@/lib/risk/engine";
import fallbackBMAStations from "@/lib/data/bma-stations-fallback.json";

export type BMAWaterStationRaw = {
  water_id: number;
  water_code: string;
  water_name: string;
  water_name_en?: string;
  water_shortname?: string;
  water_shortname_en?: string;
  district_name: string;
  district_name_en?: string;
  river_name?: string;
  latitude: number;
  longitude: number;
  wl_in: number | null;
  warning: number | null;
  critical: number | null;
  txtStatus: string;
  txtStatus_en?: string;
  colorStatus: string;
  site_timestamp?: string; // "/Date(1791283500000)/"
  site_timestampTH?: string; // "06/10/2569 17:45"
  site_timestampEN?: string; // "2026/10/06 17:45"
  water_url?: string;
  adjust?: number;
};

const BMA_WATER_API_URL =
  "https://weather.bangkok.go.th/water/PageMap/GoogleMap";

// In-memory cache to guarantee fast response and resilience
let memoryCache: {
  data: BMAWaterStationRaw[];
  timestamp: number;
  isFallback: boolean;
} | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes for successful live data
const FALLBACK_CACHE_TTL_MS = 30 * 1000; // 30 seconds for fallback, so we retry soon

export type BMAFetchResponse = {
  data: BMAWaterStationRaw[];
  isFallback: boolean;
};

export async function fetchBMAStationsWithStatus(): Promise<BMAFetchResponse> {
  const now = Date.now();
  if (memoryCache) {
    const ttl = memoryCache.isFallback ? FALLBACK_CACHE_TTL_MS : CACHE_TTL_MS;
    if (now - memoryCache.timestamp < ttl) {
      return { data: memoryCache.data, isFallback: memoryCache.isFallback };
    }
  }

  const fallbackList =
    (fallbackBMAStations as unknown as BMAWaterStationRaw[]) ?? [];

  try {
    const res = await fetch(BMA_WATER_API_URL, {
      method: "POST",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Referer: "https://weather.bangkok.go.th/water/",
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json, text/javascript, */*; q=0.01",
      },
      body: "payload=TEST_DATA_GOES_HERE",
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.warn(
        `[bma-water] HTTP ${res.status}: ${res.statusText}, using fallback stations (${fallbackList.length})`,
      );
      memoryCache = {
        data: memoryCache?.data ?? fallbackList,
        timestamp: now,
        isFallback: true,
      };
      return {
        data: memoryCache.data,
        isFallback: true,
      };
    }

    const data: BMAWaterStationRaw[] = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      console.warn(
        `[bma-water] Response is empty, using fallback stations (${fallbackList.length})`,
      );
      memoryCache = {
        data: memoryCache?.data ?? fallbackList,
        timestamp: now,
        isFallback: true,
      };
      return {
        data: memoryCache.data,
        isFallback: true,
      };
    }

    memoryCache = {
      data,
      timestamp: now,
      isFallback: false,
    };

    return { data, isFallback: false };
  } catch (err) {
    console.warn(
      `[bma-water] Live fetch failed, using fallback stations (${fallbackList.length}):`,
      err instanceof Error ? err.message : err,
    );
    memoryCache = {
      data: memoryCache?.data ?? fallbackList,
      timestamp: now,
      isFallback: true,
    };
    return {
      data: memoryCache.data,
      isFallback: true,
    };
  }
}

export async function fetchRawBMAWaterStations(): Promise<
  BMAWaterStationRaw[]
> {
  const result = await fetchBMAStationsWithStatus();
  return result.data;
}

export type BMANearestResult = {
  raw: BMAWaterStationRaw;
  distKm: number;
  station: WaterStation;
  current: WaterObservation;
  criticalM: number | null;
  warningM: number | null;
  waterLevelRisk: number;
  freshness: FreshnessStatus;
  statusText: string;
  statusColor: string;
  isFallback: boolean;
};

export function calculateHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export async function findNearestBMAStation(
  lat: number,
  lng: number,
): Promise<BMANearestResult | null> {
  const { data: stations, isFallback } = await fetchBMAStationsWithStatus();
  if (stations.length === 0) return null;

  // Filter valid stations with coordinates and valid water level
  const valid = stations.filter(
    (s) =>
      typeof s.latitude === "number" &&
      typeof s.longitude === "number" &&
      s.latitude !== 0 &&
      s.longitude !== 0 &&
      typeof s.wl_in === "number" &&
      !isNaN(s.wl_in),
  );

  if (valid.length === 0) return null;

  // Calculate distance, preferring active stations over "ขัดข้อง" (offline/faulty sensor)
  // if an active station is nearby (within +1.5 km)
  let nearest: BMAWaterStationRaw | null = null;
  let minScore = Infinity;
  let minDist = Infinity;

  for (const s of valid) {
    const dist = calculateHaversineKm(lat, lng, s.latitude, s.longitude);
    const isFaulty = s.txtStatus?.includes("ขัดข้อง");
    const score = dist + (isFaulty ? 1.5 : 0);
    if (score < minScore) {
      minScore = score;
      minDist = dist;
      nearest = s;
    }
  }

  if (!nearest) return null;

  const currentLevelM = nearest.wl_in!;
  const warningM =
    typeof nearest.warning === "number" && !isNaN(nearest.warning)
      ? nearest.warning
      : null;
  const criticalM =
    typeof nearest.critical === "number" && !isNaN(nearest.critical)
      ? nearest.critical
      : null;

  // Compute risk score based on critical threshold or warning
  let waterLevelRisk = 0;
  if (criticalM !== null) {
    waterLevelRisk = normalizeWaterLevel(
      currentLevelM,
      criticalM,
      warningM ?? undefined,
    );
  } else if (nearest.txtStatus?.includes("วิกฤต")) {
    waterLevelRisk = 0.9;
  } else if (nearest.txtStatus?.includes("เตือน")) {
    waterLevelRisk = 0.6;
  } else {
    waterLevelRisk = 0.1;
  }

  // Parse observedAt date
  let observedAtIso = new Date().toISOString();
  let freshness: FreshnessStatus = "fresh";

  try {
    if (nearest.site_timestamp) {
      const match = nearest.site_timestamp.match(/\/Date\((\d+)\)\//);
      if (match) {
        const d = new Date(parseInt(match[1], 10));
        observedAtIso = d.toISOString();
        const ageHours = (Date.now() - d.getTime()) / (1000 * 60 * 60);
        if (ageHours > 6) freshness = "aging";
        if (ageHours > 24) freshness = "stale";
      }
    } else if (nearest.site_timestampEN) {
      const d = new Date(
        nearest.site_timestampEN.replace(/\//g, "-") + ":00+07:00",
      );
      observedAtIso = d.toISOString();
    }
  } catch {
    freshness = "fresh";
  }

  const district = nearest.district_name ? ` (${nearest.district_name})` : "";
  const river = nearest.river_name || "คลองในพื้นที่ กทม.";

  const station: WaterStation = {
    id: `bma-${nearest.water_id}`,
    provider: "สำนักการระบายน้ำ กทม.",
    externalId: nearest.water_code || String(nearest.water_id),
    name: `${nearest.water_name}${district}`,
    latitude: nearest.latitude,
    longitude: nearest.longitude,
    river,
    basin: "ลุ่มน้ำเจ้าพระยา (กทม.)",
    unit: "m",
    datum: "ม.รทก.",
    status: nearest.txtStatus?.includes("ขัดข้อง") ? "offline" : "active",
  };

  const current: WaterObservation = {
    stationId: station.id,
    observedAt: observedAtIso,
    fetchedAt: new Date().toISOString(),
    waterLevelM: currentLevelM,
    quality: isFallback ? "unverified" : "verified",
    provider: station.provider,
  };

  return {
    raw: nearest,
    distKm: Math.round(minDist * 10) / 10,
    station,
    current,
    criticalM,
    warningM,
    waterLevelRisk,
    freshness: isFallback ? "stale" : freshness,
    statusText: nearest.txtStatus || "ปกติ",
    statusColor: nearest.colorStatus || "#4caf50",
    isFallback,
  };
}
