/**
 * BaanGuTuamMai — Open-Meteo Rainfall Provider
 *
 * Real-time hourly precipitation and rain telemetry for Thailand coordinates.
 * Endpoint: https://api.open-meteo.com/v1/forecast
 * Auth:     None required (Open Data / Non-commercial attribution)
 * Cache:    600 seconds (10 mins)
 */

import type {
  RainStation,
  RainObservation,
  FreshnessStatus,
} from "@/lib/types/domain";
import { normalizeRainfall } from "@/lib/risk/engine";

export type RainfallResult = {
  station: RainStation | null;
  observation: RainObservation | null;
  total1h: number;
  total6h: number;
  total24h: number;
  peakRate1h: number;
  isExceedingDrainageCapacity: boolean;
  rainfallRisk: number; // 0–1 fraction
  freshness: FreshnessStatus;
  source: string;
};

type OpenMeteoResponse = {
  latitude: number;
  longitude: number;
  timezone: string;
  hourly: {
    time: string[];
    precipitation: (number | null)[];
    rain: (number | null)[];
  };
};

export async function fetchRealRainfall(
  lat: number,
  lng: number,
): Promise<RainfallResult | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=precipitation,rain&past_days=1&forecast_days=1&timezone=Asia%2FBangkok`;

    const res = await fetch(url, {
      next: { revalidate: 600 },
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.warn(`[open-meteo] HTTP ${res.status}: ${res.statusText}`);
      return null;
    }

    const data: OpenMeteoResponse = await res.json();
    if (
      !data.hourly ||
      !Array.isArray(data.hourly.time) ||
      !Array.isArray(data.hourly.precipitation)
    ) {
      return null;
    }

    const times = data.hourly.time;
    const precips = data.hourly.precipitation.map((p) => p ?? 0);

    // Current local time in Asia/Bangkok
    const nowBangkok = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }),
    );

    // Find the latest hour index that is <= current time
    let currentIndex = times.length - 1;
    for (let i = times.length - 1; i >= 0; i--) {
      const t = new Date(times[i]);
      if (t <= nowBangkok) {
        currentIndex = i;
        break;
      }
    }

    // 1-hour precipitation
    const total1h = Math.max(0, precips[currentIndex] ?? 0);

    // 6-hour precipitation (sum of past 6 hours)
    let total6h = 0;
    const start6h = Math.max(0, currentIndex - 5);
    for (let i = start6h; i <= currentIndex; i++) {
      total6h += precips[i] ?? 0;
    }

    // 24-hour precipitation (sum of past 24 hours)
    let total24h = 0;
    const start24h = Math.max(0, currentIndex - 23);
    for (let i = start24h; i <= currentIndex; i++) {
      total24h += precips[i] ?? 0;
    }

    const total1hRound = Math.round(total1h * 10) / 10;
    const total6hRound = Math.round(total6h * 10) / 10;
    const total24hRound = Math.round(total24h * 10) / 10;

    // Find peak 1-hour rainfall rate across the last 6 hours
    let peakRate1h = total1h;
    for (let i = start6h; i <= currentIndex; i++) {
      const val = precips[i] ?? 0;
      if (val > peakRate1h) peakRate1h = val;
    }
    const peakRate1hRound = Math.round(peakRate1h * 10) / 10;
    // BMA municipal stormwater pipes typically have ~50–60 mm/hr design limit
    const isExceedingDrainageCapacity = peakRate1hRound >= 50;

    const observedAtTime = times[currentIndex]
      ? `${times[currentIndex]}:00+07:00`
      : new Date().toISOString();

    const station: RainStation = {
      id: `meteo-${lat.toFixed(3)}-${lng.toFixed(3)}`,
      provider: "Open-Meteo",
      externalId: `OM-${lat.toFixed(3)}-${lng.toFixed(3)}`,
      name: "พิกัดสถานีตรวจวัดเรดาร์และโมเดลสภาพอากาศ",
      latitude: data.latitude,
      longitude: data.longitude,
      status: "active",
    };

    const observation: RainObservation = {
      stationId: station.id,
      observedAt: observedAtTime,
      fetchedAt: new Date().toISOString(),
      rainfallMm: total24hRound,
      windowHours: 24,
      provider: "Open-Meteo",
    };

    const rainfallRisk = normalizeRainfall(total24hRound, 24, peakRate1hRound);

    return {
      station,
      observation,
      total1h: total1hRound,
      total6h: total6hRound,
      total24h: total24hRound,
      peakRate1h: peakRate1hRound,
      isExceedingDrainageCapacity,
      rainfallRisk,
      freshness: "fresh",
      source: "Open-Meteo High-Resolution Weather Model",
    };
  } catch (err) {
    console.error("[open-meteo] Fetch failed:", err);
    return null;
  }
}
