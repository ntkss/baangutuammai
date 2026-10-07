/**
 * BaanGuTuamMai — Estuarine Tidal Model (Gulf of Thailand & Lower Chao Phraya)
 *
 * Models astronomical spring/neap tide cycles (วันน้ำเกิด-น้ำตาย)
 * and estuarine backwater influence on drainage along the Samut Prakan,
 * Bangkok, and Nonthaburi river corridor.
 *
 * Reference: Hydrographic Department, Royal Thai Navy (กรมอุทกศาสตร์ กองทัพเรือ)
 * Estuary Datum: Mean Sea Level (ม.รทก.) at Fort Chula Chomklao (ป้อมพระจุลจอมเกล้า)
 */

export type DailyTideExtremes = {
  highTideTime: string; // e.g. "17:04 น."
  highTideLevelM: number; // e.g. 1.56 (ม.รทก.)
  lowTideTime: string; // e.g. "09:52 น."
  lowTideLevelM: number; // e.g. 0.46 (ม.รทก.)
  summaryText: string; // e.g. "น้ำขึ้นสูงสุด ~17:04 น. (+1.56 ม.) • น้ำลงต่ำสุด ~09:52 น. (+0.46 ม.)"
};

export type EstuarineTideResult = {
  tideRisk: number; // 0–1 normalized risk
  astronomicalLevelM: number; // estimated tidal water level in meters MSL
  lunarPhase: "spring_tide" | "moderate" | "neap_tide";
  phaseLabel: string;
  isHighTideAlert: boolean;
  distanceToEstuaryKm: number;
  dailyExtremes: DailyTideExtremes;
};

// Fort Chula Chomklao station coordinates (Mouth of Chao Phraya River)
const ESTUARY_LAT = 13.535;
const ESTUARY_LNG = 100.585;

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
 * Approximate lunar age in days (0–29.53).
 * Known reference new moon: 2026-01-18 19:52 UTC
 */
function getApproximateLunarAge(date: Date): number {
  const refNewMoon = new Date("2026-01-18T19:52:00Z").getTime();
  const diffDays = (date.getTime() - refNewMoon) / (1000 * 60 * 60 * 24);
  const synodicMonth = 29.53058867;
  const age = diffDays % synodicMonth;
  return age < 0 ? age + synodicMonth : age;
}

/**
 * Calculate tidal surge score from astronomical lunar cycle & monsoon season.
 */
function calcAstronomicalFactor(date: Date): {
  score: number;
  phase: "spring_tide" | "moderate" | "neap_tide";
  label: string;
  approxMsl: number;
} {
  const age = getApproximateLunarAge(date);

  // Distance from nearest Spring Tide (New Moon = age 0, Full Moon = age 14.76)
  const distFromNew = Math.min(age, 29.53 - age);
  const distFromFull = Math.abs(age - 14.765);
  const minDistToSpring = Math.min(distFromNew, distFromFull);

  // Spring tide occurs within ~3 days of New Moon or Full Moon (ขึ้น 15 ค่ำ / แรม 15 ค่ำ)
  let baseScore = 0.2;
  let phase: "spring_tide" | "moderate" | "neap_tide" = "moderate";
  let label = "ระดับน้ำทะเลปานกลาง";

  if (minDistToSpring <= 2.2) {
    // Peak spring tide (น้ำเกิด)
    baseScore = 0.85 + (1 - minDistToSpring / 2.2) * 0.15;
    phase = "spring_tide";
    label = "ช่วงน้ำทะเลหนุนสูงสุด (วันน้ำเกิด ขึ้น/แรม 15 ค่ำ)";
  } else if (minDistToSpring >= 5.5) {
    // Neap tide (น้ำตาย - ขึ้น/แรม 7-8 ค่ำ)
    baseScore = 0.1;
    phase = "neap_tide";
    label = "ช่วงน้ำทะเลลดต่ำ (วันน้ำตาย)";
  } else {
    // Intermediate transition
    baseScore = 0.45;
    phase = "moderate";
    label = "ระดับน้ำขึ้นน้ำลงปกติ";
  }

  // Seasonal amplification for Upper Gulf of Thailand (October–December monsoon storm surge)
  const month = date.getMonth(); // 0 = Jan, 9 = Oct, 10 = Nov, 11 = Dec
  let seasonalMultiplier = 1.0;
  if (month === 9 || month === 10) {
    seasonalMultiplier = 1.25; // Peak flood/tide conjunction season
  } else if (month === 11) {
    seasonalMultiplier = 1.15;
  }

  const finalScore = Math.min(1.0, baseScore * seasonalMultiplier);
  // Tidal elevation in meters MSL at river mouth (typically ranges from 0.8m to 2.2m MSL)
  const approxMsl = 0.8 + finalScore * 1.35;

  return {
    score: finalScore,
    phase,
    label,
    approxMsl: Math.round(approxMsl * 100) / 100,
  };
}

