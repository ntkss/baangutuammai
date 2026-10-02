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

// ─── Chao Phraya basin dam IDs & Priority Order ───────────────────────────
// Priority is based on strategic importance to lower Chao Phraya / Nonthaburi / BKK:
// 1. 4 Major strategic dams (ภูมิพล, สิริกิติ์, ป่าสักชลสิทธิ์, แควน้อยบำรุงแดน)
// 2. Tributary upstream dams (กิ่วคอหมา, กิ่วลม, แม่กวง, ทับเสลา, กระเสียว)
export const CHAO_PHRAYA_DAM_PRIORITY: Record<string, number> = {
  "200101": 1, // เขื่อนภูมิพล (ใหญ่สุด 13,462 ล้าน ลบ.ม., คุมแม่น้ำปิง)
  "200102": 2, // เขื่อนสิริกิติ์ (10,508 ล้าน ลบ.ม., คุมแม่น้ำน่าน)
  "100301": 3, // เขื่อนป่าสักชลสิทธิ์ (ระบายตรงเข้าเจ้าพระยาตอนล่าง/อยุธยา)
  "100107": 4, // เขื่อนแควน้อยบำรุงแดน (คุมแม่น้ำแควน้อย/น่าน)
  "100106": 5, // เขื่อนกิ่วคอหมา (คุมแม่น้ำวัง)
  "100105": 6, // เขื่อนกิ่วลม (คุมแม่น้ำวัง)
  "100104": 7, // เขื่อนแม่กวงอุดมธารา (คุมลำน้ำแม่กวง/ปิง)
  "100302": 8, // เขื่อนทับเสลา (ลุ่มน้ำสะแกกรัง)
  "100303": 9, // เขื่อนกระเสียว (ลุ่มน้ำท่าจีน)
};

export const MAJOR_4_DAM_IDS = new Set([
  "200101",
  "200102",
  "100301",
  "100107",
]);

const CHAO_PHRAYA_DAM_IDS = new Set(Object.keys(CHAO_PHRAYA_DAM_PRIORITY));

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
      isMajor?: boolean;
      priority?: number;
    }>;
    missingDams: Array<{
      id: string;
      name: string;
      isMajor?: boolean;
      priority?: number;
    }>;
    observedDate: string;
    isFallbackToPreviousDay?: boolean;
  } | null;
  fetchedAt: string;
};

/**
 * Parses raw RID JSON response into domain observations and Chao Phraya basin metrics.
 */
function parseRidResponse(
  json: RidResponse,
  fetchedAt: string,
): RidReservoirResult {
  const allDams: (RidDam & { region: string })[] = json.data.flatMap((r) =>
    r.dam.map((d) => ({ ...d, region: r.region })),
  );

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

  // Sort strictly by strategic importance to Chao Phraya basin:
  // 1. Bhumibol -> 2. Sirikit -> 3. Pasak Jolasid -> 4. Kwae Noi -> 5-9. Tributaries
  reportingDams.sort((a, b) => {
    const pA = CHAO_PHRAYA_DAM_PRIORITY[a.id] ?? 99;
    const pB = CHAO_PHRAYA_DAM_PRIORITY[b.id] ?? 99;
    return pA - pB;
  });

  missingDams.sort((a, b) => {
    const pA = CHAO_PHRAYA_DAM_PRIORITY[a.id] ?? 99;
    const pB = CHAO_PHRAYA_DAM_PRIORITY[b.id] ?? 99;
    return pA - pB;
  });

  let chaoPrayaBasin: RidReservoirResult["chaoPrayaBasin"] = null;

  if (reportingDams.length > 0) {
    const totalStorageCap = reportingDams.reduce(
      (s, d) => s + (d.storage ?? d.capacity ?? 0),
      0,
    );
    const totalVolume = reportingDams.reduce((s, d) => s + (d.volume ?? 0), 0);
    const totalInflow = reportingDams.reduce((s, d) => s + (d.inflow ?? 0), 0);
    const totalOutflow = reportingDams.reduce(
      (s, d) => s + (d.outflow ?? 0),
      0,
    );

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
        isMajor: MAJOR_4_DAM_IDS.has(d.id),
        priority: CHAO_PHRAYA_DAM_PRIORITY[d.id] ?? 99,
      })),
      missingDams: missingDams.map((d) => ({
        id: d.id,
        name: d.name,
        isMajor: MAJOR_4_DAM_IDS.has(d.id),
        priority: CHAO_PHRAYA_DAM_PRIORITY[d.id] ?? 99,
      })),
      observedDate: json.date,
    };
  }

  return { observations, chaoPrayaBasin, fetchedAt };
}

/**
 * Fetch current reservoir data from RID public API.
 * Option A: If current day is partially missing dams (waiting for daily reports),
 * automatically queries the latest complete 24h summary cycle (e.g. yesterday)
 * so the basin metrics reflect true upstream reality without false/skewed averages.
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
  const todayResult = parseRidResponse(json, fetchedAt);

  // If today does not have all basin dams reported yet, try previous day
  if (
    todayResult.chaoPrayaBasin &&
    todayResult.chaoPrayaBasin.damCount <
      todayResult.chaoPrayaBasin.totalDamsInBasin
  ) {
    try {
      const [y, m, d] = json.date.split("-").map(Number);
      const prevDate = new Date(Date.UTC(y, m - 1, d));
      prevDate.setUTCDate(prevDate.getUTCDate() - 1);
      const yesterdayStr = prevDate.toISOString().split("T")[0];

      const prevRes = await fetch(`${RID_API_URL}/${yesterdayStr}`, {
        next: { revalidate: 3600 },
        headers: { Accept: "application/json" },
      });

      if (prevRes.ok) {
        const prevJson: RidResponse = await prevRes.json();
        const prevResult = parseRidResponse(prevJson, fetchedAt);

        // If yesterday has more reporting dams (e.g. 9 vs 3)
        if (
          (prevResult.chaoPrayaBasin?.damCount ?? 0) >
          (todayResult.chaoPrayaBasin?.damCount ?? 0)
        ) {
          if (prevResult.chaoPrayaBasin) {
            prevResult.chaoPrayaBasin.isFallbackToPreviousDay = true;
          }
          return prevResult;
        }
      }
    } catch (err) {
      console.warn(
        "[rid-reservoir] Could not fetch previous complete date:",
        err,
      );
    }
  }

  return todayResult;
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
  // totalOutflowM3s is in million m³/day (MCM/day)
  // 50 MCM/day total release across basin represents significant flood discharge
  const outflowFactor = Math.min(1, basin.totalOutflowM3s / 50);

  // Weighted combination: storage 40% + outflow 60%
  return storageRisk * 0.4 + outflowFactor * 0.6;
}
