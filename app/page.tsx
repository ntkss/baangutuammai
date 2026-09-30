"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/common/BottomNav";
import {
  RiskStatusCard,
  RiskCardSkeleton,
  DataCardSkeleton,
} from "@/components/risk/RiskCard";
import { WaterDataCard, RainDataCard } from "@/components/risk/DataCards";
import { NorthernRunoffCard } from "@/components/risk/NorthernRunoffCard";
import { Historical2011Card } from "@/components/history/Historical2011Card";
import { LocationPicker } from "@/components/location/LocationPicker";
import { useUserPrefs } from "@/lib/store/userPrefs";
import { UI_TEXT } from "@/lib/i18n/th";
import type { DashboardResponse } from "@/lib/types/domain";
import type { NorthernRunoffSummary } from "@/lib/providers/thaiwater";

// Default center: Nonthaburi
const DEFAULT_LAT = 13.862;
const DEFAULT_LNG = 100.514;

type ExtendedDashboardResponse = DashboardResponse & {
  _northernRunoff?: NorthernRunoffSummary | null;
  _reservoirBasin?: {
    totalCapacityMcm: number;
    totalStorageMcm: number;
    totalInflowM3s: number;
    totalOutflowM3s: number;
    avgStoragePercent: number;
    damCount: number;
    observedDate: string;
  } | null;
  _terrainElevation?: {
    elevationM: number | null;
    source: string;
    note: string;
  } | null;
};