/**
 * Calculate the localized estuarine tidal risk for a coordinate.
 */
export function calcEstuarineTideRisk(
  lat: number,
  lng: number,
  date = new Date(),
): EstuarineTideResult {
  const distKm = calculateHaversineKm(lat, lng, ESTUARY_LAT, ESTUARY_LNG);
  const distKmRound = Math.round(distKm * 10) / 10;

  // Tidal dampening upstream along river corridor:
  // 0–25 km: Full tidal amplitude (Samut Prakan, southern BKK)
  // 25–55 km: Moderate to high amplitude (Central & Northern BKK)
  // 55–85 km: Gradual attenuation (Nonthaburi, southern Pathum Thani)
  // > 85 km: River runoff completely dominates; astronomical tidal range negligible
  let proximityFactor = 0;
  if (distKmRound <= 25) {
    proximityFactor = 1.0;
  } else if (distKmRound <= 55) {
    proximityFactor = 1.0 - ((distKmRound - 25) / 30) * 0.35; // 0.65 – 1.0
  } else if (distKmRound <= 85) {
    proximityFactor = 0.65 - ((distKmRound - 55) / 30) * 0.55; // 0.10 – 0.65
  } else {
    proximityFactor = 0.0;
  }

  const astro = calcAstronomicalFactor(date);
  const tideRisk = Math.round(astro.score * proximityFactor * 100) / 100;
  // High tide alert only triggers during actual spring tide (น้ำเกิด) or significant seasonal surge
  const isHighTideAlert =
    astro.phase === "spring_tide" || (tideRisk >= 0.65 && astro.approxMsl >= 1.7);

  const dailyExtremes = calcDailyTideExtremes(
    date,
    distKmRound,
    astro.approxMsl,
    astro.phase,
  );

  return {
    tideRisk,
    astronomicalLevelM: astro.approxMsl,
    lunarPhase: astro.phase,
    phaseLabel: astro.label,
    isHighTideAlert,
    distanceToEstuaryKm: distKmRound,
    dailyExtremes,
  };
}

/**
 * Calculate the estimated daily high tide peak and low tide times.
 */
function calcDailyTideExtremes(
  date: Date,
  distKmRound: number,
  approxMsl: number,
  phase: "spring_tide" | "moderate" | "neap_tide",
): DailyTideExtremes {
  const age = getApproximateLunarAge(date);
  // Mean lunar transit time in Bangkok solar time (0–24 hours)
  const transitHours = (age * (24 / 29.53058867)) % 24;
  // High Water interval at Chao Phraya mouth (~7.2 hours after lunar transit)
  const mouthHighHours = (transitHours + 7.2) % 24;

  // Prefer daytime/evening peak (05:30 - 22:30) that residents monitor
  let primaryHighHours = mouthHighHours;
  if (primaryHighHours < 5.0) {
    primaryHighHours = (primaryHighHours + 12.4) % 24;
  } else if (primaryHighHours > 23.0) {
    primaryHighHours = (primaryHighHours - 12.4 + 24) % 24;
  }

  // Tidal wave celerity: propagates upstream at ~22 km/h
  const upstreamDelay = Math.min(2.5, distKmRound / 22);
  const localHighHours = (primaryHighHours + upstreamDelay) % 24;

  // In mixed/diurnal tide, the daytime low tide within the same 24-hour day
  let localLowHours: number;
  if (localHighHours >= 12.0) {
    localLowHours = (localHighHours - 7.2 + 24) % 24;
  } else {
    localLowHours = (localHighHours + 7.2) % 24;
  }

  const formatTime = (h: number): string => {
    const hh = Math.floor(h) % 24;
    const mm = Math.round((h - Math.floor(h)) * 60) % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")} น.`;
  };

  const highTideTime = formatTime(localHighHours);
  const lowTideTime = formatTime(localLowHours);

  const tidalRange =
    phase === "spring_tide" ? 1.45 : phase === "neap_tide" ? 0.75 : 1.1;
  const highTideLevelM = Math.round(approxMsl * 100) / 100;
  const lowTideLevelM =
    Math.max(0.15, Math.round((approxMsl - tidalRange) * 100) / 100);

  const summaryText = `น้ำขึ้นสูงสุด ~${highTideTime} (+${highTideLevelM.toFixed(2)} ม.) • น้ำลงต่ำสุด ~${lowTideTime} (+${lowTideLevelM.toFixed(2)} ม.)`;

  return {
    highTideTime,
    highTideLevelM,
    lowTideTime,
    lowTideLevelM,
    summaryText,
  };
}
