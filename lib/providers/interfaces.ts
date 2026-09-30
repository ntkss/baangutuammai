/**
 * BaanGuTuamMai — Provider Interfaces
 * Every external data source MUST implement these interfaces.
 * The risk engine and UI must never know how a provider fetches or parses data.
 */

import type {
  WaterStation,
  WaterObservation,
  RainStation,
  RainObservation,
  Reservoir,
  ReservoirObservation,
  InfrastructureAsset,
  InfrastructureObservation,
  TideObservation,
} from "@/lib/types/domain";

// ---------------------------------------------------------------------------
// Water Level
// ---------------------------------------------------------------------------

export interface WaterLevelProvider {
  readonly name: string;

  /** Fetch and return all known stations */
  getStations(): Promise<WaterStation[]>;

  /** Fetch observations for a station in the given UTC time range */
  getObservations(
    stationId: string,
    from: Date,
    to: Date,
  ): Promise<WaterObservation[]>;

  /** Fetch only the most recent observation for a station */
  getLatestObservation(stationId: string): Promise<WaterObservation | null>;
}

// ---------------------------------------------------------------------------
// Rainfall
// ---------------------------------------------------------------------------

export interface RainfallProvider {
  readonly name: string;

  getStations(): Promise<RainStation[]>;

  getObservations(
    stationId: string,
    from: Date,
    to: Date,
  ): Promise<RainObservation[]>;

  getLatestObservation(stationId: string): Promise<RainObservation | null>;
}

// ---------------------------------------------------------------------------
// Reservoir
// ---------------------------------------------------------------------------

export interface ReservoirProvider {
  readonly name: string;

  getReservoirs(): Promise<Reservoir[]>;

  getObservations(
    reservoirId: string,
    from: Date,
    to: Date,
  ): Promise<ReservoirObservation[]>;

  getLatestObservation(
    reservoirId: string,
  ): Promise<ReservoirObservation | null>;
}

// ---------------------------------------------------------------------------
// Infrastructure (Gates / Pumps)
// ---------------------------------------------------------------------------

export interface InfrastructureProvider {
  readonly name: string;

  getAssets(): Promise<InfrastructureAsset[]>;

  getLatestObservation(
    assetId: string,
  ): Promise<InfrastructureObservation | null>;
}

// ---------------------------------------------------------------------------
// Tide
// ---------------------------------------------------------------------------

export interface TideProvider {
  readonly name: string;

  getLatestObservation(stationId: string): Promise<TideObservation | null>;
}

// ---------------------------------------------------------------------------
// Elevation
// ---------------------------------------------------------------------------

export interface ElevationProvider {
  readonly name: string;

  /**
   * Return estimated terrain elevation in metres (MSL) for a lat/lng point.
   * Returns null if the provider cannot resolve the point.
   */
  getElevation(latitude: number, longitude: number): Promise<number | null>;
}
