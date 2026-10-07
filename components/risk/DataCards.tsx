"use client";

import type { DashboardResponse } from "@/lib/types/domain";
import type { EstuarineTideResult } from "@/lib/risk/tide";
import { Droplets, CloudRain } from "lucide-react";
import { UI_TEXT, FRESHNESS_LABEL } from "@/lib/i18n/th";

interface WaterDataCardProps {
  water: DashboardResponse["water"];
  extra?: {
    distanceKm?: number;
    bankLevelM?: number | null;
    diffBankM?: number | null;
    diffBankText?: string;
  } | null;
  tide?: EstuarineTideResult | null;
}

export function WaterDataCard({ water, extra, tide }: WaterDataCardProps) {
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

  const isBma = station.provider?.includes("กทม");
  const riverName = station.river
    ? station.river.startsWith("คลอง") || station.river.startsWith("แม่น้ำ")
      ? station.river
      : `แม่น้ำ${station.river}`
    : null;

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
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          {isBma && (
            <span
              style={{
                fontSize: "0.68rem",
                padding: "2px 6px",
                borderRadius: "4px",
                background: "rgba(3, 105, 161, 0.1)",
                color: "#0369a1",
                fontWeight: 700,
              }}
            >
              กทม.
            </span>
          )}
          <span
            style={{
              fontSize: "0.72rem",
              color:
                freshness === "fresh"
                  ? "var(--color-low)"
                  : "var(--color-watch)",
            }}
          >
            {FRESHNESS_LABEL[freshness]}
          </span>
        </div>
      </div>

      {/* Station info */}
      <div style={{ marginBottom: "12px" }}>
        <p
          style={{
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            margin: "0 0 3px 0",
          }}
        >
          {UI_TEXT.nearestStation}: {station.name}
          {riverName ? ` (${riverName})` : ""}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            fontSize: "0.72rem",
            color: "var(--color-text-muted)",
          }}
        >
          <span>
            สังกัด: <strong>{station.provider}</strong>
          </span>
          {extra?.distanceKm !== undefined && (
            <span>
              • ห่างจากบ้าน <strong>{extra.distanceKm} กม.</strong>
            </span>
          )}
        </div>
      </div>

      {/* Current level */}
      <div className="data-row">
        <span className="data-row__label">ระดับน้ำปัจจุบัน</span>
        <span className="data-row__value" style={{ fontWeight: 700 }}>
          {current?.waterLevelM !== undefined && current.waterLevelM !== null
            ? `${current.waterLevelM.toFixed(2)} ${UI_TEXT.metersAboveMSL}`
            : UI_TEXT.dataNotAvailable}
        </span>
      </div>

      {/* Bank / Critical threshold row if available */}
      {extra?.bankLevelM !== undefined && extra.bankLevelM !== null && (
        <div className="data-row">
          <span className="data-row__label">ระดับวิกฤต / สันตลิ่ง</span>
          <span
            className="data-row__value"
            style={{ color: "var(--color-text-secondary)" }}
          >
            +{extra.bankLevelM.toFixed(2)} ม.รทก.
          </span>
        </div>
      )}

      {/* Distance to bank margin */}
      {extra?.diffBankM !== undefined && extra.diffBankM !== null && (
        <div className="data-row">
          <span className="data-row__label">ระยะห่างถึงระดับวิกฤต</span>
          <span
            className="data-row__value"
            style={{
              color:
                extra.diffBankM < 0
                  ? "var(--color-severe)"
                  : extra.diffBankM < 0.5
                    ? "var(--color-high)"
                    : "var(--color-low)",
              fontWeight: 600,
            }}
          >
            {extra.diffBankM < 0
              ? `ล้นวิกฤต +${Math.abs(extra.diffBankM).toFixed(2)} ม.`
              : `ต่ำกว่าวิกฤต ${extra.diffBankM.toFixed(2)} ม.`}
            {extra.diffBankText ? ` (${extra.diffBankText})` : ""}
          </span>
        </div>
      )}

      {/* Trend rows (if recorded) */}
      {trend6h !== null && trend6h !== 0 && (
        <div className="data-row">
          <span className="data-row__label">{UI_TEXT.lastXHours(6)}</span>
          <span
            className="data-row__value"
            style={{ color: trendColor(trend6h) }}
          >
            {trendLabel(trend6h)}
          </span>
        </div>
      )}

      {trend12h !== null && trend12h !== 0 && (
        <div className="data-row">
          <span className="data-row__label">{UI_TEXT.lastXHours(12)}</span>
          <span
            className="data-row__value"
            style={{ color: trendColor(trend12h) }}
          >
            {trendLabel(trend12h)}
          </span>
        </div>
      )}

      {trend24h !== null && trend24h !== 0 && (
        <div className="data-row">
          <span className="data-row__label">{UI_TEXT.lastXHours(24)}</span>
          <span
            className="data-row__value"
            style={{ color: trendColor(trend24h) }}
          >
            {trendLabel(trend24h)}
          </span>
        </div>
      )}

      {/* Rate */}
      {rateMetersPerHour !== null && rateMetersPerHour !== 0 && (
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

      {/* Daily High / Low Tide Extremes (เวลาน้ำขึ้น/ลง สูงสุดในแต่ละวัน) */}
      {tide?.dailyExtremes && (
        <div
          style={{
            marginTop: "12px",
            paddingTop: "9px",
            borderTop: "1px dashed var(--color-border)",
            fontSize: "0.73rem",
            color: "var(--color-text-secondary)",
            lineHeight: 1.45,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "3px",
            }}
          >
            <span
              style={{
                fontWeight: 600,
                color: "var(--color-accent)",
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span>🌊</span>
              <span>เวลาน้ำทะเลหนุนวันนี้ ({tide.phaseLabel})</span>
            </span>
            <span
              style={{
                fontSize: "0.68rem",
                color: "var(--color-text-muted)",
              }}
            >
              อิงปากอ่าว/กรุงเทพฯ
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>
              น้ำขึ้นสูงสุด: <strong>~{tide.dailyExtremes.highTideTime}</strong> (+{tide.dailyExtremes.highTideLevelM.toFixed(2)} ม.รทก.)
            </span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span>
              น้ำลงต่ำสุด: <strong>~{tide.dailyExtremes.lowTideTime}</strong> (+{tide.dailyExtremes.lowTideLevelM.toFixed(2)} ม.รทก.)
            </span>
          </div>
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
      {rain.peakRate1h !== undefined &&
        rain.peakRate1h !== null &&
        rain.peakRate1h > 0 && (
          <div className="data-row">
            <span className="data-row__label">ความเข้มฝนสูงสุด (ชม.)</span>
            <span
              className="data-row__value"
              style={{
                color: rain.isExceedingDrainageCapacity
                  ? "var(--color-severe)"
                  : undefined,
                fontWeight: rain.isExceedingDrainageCapacity ? 700 : undefined,
              }}
            >
              {rain.peakRate1h.toFixed(1)} {UI_TEXT.millimeters}/ชม.
              {rain.isExceedingDrainageCapacity && " ⚠️ เกินขีดท่อ กทม."}
            </span>
          </div>
        )}
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
