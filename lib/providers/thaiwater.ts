/**
 * BaanGuTuamMai — ThaiWater River Water Level Provider
 *
 * Sourced directly from HII / ThaiWater public telemetry API:
 * Endpoint: https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load
 * Auth:     None required (Public open telemetry)
 * Cache:    300 seconds (5 mins)
 *
 * Real-time water levels referenced to Mean Sea Level (ม.รทก.),
 * river bank thresholds, trends, C.2 Nakhon Sawan discharge,
 * C.13 Chao Phraya Dam release, and upstream/nearest/downstream corridor.
 */

import type {
  WaterStation,
  WaterObservation,
  FreshnessStatus,
} from "@/lib/types/domain";
import { normalizeWaterLevel, normalizeWaterTrend } from "@/lib/risk/engine";
import { findNearestBMAStation } from "@/lib/providers/bma-water";

export type ThaiWaterStationRaw = {
  id: number;
  waterlevel_datetime: string; // "YYYY-MM-DD HH:mm"
  waterlevel_m: number | null;
  waterlevel_msl: string | null;
  waterlevel_msl_previous: string | null;
  flow_rate: number | null;
  discharge: string | null;
  storage_percent: string | null;
  situation_level: number;
  agency?: {
    agency_name?: { th?: string; en?: string };
    agency_shortname?: { th?: string; en?: string };
  };
  basin?: {
    basin_name?: { th?: string; en?: string };
  };
  station: {
    id: number;
    tele_station_name: { th?: string; en?: string };
    tele_station_lat: number;
    tele_station_long: number;
    tele_station_oldcode?: string;
    left_bank?: number | null;
    right_bank?: number | null;
    min_bank?: number | null;
    ground_level?: number | null;
    is_key_station?: boolean;
    critical_level_msl?: number | null;
  };
  geocode?: {
    province_name?: { th?: string; en?: string };
    amphoe_name?: { th?: string; en?: string };
    tumbon_name?: { th?: string; en?: string };
  };
  diff_wl_bank?: string | null;
  diff_wl_bank_text?: string | null;
  river_name?: string | null;
};

export type ThaiWaterResponse = {
  waterlevel_data: {
    result: string;
    data: ThaiWaterStationRaw[];
  };
};

export type KeyRiverStation = {
  stationCode: string;
  stationName: string;
  province: string;
  district?: string;
  river: string;
  waterLevelM: number;
  bankLevelM: number | null;
  diffBankM: number | null;
  diffBankText?: string;
  dischargeM3s: number | null; // cubic meters / second
  datetime: string;
  situationLevel: number;
  latitude: number;
  longitude: number;
  distanceKm?: number;
};

export type NorthernRunoffSummary = {
  c2NakhonSawan: KeyRiverStation | null;
  c13ChaoPhrayaDam: KeyRiverStation | null;
  corridor: {
    upstream: KeyRiverStation | null;
    nearest: KeyRiverStation | null;
    downstream: KeyRiverStation | null;
  };
};

export type RealWaterResult = {
  station: WaterStation;
  current: WaterObservation;
  rateMetersPerHour: number | null;
  trend6h: number | null;
  trend12h: number | null;
  trend24h: number | null;
  waterLevelRisk: number;
  waterTrendRisk: number;
  freshness: FreshnessStatus;
  distanceKm: number;
  bankLevelM: number | null;
  diffBankM: number | null;
  diffBankText?: string;
  northernRunoff: NorthernRunoffSummary;
};

function calculateHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return 6371 * c;
}

