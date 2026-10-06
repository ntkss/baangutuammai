/**
 * BaanGuTuamMai — Dashboard API Route
 *
 * GET /api/dashboard?lat=13.862&lng=100.514
 *
 * Aggregates data from verified real-time sources:
 *   - ThaiWater / HII Telemetry (live, verified 2026-09-30)
 *   - Open-Meteo Precipitation (live, verified 2026-09-30)
 *   - RID Reservoir API (live, verified 2026-09-30)
 *   - Open-Elevation SRTM (live, verified 2026-09-30)
 *   - 2011 historical reference (static JSON, verified sources)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  buildRiskAssessment,
  getRiskWeightsForLocation,
} from "@/lib/risk/engine";
import {
  fetchRidReservoirs,
  calcUpstreamRiskFromReservoirs,
} from "@/lib/providers/rid-reservoir";
import {
  fetchTerrainElevation,
  calcElevationRisk,
} from "@/lib/providers/open-elevation";
import { fetchRealWaterLevel } from "@/lib/providers/thaiwater";
import { fetchRealRainfall } from "@/lib/providers/open-meteo";
import type {
  DashboardResponse,
  ConfidenceLevel,
  FreshnessStatus,
} from "@/lib/types/domain";
import historical2011 from "@/lib/data/historical-2011.json";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "lat และ lng ต้องเป็นตัวเลข" },
      { status: 400 },
    );
  }

  const now = new Date().toISOString();
  const dataNotices: string[] = [];

  // ── Parallel fetch of all 4 live telemetry sources ───────────────────────
  const [elevationResult, ridResult, waterResult, rainResult] =
    await Promise.all([
      fetchTerrainElevation(lat, lng).catch((err) => {
        console.error("[dashboard] Elevation fetch failed:", err);
        return null;
      }),
      fetchRidReservoirs().catch((err) => {
        console.error("[dashboard] RID fetch failed:", err);
        return null;
      }),
      fetchRealWaterLevel(lat, lng).catch((err) => {
        console.error("[dashboard] ThaiWater fetch failed:", err);
        return null;
      }),
      fetchRealRainfall(lat, lng).catch((err) => {
        console.error("[dashboard] Open-Meteo fetch failed:", err);
        return null;
      }),
    ]);

  // ── 1. Terrain elevation ────────────────────────────────────────────────
  const terrainElevM = elevationResult?.terrainElevationM ?? null;
  if (!elevationResult) {
    dataNotices.push(
      "ไม่สามารถโหลดข้อมูลความสูงพื้นที่ได้ในขณะนี้ (ใช้ค่าประมาณการ)",
    );
  }

  // ── 2. RID Reservoir data ────────────────────────────────────────────────
  let upstreamRisk = 0;
  if (ridResult) {
    upstreamRisk = calcUpstreamRiskFromReservoirs(ridResult.chaoPrayaBasin);
    if (
      ridResult.chaoPrayaBasin?.missingDams &&
      ridResult.chaoPrayaBasin.missingDams.length > 0
    ) {
      const missingNames = ridResult.chaoPrayaBasin.missingDams
        .map((d) => d.name)
        .join(", ");
      dataNotices.push(
        `ข้อมูลเขื่อนประจำวัน (${ridResult.chaoPrayaBasin.observedDate}) มีรายงาน ${ridResult.chaoPrayaBasin.damCount} จาก ${ridResult.chaoPrayaBasin.totalDamsInBasin} แห่ง (รอรายงานตรวจวัดล่าสุดจาก: ${missingNames})`,
      );
    } else if (ridResult.chaoPrayaBasin?.isFallbackToPreviousDay) {
      dataNotices.push(
        `ข้อมูลเขื่อนประจำวัน (${ridResult.chaoPrayaBasin.observedDate}): แสดงรอบสรุป 24 ชม. ล่าสุดที่มีรายงานตรวจวัดครบทั้ง ${ridResult.chaoPrayaBasin.damCount} แห่ง (ระหว่างรอ ชป./กฟผ. สรุปรายงานของวันนี้)`,
      );
    }
  } else {
    dataNotices.push("ข้อมูลอ่างเก็บน้ำขนาดใหญ่ (ชป.) ขณะนี้ไม่พร้อมใช้งาน");
  }

  // ── 3. River water level telemetry ──────────────────────────────────────
  let waterFreshness: FreshnessStatus = "unavailable";
  let waterLevelRisk = 0;
  let waterTrendRisk = 0;

  if (waterResult) {
    waterFreshness = waterResult.freshness;
    waterLevelRisk = waterResult.waterLevelRisk;
    waterTrendRisk = waterResult.waterTrendRisk;
  } else {
    dataNotices.push(
      "ไม่สามารถเชื่อมต่อสถานีวัดระดับน้ำแม่น้ำแบบเรียลไทม์ได้ในขณะนี้",
    );
  }

  // ── 4. Rainfall telemetry ────────────────────────────────────────────────
  let rainFreshness: FreshnessStatus = "unavailable";
  let rainfallRisk = 0;

  if (rainResult) {
    rainFreshness = rainResult.freshness;
    rainfallRisk = rainResult.rainfallRisk;
  } else {
    dataNotices.push("ไม่สามารถโหลดข้อมูลปริมาณน้ำฝนสะสมได้ในขณะนี้");
  }

  // ── 5. Elevation risk ────────────────────────────────────────────────────
  const elevationRisk = calcElevationRisk({ terrainElevationM: terrainElevM });

  // ── 6. Confidence Scoring ────────────────────────────────────────────────
  let availableSignalsCount = 0;
  if (waterResult) availableSignalsCount++;
  if (rainResult) availableSignalsCount++;
  if (ridResult) availableSignalsCount++;
  if (elevationResult) availableSignalsCount++;

  let confidence: ConfidenceLevel = "limited";
  if (availableSignalsCount >= 4) {
    confidence = "high";
  } else if (availableSignalsCount >= 2) {
    confidence = "medium";
  }

  // ── 7. Risk assessment ───────────────────────────────────────────────────
  const zoneInfo = getRiskWeightsForLocation(lat, lng);
  const risk = buildRiskAssessment({
    locationId: `${lat.toFixed(4)},${lng.toFixed(4)}`,
    inputs: {
      waterLevelRisk,
      waterTrendRisk,
      rainfallRisk,
      upstreamRisk,
      elevationRisk,
      infrastructureRisk: 0, // P2
      tideRisk: 0, // P2
      peakRainRate1hMm: rainResult?.peakRate1h,
    },
    weights: zoneInfo.weights,
    zone: zoneInfo.zone,
    zoneLabel: zoneInfo.zoneLabel,
    confidence,
    estimatedElevationMarginM:
      terrainElevM !== null && waterResult?.current.waterLevelM
        ? terrainElevM - waterResult.current.waterLevelM
        : terrainElevM !== null
          ? terrainElevM - 1.5
          : undefined,
  });

  // ── 8. 2011 historical comparison ────────────────────────────────────────
  const station2011 = historical2011.stations["N67A"];
  const currentLevelM = waterResult?.current.waterLevelM;
  let differenceM: number | undefined = undefined;

  if (
    station2011 &&
    station2011.peakLevelM !== null &&
    currentLevelM !== undefined
  ) {
    // positive = current is BELOW peak (safe margin relative to 2011)
    differenceM =
      Math.round((station2011.peakLevelM - currentLevelM) * 100) / 100;
  }

  const historicalComparison =
    station2011 && station2011.peakLevelM !== null
      ? {
          stationId: station2011.stationId,
          stationName: station2011.stationName,
          referenceYear: station2011.referenceYear,
          referencePeakLevelM: station2011.peakLevelM,
          referencePeakDate: station2011.peakDate ?? undefined,
          referencePeakSource: station2011.peakSource ?? undefined,
          currentLevelM,
          differenceM,
          narrativeSummary:
            differenceM !== undefined
              ? differenceM > 0
                ? `ระดับน้ำปัจจุบันต่ำกว่ายอดสูงสุดปี 2554 อยู่ ${differenceM.toFixed(2)} ม.`
                : `ระดับน้ำปัจจุบันสูงกว่ายอดสูงสุดปี 2554 อยู่ ${Math.abs(differenceM).toFixed(2)} ม.`
              : station2011.notes,
        }
      : null;

  // ── 9. Build response ────────────────────────────────────────────────────
  const response: DashboardResponse = {
    location: {
      id: `loc-${lat.toFixed(4)}-${lng.toFixed(4)}`,
      latitude: lat,
      longitude: lng,
      groundElevationM: terrainElevM ?? undefined,
    },
    risk,
    water: {
      station: waterResult?.station ?? {
        id: "hii-default",
        provider: "HII",
        externalId: "UNKNOWN",
        name: "ไม่มีข้อมูลสถานีใกล้เคียง",
        latitude: lat,
        longitude: lng,
        river: "เจ้าพระยา",
        unit: "m",
        datum: "ม.รทก.",
      },
      current: waterResult?.current ?? null,
      trend6h: waterResult?.trend6h ?? null,
      trend12h: waterResult?.trend12h ?? null,
      trend24h: waterResult?.trend24h ?? null,
      rateMetersPerHour: waterResult?.rateMetersPerHour ?? null,
      freshness: waterFreshness,
    },
    rain: {
      station: rainResult?.station ?? null,
      total1h: rainResult?.total1h ?? null,
      total6h: rainResult?.total6h ?? null,
      total24h: rainResult?.total24h ?? null,
      peakRate1h: rainResult?.peakRate1h ?? null,
      isExceedingDrainageCapacity:
        rainResult?.isExceedingDrainageCapacity ?? false,
      freshness: rainFreshness,
    },
    historicalComparison,
    confidence,
    updatedAt: now,
    dataNotices,
  };

  // Attach extended metadata for UI cards
  const extended = {
    ...response,
    _waterExtra: waterResult
      ? {
          distanceKm: waterResult.distanceKm,
          bankLevelM: waterResult.bankLevelM,
          diffBankM: waterResult.diffBankM,
          diffBankText: waterResult.diffBankText,
        }
      : null,
    _northernRunoff: waterResult?.northernRunoff ?? null,
    _reservoirBasin: ridResult?.chaoPrayaBasin ?? null,
    _terrainElevation: elevationResult
      ? {
          elevationM: terrainElevM,
          source: elevationResult.source,
          note: "ความสูงโดยประมาณจาก SRTM — ไม่ใช่ระดับพื้นบ้านจริง",
        }
      : null,
  };

  return NextResponse.json(extended, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
    },
  });
}
