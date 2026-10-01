"use client";

import type { DashboardResponse } from "@/lib/types/domain";
import { Droplets, CloudRain } from "lucide-react";
import { UI_TEXT, FRESHNESS_LABEL } from "@/lib/i18n/th";

interface WaterDataCardProps {
  water: DashboardResponse["water"];
}

export function WaterDataCard({ water }: WaterDataCardProps) {
  const {
    station,
    current,
    trend6h,
    trend12h,
    trend24h,
    rateMetersPerHour,
    freshness,
  } = water;

  function trendLabel(changeM: number | null): string {
    if (changeM === null) return UI_TEXT.dataNotAvailable;
    if (Math.abs(changeM) < 0.01) return UI_TEXT.stableTrend;
    const dir =
      changeM > 0
        ? `▲ +${changeM.toFixed(2)} ม.`
        : `▼ ${changeM.toFixed(2)} ม.`;
    return dir;
  }

  function trendColor(changeM: number | null): string {
    if (changeM === null) return "var(--color-text-muted)";
    if (changeM > 0.05) return "var(--color-high)";
    if (changeM < -0.05) return "var(--color-low)";
    return "var(--color-text-secondary)";
  }

  return (
    <div className="card">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "12px",
        }}
      >
        <h2
          style={{
            fontSize: "0.9rem",
            fontWeight: 600,
            margin: 0,
            color: "var(--color-text-primary)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <Droplets size={16} color="var(--color-accent)" />
          <span>{UI_TEXT.waterLevel}</span>
        </h2>
        <span
          style={{
            fontSize: "0.72rem",
            color:
              freshness === "fresh" ? "var(--color-low)" : "var(--color-watch)",
          }}
        >
          {FRESHNESS_LABEL[freshness]}
        </span>
      </div>

      {/* Station info */}
      <p
        style={{
          fontSize: "0.78rem",
          color: "var(--color-text-muted)",
          margin: "0 0 12px 0",
        }}
      >
        {UI_TEXT.nearestStation}: {station.name}
        {station.river ? ` (แม่น้ำ${station.river})` : ""}
      </p>

      {/* Current level */}
      <div className="data-row">
        <span className="data-row__label">ระดับน้ำปัจจุบัน</span>
        <span className="data-row__value">
          {current?.waterLevelM !== undefined && current.waterLevelM !== null
            ? `${current.waterLevelM.toFixed(2)} ${UI_TEXT.metersAboveMSL}`
            : UI_TEXT.dataNotAvailable}
        </span>
      </div>

      {/* Trend rows */}
      <div className="data-row">
        <span className="data-row__label">{UI_TEXT.lastXHours(6)}</span>
        <span
          className="data-row__value"
          style={{ color: trendColor(trend6h) }}
        >
          {trendLabel(trend6h)}
        </span>
      </div>
      <div className="data-row">
        <span className="data-row__label">{UI_TEXT.lastXHours(12)}</span>
        <span
          className="data-row__value"
          style={{ color: trendColor(trend12h) }}
        >
          {trendLabel(trend12h)}
        </span>
      </div>
      <div className="data-row">
        <span className="data-row__label">{UI_TEXT.lastXHours(24)}</span>
        <span
          className="data-row__value"
          style={{ color: trendColor(trend24h) }}
        >
          {trendLabel(trend24h)}
        </span>
      </div>

      {/* Rate */}
      {rateMetersPerHour !== null && (
        <div className="data-row">
          <span className="data-row__label">อัตราการเปลี่ยนแปลง</span>
          <span
            className="data-row__value"
            style={{ color: trendColor(rateMetersPerHour) }}
          >
            {rateMetersPerHour >= 0 ? "+" : ""}
            {rateMetersPerHour.toFixed(3)} ม./ชม.
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Rainfall card ────────────────────────────────────────────────────────

interface RainDataCardProps {
  rain: DashboardResponse["rain"];
}

export function RainDataCard({ rain }: RainDataCardProps) {
  const { station, total1h, total6h, total24h, freshness } = rain;

  function mmStr(val: number | null) {
    return val !== null
      ? `${val.toFixed(1)} ${UI_TEXT.millimeters}`
      : UI_TEXT.dataNotAvailable;
  }

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "12px",
        }}
      >
        <h2
          style={{
            fontSize: "0.9rem",
            fontWeight: 600,
            margin: 0,
            color: "var(--color-text-primary)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <CloudRain size={16} color="var(--color-accent)" />
          <span>{UI_TEXT.rainfall}</span>
        </h2>
        <span
          style={{
            fontSize: "0.72rem",
            color:
              freshness === "fresh" ? "var(--color-low)" : "var(--color-watch)",
          }}
        >
          {FRESHNESS_LABEL[freshness]}
        </span>
      </div>

      {station && (
        <p
          style={{
            fontSize: "0.78rem",
            color: "var(--color-text-muted)",
            margin: "0 0 12px 0",
          }}
        >
          {UI_TEXT.nearestStation}: {station.name}
        </p>
      )}

      <div className="data-row">
        <span className="data-row__label">สะสม 1 ชั่วโมง</span>
        <span className="data-row__value">{mmStr(total1h)}</span>
      </div>
      <div className="data-row">
        <span className="data-row__label">สะสม 6 ชั่วโมง</span>
        <span className="data-row__value">{mmStr(total6h)}</span>
      </div>
      <div className="data-row">
        <span className="data-row__label">สะสม 24 ชั่วโมง</span>
        <span className="data-row__value">{mmStr(total24h)}</span>
      </div>
    </div>
  );
}