function parseKeyStation(
  s: ThaiWaterStationRaw,
  distKm?: number,
): KeyRiverStation {
  const currentLevelM = s.waterlevel_msl ? parseFloat(s.waterlevel_msl) : 0;
  const bankLevelM =
    s.station.min_bank && !isNaN(s.station.min_bank)
      ? s.station.min_bank
      : s.station.critical_level_msl && !isNaN(s.station.critical_level_msl)
        ? s.station.critical_level_msl
        : null;

  const diffBankM =
    s.diff_wl_bank && !isNaN(parseFloat(s.diff_wl_bank))
      ? parseFloat(s.diff_wl_bank)
      : bankLevelM !== null
        ? bankLevelM - currentLevelM
        : null;

  return {
    stationCode: s.station.tele_station_oldcode || String(s.station.id),
    stationName:
      s.station.tele_station_name.th ||
      s.station.tele_station_name.en ||
      `สถานี ${s.station.id}`,
    province: s.geocode?.province_name?.th || "",
    district: s.geocode?.amphoe_name?.th || "",
    river: s.river_name || s.basin?.basin_name?.th || "แม่น้ำเจ้าพระยา",
    waterLevelM: currentLevelM,
    bankLevelM,
    diffBankM,
    diffBankText: s.diff_wl_bank_text ?? undefined,
    dischargeM3s: s.discharge ? parseFloat(s.discharge) : null,
    datetime: s.waterlevel_datetime,
    situationLevel: s.situation_level,
    latitude: s.station.tele_station_lat,
    longitude: s.station.tele_station_long,
    distanceKm: distKm !== undefined ? Math.round(distKm * 10) / 10 : undefined,
  };
}

const THAIWATER_API_URL =
  "https://api-v3.thaiwater.net/api/v1/thaiwater30/public/waterlevel_load";

export async function fetchRawThaiWaterStations(): Promise<
  ThaiWaterStationRaw[]
