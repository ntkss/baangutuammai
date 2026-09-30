/**
 * BaanGuTuamMai — Risk Engine
 *
 * A transparent, deterministic, weighted risk model.
 * NO machine learning. Every result must be traceable.
 *
 * Weights are configurable; never hard-code them in multiple places.
 * All user-facing strings are sourced from lib/i18n/th.ts (Thai).
 */

import type { RiskLevel, RiskAssessment, ConfidenceLevel } from "@/lib/types/domain";
import { RISK_REASONS, RECOMMENDED_ACTIONS } from "@/lib/i18n/th";

// ---------------------------------------------------------------------------
// Weight configuration
// ---------------------------------------------------------------------------

export type RiskWeights = {
  waterLevel: number;     // 0–1 fraction
  waterTrend: number;
  rainfall: number;
  upstream: number;
  elevation: number;
  infrastructure: number;
  tide: number;
};

/**
 * Default weights from IMPLEMENTATION_PLAN.md §8.1
 * Sum must equal 1.0
 */
export const DEFAULT_RISK_WEIGHTS: RiskWeights = {
  waterLevel: 0.30,
  waterTrend: 0.20,
  rainfall: 0.15,
  upstream: 0.10,
  elevation: 0.10,
  infrastructure: 0.10,
  tide: 0.05,
};

// ---------------------------------------------------------------------------
// Signal normalizers
// ---------------------------------------------------------------------------

/**
 * Clamp a value to [0, 1].
 */
export function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

/**
 * Normalize water level to a 0–1 risk score.
 *
 * @param currentLevelM - Current observation (metres)
 * @param criticalLevelM - Station-specific critical/flood-stage level (metres)
 * @param watchLevelM   - Optional station watch level (metres)
 */
export function normalizeWaterLevel(
  currentLevelM: number,
  criticalLevelM: number,
  watchLevelM?: number
): number {
  if (currentLevelM >= criticalLevelM) return 1.0;
  const lower = watchLevelM ?? criticalLevelM * 0.7;
  if (currentLevelM <= lower) return 0.0;
  return clamp01((currentLevelM - lower) / (criticalLevelM - lower));
}

/**
 * Normalize water-level trend.
 *
 * @param changeM    - Change in metres over the trend window (positive = rising)
 * @param windowHours - Duration of the window (e.g. 6, 12, 24)
 */
export function normalizeWaterTrend(changeM: number, windowHours: number): number {
  // A rise of ≥ 0.5 m in 6 h is considered severe.
  const severeRatePerHour = 0.5 / 6;
  const ratePerHour = changeM / windowHours;
  if (ratePerHour <= 0) return 0.0; // falling or stable
  return clamp01(ratePerHour / severeRatePerHour);
}

/**
 * Normalize rainfall total to 0–1 risk.
 *
 * Thresholds are derived from Thai Meteorological Department rainfall categories.
 * Stored here as an engineering assumption — NOT an official safety threshold.
 *
 * @param rainfallMm  - Accumulated rainfall in mm
 * @param windowHours - Accumulation window
 */
export function normalizeRainfall(rainfallMm: number, windowHours: number): number {
  // Rough thresholds per 24 h scaled to window:
  // Light:  0–35 mm/24h
  // Moderate: 35–90 mm/24h
  // Heavy:   90–200 mm/24h
  // Very heavy: >200 mm/24h → score = 1.0
  const scale = windowHours / 24;
  const scaled = rainfallMm / scale;
  if (scaled < 35) return 0.0;
  if (scaled >= 200) return 1.0;
  return clamp01((scaled - 35) / (200 - 35));
}

/**
 * Normalize elevation margin (distance between estimated water and floor) to risk.
 *
 * @param marginM - floorElevationM - estimatedWaterSurfaceM
 *                  Positive = floor is above water (safe margin)
 *                  Negative = water is above floor (at risk)
 */