export default function HomePage() {
  const { homeLocation, setHomeLocation } = useUserPrefs();
  const [data, setData] = useState<ExtendedDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const activeLat = homeLocation?.latitude ?? DEFAULT_LAT;
  const activeLng = homeLocation?.longitude ?? DEFAULT_LNG;

  useEffect(() => {
    let ignore = false;
    fetch(`/api/dashboard?lat=${activeLat}&lng=${activeLng}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ExtendedDashboardResponse>;
      })
      .then((d) => {
        if (!ignore) {
          setData(d);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError(UI_TEXT.errorLoading);
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeLat, activeLng]);

  function handleLocationSelect(
    newLat: number,
    newLng: number,
    label?: string,
  ) {
    setIsLoading(true);
    setError(null);
    setHomeLocation({
      id: `loc-${newLat.toFixed(4)}-${newLng.toFixed(4)}`,
      latitude: newLat,
      longitude: newLng,
      label,
    });
  }

  return (
    <>
      <main
        className="page"
        id="main-content"
        style={{ paddingBottom: "80px" }}
      >
        {/* ── App Header (Modern, Sleek & Clean) ──────────────── */}
        <header
          style={{
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #2563eb, #38bdf8)",
                  fontSize: "1.1rem",
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                }}
              >
                🌊
              </span>
              <h1
                style={{
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  margin: 0,
                  color: "var(--color-text-primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                {UI_TEXT.appName}
              </h1>
            </div>
            <p
              style={{
                fontSize: "0.78rem",
                color: "var(--color-text-muted)",
                margin: "4px 0 0 0",
              }}
            >
              {UI_TEXT.appTagline}
            </p>
          </div>
        </header>

        {/* ── Location Selector (Home location picker) ───────── */}
        <LocationPicker
          currentLat={activeLat}
          currentLng={activeLng}
          onLocationSelect={handleLocationSelect}
        />

        {/* ── Data notices ───────────────────────────────────── */}
        {data?.dataNotices && data.dataNotices.length > 0 && (
          <div style={{ marginBottom: "12px" }}>
            {data.dataNotices.map((notice, i) => (
              <div
                key={i}
                className="notice notice--info"
                style={{ marginBottom: "6px" }}
              >
                <span>ℹ️</span>
                <span>{notice}</span>
              </div>
            ))}
          </div>
        )}

        {/* ── Error state ────────────────────────────────────── */}
        {error && (
          <div
            className="notice notice--warning"
            style={{ marginBottom: "16px" }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ── 1. Primary Risk Card ───────────────────────────── */}
        <div style={{ marginBottom: "16px" }}>
          {isLoading ? (
            <RiskCardSkeleton />
          ) : data ? (
            <RiskStatusCard
              level={data.risk.level}
              reasons={data.risk.reasons}
              confidence={data.risk.confidence}
              updatedAt={data.updatedAt}
              recommendedAction={data.risk.recommendedAction}
            />
          ) : null}
        </div>

        {/* ── 2. Northern Runoff Focus (นครสวรรค์ C.2 + เขื่อนเจ้าพระยา C.13 + สายน้ำ 3 ตอน) ── */}
        {isLoading ? (
          <DataCardSkeleton />
        ) : data?._northernRunoff ? (
          <NorthernRunoffCard data={data._northernRunoff} />
        ) : null}

        {/* ── 3. Elevation Margin ────────────────────────────── */}
        {data?.risk.estimatedElevationMarginM !== undefined &&
          data.risk.estimatedElevationMarginM !== null && (
            <div className="card" style={{ marginBottom: "16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    🏠 {UI_TEXT.elevationMargin}
                  </span>
                  <p
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--color-text-muted)",
                      margin: "2px 0 0 0",
                    }}
                  >
                    {UI_TEXT.elevationMarginDisclaimer}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    color:
                      (data.risk.estimatedElevationMarginM ?? 0) < 0.3
                        ? "var(--color-high)"
                        : "var(--color-low)",
                  }}
                >
                  {(data.risk.estimatedElevationMarginM ?? 0) > 0
                    ? `+${data.risk.estimatedElevationMarginM?.toFixed(2)} ม.`
                    : `${data.risk.estimatedElevationMarginM?.toFixed(2)} ม.`}
                </span>
              </div>
            </div>
          )}

        {/* ── 4. Teaser Link to Critical Triggers Page (สัญญาณวิกฤต) ── */}
        <Link
          href="/triggers"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background:
              "linear-gradient(135deg, rgba(239, 246, 255, 0.95), rgba(254, 242, 242, 0.8))",
            border: "1px solid rgba(191, 219, 254, 0.8)",
            borderRadius: "16px",
            padding: "14px 16px",
            marginBottom: "16px",
            textDecoration: "none",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                fontSize: "1.4rem",
                width: "42px",
                height: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "12px",
                background: "#ffffff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                flexShrink: 0,
              }}
            >
              ⚡
            </span>
            <div>
              <div
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>5 สัญญาณวิกฤตน้ำท่วมบ้าน</span>
                <span
                  style={{
                    fontSize: "0.65rem",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: "rgba(220, 38, 38, 0.1)",
                    color: "var(--color-severe)",
                    fontWeight: 700,
                  }}
                >
                  จุดชี้ชะตา
                </span>
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--color-text-secondary)",
                  marginTop: "2px",
                }}
              >
                เช็กเงื่อนไข: เขื่อนปล่อยน้ำ + ฝนซ้ำ + น้ำหนุน
              </div>
            </div>
          </div>

          <span
            style={{
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "var(--color-accent)",
              whiteSpace: "nowrap",
              paddingLeft: "8px",
            }}
          >
            ดูเงื่อนไข →
          </span>
        </Link>

        {/* ── 5. 2011 Historical Comparison ───────────────────── */}
        <div style={{ marginBottom: "16px" }}>
          {isLoading ? (
            <DataCardSkeleton />
          ) : (
            <Historical2011Card
              comparison={data?.historicalComparison ?? null}
              currentLevelM={data?.water.current?.waterLevelM}
              c2Discharge={data?._northernRunoff?.c2NakhonSawan?.dischargeM3s}
              c13Discharge={
                data?._northernRunoff?.c13ChaoPhrayaDam?.dischargeM3s
              }
              reservoirStoragePercent={data?._reservoirBasin?.avgStoragePercent}
            />
          )}
        </div>

        {/* ── 5. Progressive Disclosure: Toggle Details ───────── */}
        <button
          id="toggle-details-btn"
          className="btn btn--outline"
          style={{ width: "100%", marginBottom: "16px", padding: "10px" }}
          onClick={() => setShowDetails((v) => !v)}
        >
          {showDetails
            ? "▲ ซ่อนรายละเอียดระดับน้ำและฝน"
            : "▼ ดูรายละเอียดระดับน้ำ ฝน และอ่างเก็บน้ำ"}
        </button>

        {showDetails && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            {data ? (
              <>
                <WaterDataCard water={data.water} />
                <RainDataCard rain={data.rain} />

                {/* Reservoir overview card */}
                {data._reservoirBasin && (
                  <div className="card">
                    <h2
                      style={{
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        margin: "0 0 10px 0",
                      }}
                    >
                      🏔️ เขื่อนหลักลุ่มน้ำเจ้าพระยา (ชป.)
                    </h2>
                    <div className="data-row">
                      <span className="data-row__label">
                        ความจุน้ำกักเก็บเฉลี่ย
                      </span>
                      <span className="data-row__value">
                        {data._reservoirBasin.avgStoragePercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="data-row">
                      <span className="data-row__label">
                        ปริมาณน้ำไหลเข้าเขื่อน
                      </span>
                      <span className="data-row__value">
                        {data._reservoirBasin.totalInflowM3s.toLocaleString()}{" "}
                        ลบ.ม./วินาที
                      </span>
                    </div>
                    <div className="data-row">
                      <span className="data-row__label">ปริมาณน้ำระบายออก</span>
                      <span className="data-row__value">
                        {data._reservoirBasin.totalOutflowM3s.toLocaleString()}{" "}
                        ลบ.ม./วินาที
                      </span>
                    </div>
                    <div className="data-row">
                      <span className="data-row__label">
                        จำนวนเขื่อนที่ตรวจวัด
                      </span>
                      <span className="data-row__value">
                        {data._reservoirBasin.damCount} แห่ง
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* ── Disclaimer ─────────────────────────────────────── */}
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
