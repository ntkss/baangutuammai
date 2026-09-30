"use client";

import type { HistoricalComparison } from "@/lib/types/domain";
import { HISTORICAL_2011 } from "@/lib/i18n/th";

interface Historical2011CardProps {
  comparison: HistoricalComparison | null;
  currentLevelM?: number;
}

export function Historical2011Card({
  comparison,
  currentLevelM,
}: Historical2011CardProps) {
  if (!comparison) {
    return (
      <div className="card">
        <h2
          style={{
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--color-text-muted)",
            margin: "0 0 8px 0",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {HISTORICAL_2011.title}
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", margin: 0 }}>
          {HISTORICAL_2011.noData}
        </p>
      </div>
    );
  }

  const {
    stationName,
    referencePeakLevelM,
    differenceM,
    narrativeSummary,
  } = comparison;

  // Compute bar positions (0–100%)
  const peak = referencePeakLevelM ?? 0;
  const current = currentLevelM ?? comparison.currentLevelM ?? 0;
  const maxLevel = Math.max(peak, current) * 1.15;

  const peakPct = maxLevel > 0 ? Math.min(100, (peak / maxLevel) * 100) : 80;
  const currentPct = maxLevel > 0 ? Math.min(100, (current / maxLevel) * 100) : 50;

  const absDiff = differenceM !== undefined ? Math.abs(differenceM) : null;
  const diffStr = absDiff !== null ? absDiff.toFixed(2) : "—";

  let comparisonText: string;
  if (differenceM === null || differenceM === undefined) {
    comparisonText = HISTORICAL_2011.noData;
  } else if (differenceM > 0.05) {
    comparisonText = HISTORICAL_2011.below(diffStr);
  } else if (differenceM < -0.05) {
    comparisonText = HISTORICAL_2011.above(diffStr);
  } else {
    comparisonText = HISTORICAL_2011.equal;
  }

  return (
    <div className="card">
      {/* Header */}
      <h2
        style={{
          fontSize: "0.85rem",
          fontWeight: 600,
          color: "var(--color-text-muted)",
          margin: "0 0 4px 0",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
        }}
      >
        {HISTORICAL_2011.title}
      </h2>
      <p style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", margin: "0 0 16px 0" }}>
        สถานี: {stationName}
      </p>

      {/* Visual comparison bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
        {/* Current level */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)" }}>ปัจจุบัน</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>
              {current.toFixed(2)} ม.รทก.
            </span>
          </div>
          <div className="trend-bar">
            <div
              className="trend-bar__fill"
              style={{
                width: `${currentPct}%`,
                background: "var(--color-accent)",
              }}
            />
            <div
              className="trend-bar__marker"
              style={{
                left: `${currentPct}%`,
                background: "var(--color-accent)",
              }}
            />
          </div>
        </div>

        {/* 2011 peak */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)" }}>สูงสุดปี 2554</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 600 }}>
              {peak > 0 ? `${peak.toFixed(2)} ม.รทก.` : "—"}
            </span>
          </div>
          <div className="trend-bar">
            <div
              className="trend-bar__fill"
              style={{
                width: `${peakPct}%`,
                background: "var(--color-severe)",
              }}
            />
            <div
              className="trend-bar__marker"
              style={{
                left: `${peakPct}%`,
                background: "var(--color-severe)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Narrative */}
      <p
        style={{
          fontSize: "0.875rem",
          color: "var(--color-text-primary)",
          margin: "0 0 8px 0",
          lineHeight: 1.6,
        }}
      >
        {comparisonText}
      </p>
      {narrativeSummary && (
        <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", margin: "0 0 8px 0" }}>
          {narrativeSummary}
        </p>
      )}

      {/* Disclaimer */}
      <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", margin: 0 }}>
        {HISTORICAL_2011.disclaimer}
      </p>
    </div>
  );
}