export function normalizeElevationMargin(marginM: number): number {
  if (marginM <= 0) return 1.0;   // floor at or below estimated water
  if (marginM >= 2.0) return 0.0; // 2 m above water: low risk
  return clamp01(1 - marginM / 2.0);
}

// ---------------------------------------------------------------------------
// Composite score
// ---------------------------------------------------------------------------

export type RiskInputs = {
  waterLevelRisk: number;
  waterTrendRisk: number;
  rainfallRisk: number;
  upstreamRisk: number;
  elevationRisk: number;
  infrastructureRisk: number;
  tideRisk: number;
};

/**
 * Compute the weighted composite risk score.
 * Returns a value in [0, 1].
 */
export function computeRiskScore(
  inputs: RiskInputs,
  weights: RiskWeights = DEFAULT_RISK_WEIGHTS
): number {
  return clamp01(
    inputs.waterLevelRisk * weights.waterLevel +
    inputs.waterTrendRisk * weights.waterTrend +
    inputs.rainfallRisk * weights.rainfall +
    inputs.upstreamRisk * weights.upstream +
    inputs.elevationRisk * weights.elevation +
    inputs.infrastructureRisk * weights.infrastructure +
    inputs.tideRisk * weights.tide
  );
}

// ---------------------------------------------------------------------------
// Score → Level
// ---------------------------------------------------------------------------

/**
 * Convert a normalised score to a risk level.
 *
 * 0.00–0.24 → low
 * 0.25–0.49 → watch
 * 0.50–0.74 → high
 * 0.75–1.00 → severe
 *
 * These thresholds are configurable here. Do not duplicate them elsewhere.
 */
export function scoreToLevel(score: number): RiskLevel {
  if (score >= 0.75) return "severe";
  if (score >= 0.50) return "high";
  if (score >= 0.25) return "watch";
  return "low";
}

// ---------------------------------------------------------------------------
// Reason generation
// ---------------------------------------------------------------------------

/**
 * Generate a human-readable list of the primary risk drivers.
 * Returns plain-language sentences for display on the dashboard.
 * Intentionally avoids raw numbers; these are contextual descriptions.
 */
export function generateReasons(inputs: RiskInputs): string[] {
  const reasons: string[] = [];

  if (inputs.waterLevelRisk >= 0.75) {
    reasons.push(RISK_REASONS.waterLevelCritical);
  } else if (inputs.waterLevelRisk >= 0.50) {
    reasons.push(RISK_REASONS.waterLevelElevated);
  } else if (inputs.waterLevelRisk >= 0.25) {
    reasons.push(RISK_REASONS.waterLevelRising);
  }

  if (inputs.waterTrendRisk >= 0.75) {
    reasons.push(RISK_REASONS.waterTrendRapid);
  } else if (inputs.waterTrendRisk >= 0.50) {
    reasons.push(RISK_REASONS.waterTrendIncreasing);
  }

  if (inputs.rainfallRisk >= 0.75) {
    reasons.push(RISK_REASONS.rainfallVeryHeavy);
  } else if (inputs.rainfallRisk >= 0.50) {
    reasons.push(RISK_REASONS.rainfallHeavy);
  } else if (inputs.rainfallRisk >= 0.25) {
    reasons.push(RISK_REASONS.rainfallModerate);
  }

  if (inputs.upstreamRisk >= 0.50) {
    reasons.push(RISK_REASONS.upstreamElevated);
  }

  if (inputs.elevationRisk >= 0.75) {
    reasons.push(RISK_REASONS.elevationLowMargin);
  } else if (inputs.elevationRisk <= 0.10) {
    reasons.push(RISK_REASONS.elevationGoodMargin);
  }

  if (inputs.infrastructureRisk >= 0.50) {
    reasons.push(RISK_REASONS.drainageLimited);
  }

  if (inputs.tideRisk >= 0.50) {
    reasons.push(RISK_REASONS.tidalEffect);
  }

  if (reasons.length === 0) {
    reasons.push(RISK_REASONS.normalConditions);
  }

  return reasons;
}

