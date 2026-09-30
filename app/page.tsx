"use client";

/**
 * หน้าหลัก — บ้านกู้ท่วมไหม?
 * แสดงผลการประเมินความเสี่ยงน้ำท่วมของตำแหน่งบ้านที่เลือก
 */

import { useState } from "react";
import { BottomNav } from "@/components/common/BottomNav";
import {
  RiskStatusCard,
  RiskCardSkeleton,
  DataCardSkeleton,
} from "@/components/risk/RiskCard";
import { WaterDataCard, RainDataCard } from "@/components/risk/DataCards";
import { Historical2011Card } from "@/components/history/Historical2011Card";
import { UI_TEXT } from "@/lib/i18n/th";
import type { DashboardResponse } from "@/lib/types/domain";

// ─── Demo data (placeholder until real API is wired) ─────────────────────

const DEMO_DATA: DashboardResponse = {
  location: {
    id: "demo-nonthaburi",
    latitude: 13.8621,
    longitude: 100.5144,
    groundElevationM: 1.8,
    label: "นนทบุรี (ตัวอย่าง)",
  },
  risk: {
    locationId: "demo-nonthaburi",
    generatedAt: new Date().toISOString(),
    level: "watch",
    score: 0.38,
    confidence: "medium",
    waterLevelRisk: 0.55,
    waterTrendRisk: 0.40,
    rainfallRisk: 0.35,
    upstreamRisk: 0.20,
    infrastructureRisk: 0.10,
    tideRisk: 0.05,
    elevationRisk: 0.30,
    reasons: [
      "ระดับน้ำสูงกว่าปกติ",
      "แนวโน้มระดับน้ำสูงขึ้น",
      "มีฝนตกปานกลาง",
    ],
    recommendedAction: "เฝ้าระวังและตรวจสอบข้อมูลจากหน่วยงานอย่างต่อเนื่อง พิจารณาขนย้ายสิ่งของมีค่าขึ้นที่สูง",
    distanceToCriticalLevelM: 0.65,
    estimatedElevationMarginM: 0.42,
  },
  water: {
    station: {
      id: "hii-N67A",
      provider: "HII",
      externalId: "N67A",
      name: "ท่าน้ำนนทบุรี",
      latitude: 13.8613,
      longitude: 100.5136,
      river: "เจ้าพระยา",
      basin: "เจ้าพระยา",
      datum: "ม.รทก.",
      unit: "m",
    },
    current: {
      stationId: "hii-N67A",
      observedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      fetchedAt: new Date().toISOString(),
      waterLevelM: 1.43,
      provider: "HII",
    },
    trend6h: 0.12,
    trend12h: 0.22,
    trend24h: 0.31,
    rateMetersPerHour: 0.020,
    freshness: "fresh",
  },
  rain: {
    station: {
      id: "hii-rain-NB01",
      provider: "HII",
      externalId: "NB01",
      name: "สถานีฝนนนทบุรี",
      latitude: 13.860,
      longitude: 100.512,
    },
    total1h: 8.2,
    total6h: 32.5,
    total24h: 67.0,
    freshness: "fresh",
  },
  historicalComparison: {
    stationId: "hii-N67A",
    stationName: "ท่าน้ำนนทบุรี",
    referenceYear: 2011,
    referencePeakLevelM: 2.72,
    referencePeakDate: "2011-10-20",
    referencePeakSource: "RID / HII archive",
    currentLevelM: 1.43,
    differenceM: 1.29,
    narrativeSummary:
      "ในปี 2554 ระดับน้ำที่ท่าน้ำนนทบุรีขึ้นสูงถึง 2.72 ม.รทก. ซึ่งนับเป็นระดับสูงสุดในรอบหลายสิบปี",
  },
  confidence: "medium",
  updatedAt: new Date().toISOString(),
  dataNotices: ["ข้อมูลนี้เป็นตัวอย่างเพื่อการแสดงผล ยังไม่ได้เชื่อมต่อกับข้อมูลจริง"],
};

// ─── Page component ───────────────────────────────────────────────────────