> {
  const res = await fetch(THAIWATER_API_URL, {
    next: { revalidate: 300 }, // 5 mins cache
    headers: {
      Accept: "application/json",
      "User-Agent": "BaanGuTuamMai/1.0",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  const json: ThaiWaterResponse = await res.json();
  return json?.waterlevel_data?.data ?? [];
}

export async function fetchRealWaterLevel(
  lat: number,
  lng: number,
): Promise<RealWaterResult | null> {
  try {
    const stations = await fetchRawThaiWaterStations();
    if (!Array.isArray(stations) || stations.length === 0) {
      return null;
    }

    // Filter to stations with valid waterlevel_msl and coordinates
    const validStations = stations.filter((s) => {
      if (
        !s.waterlevel_msl ||
        s.waterlevel_msl === "-999" ||
        s.waterlevel_msl === "null"
      )
        return false;
      if (!s.station?.tele_station_lat || !s.station?.tele_station_long)
        return false;
      const wl = parseFloat(s.waterlevel_msl);
      return !isNaN(wl);
    });

    if (validStations.length === 0) return null;

    // ── 1. Find C.2 Nakhon Sawan (ค่ายจิรประวัติ) ───────────────────────────
    const rawC2 =
      validStations.find(
        (s) =>
          s.station.tele_station_oldcode === "C.2" ||
          s.station.tele_station_name.th?.includes("ค่ายจิรประวัติ"),
      ) ?? null;
    const c2NakhonSawan = rawC2 ? parseKeyStation(rawC2) : null;

    // ── 2. Find C.13 Chao Phraya Dam (ท้ายเขื่อนเจ้าพระยา) ────────────────
    const rawC13 =
      validStations.find(
        (s) =>
          s.station.tele_station_oldcode === "C.13" ||
          s.station.tele_station_name.th?.includes("ท้ายเขื่อนเจ้าพระยา"),
      ) ?? null;
    const c13ChaoPhrayaDam = rawC13 ? parseKeyStation(rawC13) : null;

    // ── 3. Find Nearest station to user ────────────────────────────────────
    const mapped = validStations.map((s) => {
      const distKm = calculateHaversineKm(
        lat,
        lng,
        s.station.tele_station_lat,
        s.station.tele_station_long,
      );
      // Give preference to main river stations if within 25 km
      const isMainRiver =
        s.river_name?.includes("เจ้าพระยา") ||
        s.station.tele_station_name.th?.includes("เจ้าพระยา") ||
        s.basin?.basin_name?.th?.includes("เจ้าพระยา");
      const score = distKm - (isMainRiver && distKm <= 25 ? 6 : 0);

      return { raw: s, distKm, score };
    });

    mapped.sort((a, b) => a.score - b.score);
    const selected = mapped[0];
    const s = selected.raw;

    const currentLevelM = parseFloat(s.waterlevel_msl!);
    const prevLevelM = s.waterlevel_msl_previous
      ? parseFloat(s.waterlevel_msl_previous)
      : null;

    const bankLevelM =
      s.station.min_bank && !isNaN(s.station.min_bank)
        ? s.station.min_bank
        : s.station.critical_level_msl && !isNaN(s.station.critical_level_msl)
          ? s.station.critical_level_msl
          : null;

    const effectiveCriticalM = bankLevelM ?? currentLevelM + 1.0;

    const diffBankM =
      s.diff_wl_bank && !isNaN(parseFloat(s.diff_wl_bank))
        ? parseFloat(s.diff_wl_bank)
        : bankLevelM !== null
          ? bankLevelM - currentLevelM
          : null;

    const rateMetersPerHour =
      prevLevelM !== null && !isNaN(prevLevelM)
        ? Math.round((currentLevelM - prevLevelM) * 100) / 100
        : 0;

    const waterLevelRisk = normalizeWaterLevel(
      currentLevelM,
      effectiveCriticalM,
    );
    const waterTrendRisk = normalizeWaterTrend(rateMetersPerHour, 1);

    let freshness: FreshnessStatus = "fresh";
    let observedAtIso = new Date().toISOString();
    try {
      const dtParts = s.waterlevel_datetime.replace(" ", "T");
      const observedDate = new Date(`${dtParts}:00+07:00`);
      observedAtIso = observedDate.toISOString();
      const ageHours = (Date.now() - observedDate.getTime()) / (1000 * 60 * 60);
      if (ageHours > 12) freshness = "aging";
      if (ageHours > 48) freshness = "stale";
    } catch {
      freshness = "fresh";
    }

    const stationName =
      s.station.tele_station_name.th ||
      s.station.tele_station_name.en ||
      `สถานี ${s.station.tele_station_oldcode ?? s.station.id}`;

    const province = s.geocode?.province_name?.th ?? "";
    const district = s.geocode?.amphoe_name?.th ?? "";
    const locSuffix = province
      ? ` (${district ? district + ", " : ""}${province})`
      : "";

    const waterStation: WaterStation = {
      id: `thaiwater-${s.station.id}`,
      provider: s.agency?.agency_shortname?.th || "สสน./ThaiWater",
      externalId: s.station.tele_station_oldcode || String(s.station.id),
      name: `${stationName}${locSuffix}`,
      latitude: s.station.tele_station_lat,
      longitude: s.station.tele_station_long,
      river: s.river_name || s.basin?.basin_name?.th || "แม่น้ำเจ้าพระยา",
      basin: s.basin?.basin_name?.th,
      unit: "m",
      datum: "ม.รทก.",
      status: "active",
    };

    const observation: WaterObservation = {
      stationId: waterStation.id,
      observedAt: observedAtIso,
      fetchedAt: new Date().toISOString(),
      waterLevelM: currentLevelM,
      dischargeM3s: s.discharge ? parseFloat(s.discharge) : undefined,
      quality: "verified",
      provider: waterStation.provider,
    };

    // ── 4. Build 3-station Corridor (Upstream, Nearest, Downstream) ─────────
    // Filter to stations in the same river / basin system
    const mainRiverStations = mapped.filter((item) => {
      const raw = item.raw;
      const isChaoPhraya =
        raw.river_name?.includes("เจ้าพระยา") ||
        raw.station.tele_station_oldcode?.startsWith("CPY") ||
        ["C.2", "C.13", "C.29", "C.12"].includes(
          raw.station.tele_station_oldcode ?? "",
        );
      return isChaoPhraya;
    });

    // If in Chao Phraya corridor, use Chao Phraya stations; otherwise use nearby mapped
    const corridorPool =
      mainRiverStations.length >= 3 ? mainRiverStations : mapped;

    const nearestStationInfo = parseKeyStation(s, selected.distKm);

    // Upstream: latitude higher than user (North of user)
    const upstreamCandidates = corridorPool
      .filter(
        (m) =>
          m.raw.station.id !== s.station.id &&
          m.raw.station.tele_station_lat > lat + 0.01,
      )
      .sort((a, b) => a.distKm - b.distKm);
    const upstreamStation = upstreamCandidates[0]
      ? parseKeyStation(upstreamCandidates[0].raw, upstreamCandidates[0].distKm)
      : null;

    // Downstream: latitude lower than user (South of user, heading to Gulf of Thailand)
    const downstreamCandidates = corridorPool
      .filter(
        (m) =>
          m.raw.station.id !== s.station.id &&
          m.raw.station.tele_station_lat < lat - 0.01,
      )
      .sort((a, b) => a.distKm - b.distKm);
    const downstreamStation = downstreamCandidates[0]
      ? parseKeyStation(
          downstreamCandidates[0].raw,
          downstreamCandidates[0].distKm,
        )
      : null;

    const northernRunoff: NorthernRunoffSummary = {
      c2NakhonSawan,
      c13ChaoPhrayaDam,
      corridor: {
        upstream: upstreamStation,
        nearest: nearestStationInfo,
        downstream: downstreamStation,
      },
    };

    // ── Check if a BMA canal station is closer (Bangkok network) ──────────
    const bmaNearest = await findNearestBMAStation(lat, lng).catch(() => null);
    const preferBma =
      bmaNearest &&
      (bmaNearest.distKm < selected.distKm ||
        (selected.distKm > 10 && bmaNearest.distKm <= 15));

    if (preferBma && bmaNearest) {
      const bmaLevelM = bmaNearest.current.waterLevelM ?? 0;
      const bmaDiffM =
        bmaNearest.criticalM !== null
          ? Math.round((bmaNearest.criticalM - bmaLevelM) * 100) / 100
          : null;

      const bmaKeyStation: KeyRiverStation = {
        stationCode: bmaNearest.station.externalId,
        stationName: bmaNearest.station.name,
        province: "กรุงเทพมหานคร",
        district: bmaNearest.raw.district_name,
        river: bmaNearest.raw.river_name || "คลอง กทม.",
        waterLevelM: bmaLevelM,
        bankLevelM: bmaNearest.criticalM,
        diffBankM: bmaDiffM,
        diffBankText: bmaNearest.statusText,
        dischargeM3s: null,
        datetime: bmaNearest.current.observedAt,
        situationLevel: bmaNearest.statusText.includes("วิกฤต")
          ? 3
          : bmaNearest.statusText.includes("เตือน")
            ? 2
            : 1,
        latitude: bmaNearest.station.latitude,
        longitude: bmaNearest.station.longitude,
        distanceKm: bmaNearest.distKm,
      };

      const bmaNorthernRunoff: NorthernRunoffSummary = {
        ...northernRunoff,
        corridor: {
          ...northernRunoff.corridor,
          nearest: bmaKeyStation,
        },
      };

      return {
        station: bmaNearest.station,
        current: bmaNearest.current,
        rateMetersPerHour: 0,
        trend6h: 0,
        trend12h: 0,
        trend24h: 0,
        waterLevelRisk: bmaNearest.waterLevelRisk,
        waterTrendRisk: 0,
        freshness: bmaNearest.freshness,
        distanceKm: bmaNearest.distKm,
        bankLevelM: bmaNearest.criticalM,
        diffBankM: bmaDiffM,
        diffBankText: bmaNearest.statusText,
        northernRunoff: bmaNorthernRunoff,
      };
    }

    return {
      station: waterStation,
      current: observation,
      rateMetersPerHour,
      trend6h: rateMetersPerHour ? rateMetersPerHour * 6 : 0,
      trend12h: rateMetersPerHour ? rateMetersPerHour * 12 : 0,
      trend24h: rateMetersPerHour ? rateMetersPerHour * 24 : 0,
      waterLevelRisk,
      waterTrendRisk,
      freshness,
      distanceKm: Math.round(selected.distKm * 10) / 10,
      bankLevelM,
      diffBankM,
      diffBankText: s.diff_wl_bank_text ?? undefined,
      northernRunoff,
    };
  } catch (err) {
    console.error("[thaiwater] Fetch failed:", err);
    return null;
  }
}
