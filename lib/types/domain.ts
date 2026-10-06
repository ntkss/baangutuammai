/**
 * BaanGuTuamMai — Core Domain Types
 * All internal data models. Provider-specific parsing must NEVER leak here.
 */

// ---------------------------------------------------------------------------
// Location
// ---------------------------------------------------------------------------

export type UserLocation = {
  id: string;
  latitude: number;
  longitude: number;
  /** Estimated ground elevation from DEM (meters MSL) */
  groundElevationM?: number;
  /** User-supplied or estimated floor elevation (meters MSL) */
  floorElevationM?: number;
  label?: string;
};

// ---------------------------------------------------------------------------
// Water Stations & Observations
// ---------------------------------------------------------------------------

export type WaterStation = {
  id: string;
  provider: string;
  externalId: string;
  name: string;
  latitude: number;
  longitude: number;
  river?: string;
  basin?: string;
  /** Vertical datum / reference level description */
  datum?: string;
  unit: string;
  /** Active / offline / unknown */
  status?: string;
};

export type WaterObservation = {
  stationId: string;
  observedAt: string; // ISO-8601 UTC
  fetchedAt: string; // ISO-8601 UTC
  waterLevelM?: number;
  dischargeM3s?: number;
  quality?: string;
  provider: string;
};

// ---------------------------------------------------------------------------
// Rainfall
// ---------------------------------------------------------------------------

export type RainStation = {
  id: string;
  provider: string;
  externalId: string;
  name: string;
  latitude: number;
  longitude: number;
  basin?: string;
  status?: string;
};

export type RainObservation = {
  stationId: string;
  observedAt: string;
  fetchedAt: string;
  rainfallMm?: number;
  windowHours?: number; // accumulation window
  provider: string;
};

// ---------------------------------------------------------------------------
// Reservoir
// ---------------------------------------------------------------------------

export type Reservoir = {
  id: string;
  provider: string;
  externalId: string;
  name: string;
  latitude: number;
  longitude: number;
  capacityMcm?: number;
};

export type ReservoirObservation = {
  reservoirId: string;
  observedAt: string;
  fetchedAt: string;
  storageMcm?: number;
  storagePercent?: number;
  inflowM3s?: number;
  outflowM3s?: number;
  provider: string;
};

// ---------------------------------------------------------------------------
// Infrastructure (Gates / Pumps)
// ---------------------------------------------------------------------------

export type InfrastructureAsset = {
  id: string;
  provider: string;
  externalId: string;
  name: string;
  type: "gate" | "pump" | "weir" | "other";
  latitude: number;
  longitude: number;
  river?: string;
};

export type InfrastructureObservation = {
  assetId: string;
  observedAt: string;
  fetchedAt: string;
  status?: string;
  openingPercent?: number;
  flowM3s?: number;
  provider: string;
};

// ---------------------------------------------------------------------------
// Tide
// ---------------------------------------------------------------------------

export type TideObservation = {
  stationId: string;
  observedAt: string;
  fetchedAt: string;
  seaLevelM?: number;
  provider: string;
};

// ---------------------------------------------------------------------------
// Risk Assessment
// ---------------------------------------------------------------------------

export type RiskLevel = "low" | "watch" | "high" | "severe";
export type ConfidenceLevel = "high" | "medium" | "limited";
export type FreshnessStatus = "fresh" | "aging" | "stale" | "unavailable";
export type RiskZone = "bangkok_urban" | "chao_phraya_valley" | "general";

export type RiskAssessment = {
  locationId: string;
  generatedAt: string;
  level: RiskLevel;
  /** Normalised 0–1 composite score. Never show raw to users. */
  score: number;
  confidence: ConfidenceLevel;
  zone?: RiskZone;
  zoneLabel?: string;

  /** Individual normalised sub-scores (0–1) */
  waterLevelRisk: number;
  waterTrendRisk: number;
  rainfallRisk: number;
  upstreamRisk: number;
  infrastructureRisk: number;
  tideRisk: number;
  elevationRisk: number;

  /** Human-readable short sentences explaining the main risk drivers */
  reasons: string[];
  recommendedAction?: string;

  /** Distance in metres between current water level and critical threshold at the relevant station */
  distanceToCriticalLevelM?: number;
  /** Estimated margin between floor elevation and estimated water surface (metres). Label as estimate only. */
  estimatedElevationMarginM?: number;
};

// ---------------------------------------------------------------------------
// Historical comparison
// ---------------------------------------------------------------------------

export type HistoricalObservation = {
  id: string;
  stationId: string;
  date: string; // YYYY-MM-DD
  waterLevelM?: number;
  rainfallMm?: number;
  knownFloodStatus?: string;
  source: string;
  notes?: string;
};

export type HistoricalComparison = {
  stationId: string;
  stationName: string;
  referenceYear: number;
  referencePeakLevelM?: number;
  referencePeakDate?: string;
  referencePeakSource?: string;
  currentLevelM?: number;
  differenceM?: number; // positive = current is BELOW peak (good)
  narrativeSummary: string;
};

// ---------------------------------------------------------------------------
// Data source registry
// ---------------------------------------------------------------------------

export type DataSourceStatus =
  | "verified"
  | "partially_verified"
  | "research_only"
  | "unverified"
  | "deprecated";

export type DataSource = {
  id: string;
  name: string;
  organization: string;
  category:
    | "water_level"
    | "rainfall"
    | "reservoir"
    | "infrastructure"
    | "tide"
    | "elevation"
    | "historical_flood";
  baseUrl: string;
  endpoint?: string;
  authType: "none" | "api_key" | "oauth" | "other";
  updateFrequencyMinutes?: number;
  historicalStartYear?: number;
  format: string;
  license?: string;
  attribution?: string;
  status: DataSourceStatus;
  lastVerifiedAt?: string;
  notes?: string;
  lastSuccessfulFetch?: string;
  lastObservationTime?: string;
  fetchStatus?: "ok" | "error" | "degraded";
  errorMessage?: string;
};

// ---------------------------------------------------------------------------
// Dashboard aggregate response (from /api/dashboard)
// ---------------------------------------------------------------------------

export type DashboardResponse = {
  location: UserLocation;
  risk: RiskAssessment;
  water: {
    station: WaterStation;
    current: WaterObservation | null;
    trend6h: number | null; // metres change
    trend12h: number | null;
    trend24h: number | null;
    rateMetersPerHour: number | null;
    freshness: FreshnessStatus;
  };
  rain: {
    station: RainStation | null;
    total1h: number | null;
    total6h: number | null;
    total24h: number | null;
    freshness: FreshnessStatus;
  };
  historicalComparison: HistoricalComparison | null;
  confidence: ConfidenceLevel;
  updatedAt: string;
  dataNotices: string[]; // e.g. "Some supporting data is delayed."
};
