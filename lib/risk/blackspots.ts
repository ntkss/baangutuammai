/**
 * BaanGuTuamMai — BMA Flood-Prone Blackspots & Depression Basin Service
 *
 * Sourced from Bangkok Drainage and Sewerage Department (สำนักการระบายน้ำ กทม.)
 * official surveillance of repetitive urban flood and low-lying depression hotspots.
 */

import blackspotsData from "@/lib/data/bma-flood-blackspots.json";

export type BMAFloodBlackspot = {
  id: string;
  name: string;
  district: string;
  latitude: number;
  longitude: number;
  type: string;
  description: string;
};

export type BlackspotProximityResult = {
  blackspot: BMAFloodBlackspot;
  distanceKm: number;
  severity: "critical" | "warning" | "advisory";
  infrastructureRisk: number; // 0–1 fraction
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

/**
 * Find the nearest BMA flood-prone blackspot or depression within maxDistanceKm.
 * Default max radius: 1.5 km
 */
export function findNearestBMAFloodBlackspot(
  lat: number,
  lng: number,
  maxDistanceKm = 1.5,
): BlackspotProximityResult | null {
  const spots = blackspotsData as BMAFloodBlackspot[];
  let nearest: BMAFloodBlackspot | null = null;
  let minDist = Infinity;

  for (const s of spots) {
    const dist = calculateHaversineKm(lat, lng, s.latitude, s.longitude);
    if (dist < minDist) {
      minDist = dist;
      nearest = s;
    }
  }

  if (!nearest || minDist > maxDistanceKm) {
    return null;
  }

  const distanceKmRound = Math.round(minDist * 100) / 100;

  // < 0.4 km: Directly within depression / flood bottleneck zone
  // 0.4–0.8 km: Immediate vicinity
  // 0.8–1.5 km: Neighborhood catchment
  let severity: "critical" | "warning" | "advisory" = "advisory";
  let infrastructureRisk = 0.2;

  if (distanceKmRound <= 0.4) {
    severity = "critical";
    infrastructureRisk = 0.8;
  } else if (distanceKmRound <= 0.8) {
    severity = "warning";
    infrastructureRisk = 0.5;
  } else {
    severity = "advisory";
    infrastructureRisk = 0.25;
  }

  return {
    blackspot: nearest,
    distanceKm: distanceKmRound,
    severity,
    infrastructureRisk,
  };
}
