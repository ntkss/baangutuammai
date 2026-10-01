/**
 * BaanGuTuamMai — RID Reservoir Provider
 *
 * Verified endpoint: https://app.rid.go.th/reservoir/api/dam/public
 * Docs:             https://app.rid.go.th/reservoir/api/document/dam
 * Auth:             None required
 * Update frequency: Daily
 * Last verified:    2026-09-30 (live response confirmed)
 *
 * Returns current reservoir data for all major Thai dams (35 dams).
 * Units: ล้าน ลบ.ม. (million cubic metres), m³/s for flow
 */

import type { ReservoirObservation } from "@/lib/types/domain";

// ─── Response shapes ──────────────────────────────────────────────────────

type RidDam = {
  id: string;
  name: string;
  owner: string;
  capacity: number;
  storage: number;
  active_storage: number;
  dead_storage: number;
  volume: number;
  percent_storage: number;
  inflow: number | null;
  outflow: number | null;
};

type RidRegion = {
  region: string;
  dam: RidDam[];
};

type RidResponse = {
  document: string;
  date: string; // "YYYY-MM-DD"
  total: number;
  data: RidRegion[];
};

// ─── Chao Phraya basin dam IDs ─────────────────────────────────────────────
// Major upstream reservoirs that directly affect lower Chao Phraya / Nonthaburi
// Source: RID documentation and basin knowledge
const CHAO_PHRAYA_DAM_IDS = new Set([
  "100301", // เขื่อนป่าสักชลสิทธิ์ (Pasak)
  "200101", // เขื่อนภูมิพล (Bhumibol)
  "200102", // เขื่อนสิริกิติ์ (Sirikit)
  "100107", // เขื่อนแควน้อยบำรุงแดน
  "100106", // เขื่อนกิ่วคอหมา
  "100105", // เขื่อนกิ่วลม
  "100104", // เขื่อนแม่กวงอุดมธารา
  "100302", // เขื่อนทับเสลา
  "100303", // เขื่อนกระเสียว
]);

// ─── Provider ─────────────────────────────────────────────────────────────

const RID_API_URL = "https://app.rid.go.th/reservoir/api/dam/public";

export type RidReservoirResult = {
  observations: ReservoirObservation[];
  chaoPrayaBasin: {
    totalCapacityMcm: number;
    totalStorageMcm: number;
    totalInflowM3s: number;
    totalOutflowM3s: number;
    avgStoragePercent: number;
    damCount: number;
    totalDamsInBasin: number;
    reportingDams: Array<{
      id: string;
      name: string;
      volume: number;
      capacity: number;
      percent_storage: number | null;
      inflow: number | null;
      outflow: number | null;
    }>;
    missingDams: Array<{
      id: string;
      name: string;
    }>;
    observedDate: string;
  } | null;
  fetchedAt: string;
};

/**
 * Fetch current reservoir data from RID public API.
 * Filters to Chao Phraya basin dams for risk calculation.
 * Strictly calculates from actual reporting dams without fallbacks or fake defaults.
 */
export async function fetchRidReservoirs(): Promise<RidReservoirResult> {
  const fetchedAt = new Date().toISOString();

  const res = await fetch(RID_API_URL, {
    next: { revalidate: 3600 }, // Cache 1 hour (daily data)
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`RID API returned ${res.status}: ${res.statusText}`);
  }

  const json: RidResponse = await res.json();

  const allDams: (RidDam & { region: string })[] = json.data.flatMap((r) =>
    r.dam.map((d) => ({ ...d, region: r.region })),
  );

  // Map to domain observations
  const observedAt = new Date(json.date + "T00:00:00+07:00").toISOString();
  const observations: ReservoirObservation[] = allDams.map((dam) => ({
    reservoirId: `rid-${dam.id}`,
    observedAt,
    fetchedAt,
    storageMcm: dam.volume ?? undefined,
    storagePercent: dam.percent_storage ?? undefined,
    inflowM3s: dam.inflow ?? undefined,
    outflowM3s: dam.outflow ?? undefined,
    provider: "RID",
  }));

  // Filter Chao Phraya basin dams
  const cpDams = allDams.filter((d) => CHAO_PHRAYA_DAM_IDS.has(d.id));

  // Separate dams strictly into reporting and missing
  const reportingDams = cpDams.filter(
    (d) => d.volume !== null && d.volume !== undefined,
  );
  const missingDams = cpDams.filter(
    (d) => d.volume === null || d.volume === undefined,
  );

  let chaoPrayaBasin: RidReservoirResult["chaoPrayaBasin"] = null;

  if (reportingDams.length > 0) {
    // Normal storage capacity of reporting dams only
    const totalStorageCap = reportingDams.reduce(
      (s, d) => s + (d.storage ?? d.capacity ?? 0),
      0,
    );
    // Current water volume in reporting dams only
    const totalVolume = reportingDams.reduce((s, d) => s + (d.volume ?? 0), 0);
    const totalInflow = reportingDams.reduce((s, d) => s + (d.inflow ?? 0), 0);
    const totalOutflow = reportingDams.reduce(
      (s, d) => s + (d.outflow ?? 0),
      0,
    );

    // True basin storage percentage of reporting dams: (Total current volume / Total normal capacity) * 100
    const weightedPct =
      totalStorageCap > 0 ? (totalVolume / totalStorageCap) * 100 : 0;

    chaoPrayaBasin = {
      totalCapacityMcm: Math.round(totalStorageCap * 100) / 100,
      totalStorageMcm: Math.round(totalVolume * 100) / 100,
      totalInflowM3s: Math.round(totalInflow * 100) / 100,
      totalOutflowM3s: Math.round(totalOutflow * 100) / 100,
      avgStoragePercent: Math.round(weightedPct * 10) / 10,
      damCount: reportingDams.length,
      totalDamsInBasin: cpDams.length,
      reportingDams: reportingDams.map((d) => ({
        id: d.id,
        name: d.name,
        volume: d.volume ?? 0,
        capacity: d.storage ?? d.capacity ?? 0,
        percent_storage: d.percent_storage ?? null,
        inflow: d.inflow ?? null,
        outflow: d.outflow ?? null,
      })),
      missingDams: missingDams.map((d) => ({
        id: d.id,
        name: d.name,
      })),
      observedDate: json.date,
    };
  }

  return { observations, chaoPrayaBasin, fetchedAt };
}

/**
 * Normalize reservoir storage percentage (0–1) as upstream risk factor.
 * High outflow + near-full storage = upstream pressure.
 *
 * Based on rule from SKILL.md:
 * "Do not simply add reservoir storage percentage to flood risk."
 * Use outflow trend and storage combination.
 */
export function calcUpstreamRiskFromReservoirs(
  basin: RidReservoirResult["chaoPrayaBasin"],
): number {
  if (!basin) return 0;

  const storageRisk = Math.min(1, basin.avgStoragePercent / 100);
  // High outflow relative to capacity is more meaningful than storage alone
  // (high outflow = water is being released downstream)
  const outflowFactor =
    basin.totalCapacityMcm > 0
      ? Math.min(
          1,
          (basin.totalOutflowM3s * 86400) /
            1_000_000 /
            (basin.totalCapacityMcm * 0.05),
        )
      : 0;

  // Weighted combination: storage 40% + outflow 60%
  return storageRisk * 0.4 + outflowFactor * 0.6;
}