/**
 * Generate a recommended action string based on risk level.
 * All text is Thai. These are general suggestions, NOT official emergency guidance.
 */
export function generateRecommendedAction(level: RiskLevel): string | undefined {
  const action = RECOMMENDED_ACTIONS[level];
  return action || undefined;
}

// ---------------------------------------------------------------------------
// Confidence calculation
// ---------------------------------------------------------------------------

export type ConfidenceInputs = {
  hasCurrentWaterLevel: boolean;
  waterObservationAgeMinutes: number;
  hasRainfall: boolean;
  rainObservationAgeMinutes: number;
  hasElevation: boolean;
  stationDistanceKm: number;
  numberOfSignals: number;
};

/**
 * Derive data confidence from available signals and their freshness.
 */
export function computeConfidence(inputs: ConfidenceInputs): ConfidenceLevel {
  if (
    !inputs.hasCurrentWaterLevel ||
    inputs.waterObservationAgeMinutes > 120
  ) {
    return "limited";
  }

  const isWaterFresh = inputs.waterObservationAgeMinutes <= 30;
  const isRainFresh = !inputs.hasRainfall || inputs.rainObservationAgeMinutes <= 60;
  const isNearby = inputs.stationDistanceKm <= 15;
  const hasEnoughSignals = inputs.numberOfSignals >= 2;

  if (isWaterFresh && isRainFresh && isNearby && hasEnoughSignals && inputs.hasElevation) {
    return "high";
  }

  return "medium";
}

// ---------------------------------------------------------------------------
// Trend calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the water level change over a time window.
 * Uses median of the last N observations in the window to reduce noise.
 *
 * @param observations - Array of { timestamp: Date; level: number } sorted ascending
 * @param windowMs     - Window duration in milliseconds
 * @returns Change in metres (positive = rising, negative = falling, null = insufficient data)
 */
export function calculateWaterLevelTrend(
  observations: Array<{ timestamp: Date; level: number }>,
  windowMs: number
): number | null {
  if (observations.length < 2) return null;

  const now = observations[observations.length - 1].timestamp.getTime();
  const cutoff = now - windowMs;

  const recent = observations.filter((o) => o.timestamp.getTime() >= cutoff);
  const previous = observations.filter((o) => o.timestamp.getTime() < cutoff);

  if (recent.length === 0 || previous.length === 0) return null;

  const recentMedian = median(recent.map((o) => o.level));
  const previousMedian = median(previous.map((o) => o.level));

  return recentMedian - previousMedian;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ---------------------------------------------------------------------------
// Full assessment builder
// ---------------------------------------------------------------------------

export type BuildAssessmentParams = {
  locationId: string;
  inputs: RiskInputs;
  weights?: RiskWeights;
  distanceToCriticalLevelM?: number;
  estimatedElevationMarginM?: number;
  confidence: ConfidenceLevel;
};

export function buildRiskAssessment(params: BuildAssessmentParams): RiskAssessment {
  const {
    locationId,
    inputs,
    weights = DEFAULT_RISK_WEIGHTS,
    distanceToCriticalLevelM,
    estimatedElevationMarginM,
    confidence,
  } = params;

  const score = computeRiskScore(inputs, weights);
  const level = scoreToLevel(score);
  const reasons = generateReasons(inputs);
  const recommendedAction = generateRecommendedAction(level);

  return {
    locationId,
    generatedAt: new Date().toISOString(),
    level,
    score,
    confidence,
    waterLevelRisk: inputs.waterLevelRisk,
    waterTrendRisk: inputs.waterTrendRisk,
    rainfallRisk: inputs.rainfallRisk,
    upstreamRisk: inputs.upstreamRisk,
    infrastructureRisk: inputs.infrastructureRisk,
    tideRisk: inputs.tideRisk,
    elevationRisk: inputs.elevationRisk,
    reasons,
    recommendedAction,
    distanceToCriticalLevelM,
    estimatedElevationMarginM,
  };
}