export default function HomePage() {
  const [showDetails, setShowDetails] = useState(false);
  const isLoading = false; // will be replaced by TanStack Query
  const data = DEMO_DATA;

  return (
    <>
      <main className="page" id="main-content">
        {/* App header */}
        <header style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h1
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  margin: 0,
                  color: "var(--color-text-primary)",
                }}
              >
                {UI_TEXT.appName}
              </h1>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "var(--color-text-muted)",
                  margin: "2px 0 0 0",
                }}
              >
                {UI_TEXT.appTagline}
              </p>
            </div>
            {/* Location pill */}
            {data?.location.label && (
              <button
                id="change-location-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-full)",
                  padding: "6px 12px",
                  fontSize: "0.78rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  color: "var(--color-text-secondary)",
                }}
              >
                📍 {data.location.label}
              </button>
            )}
          </div>
        </header>

        {/* Data notice banners */}
        {data?.dataNotices && data.dataNotices.length > 0 && (
          <div style={{ marginBottom: "12px" }}>
            {data.dataNotices.map((notice, i) => (
              <div key={i} className="notice notice--info" style={{ marginBottom: "6px" }}>
                <span>ℹ️</span>
                <span>{notice}</span>
              </div>
            ))}
          </div>
        )}

        {/* Primary risk card */}
        {isLoading ? (
          <div style={{ marginBottom: "16px" }}>
            <RiskCardSkeleton />
          </div>
        ) : data ? (
          <div style={{ marginBottom: "16px" }}>
            <RiskStatusCard
              level={data.risk.level}
              reasons={data.risk.reasons}
              confidence={data.risk.confidence}
              updatedAt={data.updatedAt}
              recommendedAction={data.risk.recommendedAction}
            />
          </div>
        ) : null}

        {/* Elevation margin */}
        {data?.risk.estimatedElevationMarginM !== undefined && (
          <div className="card" style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--color-text-secondary)" }}>
                🏠 {UI_TEXT.elevationMargin}
              </span>
              <span
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color:
                    (data.risk.estimatedElevationMarginM ?? 0) < 0.3
                      ? "var(--color-high)"
                      : "var(--color-low)",
                }}
              >
                {data.risk.estimatedElevationMarginM !== undefined && data.risk.estimatedElevationMarginM > 0
                  ? `+${data.risk.estimatedElevationMarginM.toFixed(2)} ม.`
                  : `${data.risk.estimatedElevationMarginM?.toFixed(2)} ม.`}
              </span>
            </div>
            <p style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", margin: "6px 0 0 0" }}>
              {UI_TEXT.elevationMarginDisclaimer}
            </p>
          </div>
        )}

        {/* Toggle details button */}
        <button
          id="toggle-details-btn"
          className="btn btn--outline"
          style={{ width: "100%", marginBottom: "16px" }}
          onClick={() => setShowDetails((v) => !v)}
        >
          {showDetails ? "▲ ซ่อนรายละเอียด" : "▼ " + UI_TEXT.viewDetails}
        </button>

        {/* Details section (progressive disclosure) */}
        {showDetails && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {isLoading ? (
              <>
                <DataCardSkeleton />
                <DataCardSkeleton />
              </>
            ) : data ? (
              <>
                <WaterDataCard water={data.water} />
                <RainDataCard rain={data.rain} />
              </>
            ) : null}
          </div>
        )}

        {/* 2011 Comparison */}
        <div style={{ marginTop: "16px", marginBottom: "8px" }}>
          {isLoading ? (
            <DataCardSkeleton />
          ) : (
            <Historical2011Card
              comparison={data?.historicalComparison ?? null}
              currentLevelM={data?.water.current?.waterLevelM}
            />
          )}
        </div>

        {/* App disclaimer */}
        <p
          style={{
            fontSize: "0.72rem",
            color: "var(--color-text-muted)",
            textAlign: "center",
            marginTop: "16px",
            lineHeight: 1.6,
          }}
        >
          {UI_TEXT.disclaimer}
        </p>
      </main>

      <BottomNav />
    </>
  );
}
