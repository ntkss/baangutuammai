"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Waves,
  Info,
  AlertTriangle,
  Zap,
  BarChart3,
  ChevronUp,
  ChevronDown,
  MountainSnow,
  Activity,
  ArrowRight,
  RotateCw,
} from "lucide-react";
import { BottomNav } from "@/components/common/BottomNav";
import { Footer } from "@/components/common/Footer";
import {
  RiskStatusCard,
  RiskCardSkeleton,
  DataCardSkeleton,
} from "@/components/risk/RiskCard";
import { WaterDataCard, RainDataCard } from "@/components/risk/DataCards";
import { WaterElevationCrossSection } from "@/components/infographic/WaterElevationCrossSection";
import { BentoVitals } from "@/components/infographic/BentoVitals";
import { RiverFlowStepper } from "@/components/infographic/RiverFlowStepper";
import { LocationPicker } from "@/components/location/LocationPicker";
import { useUserPrefs } from "@/lib/store/userPrefs";
import { UI_TEXT } from "@/lib/i18n/th";
import type { DashboardResponse } from "@/lib/types/domain";
import type { NorthernRunoffSummary } from "@/lib/providers/thaiwater";
import type { EstuarineTideResult } from "@/lib/risk/tide";

// Default center: Nonthaburi
const DEFAULT_LAT = 13.862;
const DEFAULT_LNG = 100.514;

type ExtendedDashboardResponse = DashboardResponse & {
  _waterExtra?: {
    distanceKm: number;
    bankLevelM: number | null;
    diffBankM: number | null;
    diffBankText?: string;
  } | null;
  _blackspot?: {
    blackspot: {
      name: string;
      district: string;
      type: string;
      description: string;
    };
    distanceKm: number;
    severity: "critical" | "warning" | "advisory";
  } | null;
  _tide?: EstuarineTideResult | null;
  _northernRunoff?: NorthernRunoffSummary | null;
  _reservoirBasin?: {
    totalCapacityMcm: number;
    totalStorageMcm: number;
    totalInflowM3s: number;
    totalOutflowM3s: number;
    avgStoragePercent: number;
    damCount: number;
    totalDamsInBasin?: number;
    reportingDams?: Array<{
      id: string;
      name: string;
      volume: number;
      capacity: number;
      percent_storage: number | null;
      inflow: number | null;
      outflow: number | null;
      isMajor?: boolean;
      priority?: number;
    }>;
    missingDams?: Array<{
      id: string;
      name: string;
      isMajor?: boolean;
      priority?: number;
    }>;
    observedDate: string;
    isFallbackToPreviousDay?: boolean;
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDamNotice, setShowDamNotice] = useState(false);

  const activeLat = homeLocation?.latitude ?? DEFAULT_LAT;
  const activeLng = homeLocation?.longitude ?? DEFAULT_LNG;
  const lastFetchRef = useRef<number>(0);

  const refreshDashboard = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const r = await fetch(`/api/dashboard?lat=${activeLat}&lng=${activeLng}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = (await r.json()) as ExtendedDashboardResponse;
      setData(d);
      setLastUpdated(new Date());
      lastFetchRef.current = Date.now();
      setError(null);
    } catch {
      // Keep existing data on background refresh failure
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  }, [activeLat, activeLng]);

  // Initial fetch and on coordinates change
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
          setLastUpdated(new Date());
          lastFetchRef.current = Date.now();
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

  // Auto-refresh when app becomes visible or focused (PWA Home Screen return)
  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        const elapsed = Date.now() - lastFetchRef.current;
        // Auto-refresh if more than 5 minutes old
        if (elapsed > 5 * 60 * 1000) {
          refreshDashboard();
        }
      }
    }

    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);

    // Periodic check every 5 minutes while app is running
    const interval = setInterval(
      () => {
        if (document.visibilityState === "visible") {
          refreshDashboard();
        }
      },
      5 * 60 * 1000,
    );

    return () => {
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
      clearInterval(interval);
    };
  }, [refreshDashboard]);

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
        style={{ paddingBottom: "110px" }}
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
                  boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
                }}
              >
                <Waves size={18} color="#ffffff" strokeWidth={2.4} />
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

          {/* ── Quick Refresh Button ──────────────────────────── */}
          <button
            type="button"
            id="refresh-dashboard-btn"
            onClick={() => refreshDashboard()}
            disabled={isRefreshing || isLoading}
            aria-label="รีเฟรชข้อมูล"
            title="รีเฟรชข้อมูลล่าสุด"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "2px",
              background: "none",
              border: "none",
              cursor: isRefreshing || isLoading ? "default" : "pointer",
              padding: "4px 0 4px 8px",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "6px 12px",
                borderRadius: "20px",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                boxShadow: "var(--shadow-sm)",
                color: isRefreshing
                  ? "var(--color-accent)"
                  : "var(--color-text-secondary)",
                fontSize: "0.76rem",
                fontWeight: 600,
                transition: "all 0.2s ease",
              }}
            >
              <RotateCw
                size={13}
                className={isRefreshing || isLoading ? "spin" : ""}
                style={{
                  color: isRefreshing
                    ? "var(--color-accent)"
                    : "var(--color-text-muted)",
                  transition: "color 0.2s ease",
                }}
              />
              <span>{isRefreshing ? "กำลังอัปเดต" : "รีเฟรช"}</span>
            </div>
            {lastUpdated && (
              <span
                style={{
                  fontSize: "0.68rem",
                  color: "var(--color-text-muted)",
                  paddingRight: "4px",
                }}
              >
                {lastUpdated.toLocaleTimeString("th-TH", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                น.
              </span>
            )}
          </button>
        </header>

        {/* ── Location Selector (Home location picker) ───────── */}
        <LocationPicker
          currentLat={activeLat}
          currentLng={activeLng}
          onLocationSelect={handleLocationSelect}
        />

        {/* ── Contextual Local Area Tags (สภาพแวดล้อมเฉพาะพิกัด) ── */}
        {!isLoading && data && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              alignItems: "center",
              marginTop: "8px",
              marginBottom: "12px",
            }}
          >
            {/* Canal Station Tag */}
            {data.water?.station?.provider?.includes("กทม") && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 9px",
                  borderRadius: "20px",
                  background: "rgba(3, 105, 161, 0.08)",
                  border: "1px solid rgba(3, 105, 161, 0.2)",
                  fontSize: "0.72rem",
                  color: "#0369a1",
                  fontWeight: 600,
                }}
              >
                <span>🌊</span>
                <span>คลอง กทม.</span>
                {data._waterExtra?.distanceKm !== undefined && (
                  <span style={{ opacity: 0.85 }}>
                    ({data._waterExtra.distanceKm} กม.)
                  </span>
                )}
              </span>
            )}

            {/* BMA Blackspot Hotspot Tag */}
            {data._blackspot && data._blackspot.distanceKm <= 0.8 && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 9px",
                  borderRadius: "20px",
                  background:
                    data._blackspot.severity === "critical"
                      ? "rgba(185, 28, 28, 0.08)"
                      : "rgba(194, 65, 12, 0.08)",
                  border:
                    data._blackspot.severity === "critical"
                      ? "1px solid rgba(185, 28, 28, 0.25)"
                      : "1px solid rgba(194, 65, 12, 0.25)",
                  fontSize: "0.72rem",
                  color:
                    data._blackspot.severity === "critical"
                      ? "#b91c1c"
                      : "#c2410c",
                  fontWeight: 600,
                }}
              >
                <span>⚠️</span>
                <span>
                  จุดเสี่ยงน้ำท่วมขัง: {data._blackspot.blackspot.name}
                </span>
                <span style={{ opacity: 0.85 }}>
                  ({Math.round(data._blackspot.distanceKm * 1000)} ม.)
                </span>
              </span>
            )}

            {/* High Sea Tide Alert Tag (ONLY if elevated alert) */}
            {data._tide && data._tide.isHighTideAlert && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 9px",
                  borderRadius: "20px",
                  background: "rgba(14, 116, 144, 0.08)",
                  border: "1px solid rgba(14, 116, 144, 0.25)",
                  fontSize: "0.72rem",
                  color: "#0e7490",
                  fontWeight: 600,
                }}
              >
                <span>🌊</span>
                <span>น้ำทะเลหนุนสูง ({data._tide.phaseLabel})</span>
                <span style={{ opacity: 0.85 }}>
                  (~+{data._tide.astronomicalLevelM.toFixed(2)} ม.รทก.)
                </span>
              </span>
            )}
          </div>
        )}

        {/* ── Critical Data notices (system / connection errors only) ── */}
        {data?.dataNotices &&
          data.dataNotices.filter((n) => !n.includes("ข้อมูลเขื่อนประจำวัน"))
            .length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              {data.dataNotices
                .filter((n) => !n.includes("ข้อมูลเขื่อนประจำวัน"))
                .map((notice, i) => (
                  <div
                    key={i}
                    className="notice notice--info"
                    style={{ marginBottom: "6px" }}
                  >
                    <Info
                      size={16}
                      color="var(--color-accent)"
                      style={{ flexShrink: 0, marginTop: "2px" }}
                    />
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
            <AlertTriangle
              size={16}
              color="var(--color-watch)"
              style={{ flexShrink: 0, marginTop: "2px" }}
            />
            <span>{error}</span>
          </div>
        )}

        {/* ── 1. Primary Risk Card ───────────────────────────── */}
        <div style={{ marginBottom: "14px" }}>
          {isLoading ? (
            <RiskCardSkeleton />
          ) : data ? (
            <RiskStatusCard
              level={data.risk.level}
              reasons={data.risk.reasons}
              confidence={data.risk.confidence}
              updatedAt={data.updatedAt}
              recommendedAction={data.risk.recommendedAction}
              zoneLabel={data.risk.zoneLabel}
            />
          ) : null}
        </div>

        {/* ── 2. Infographic Cross-Section (ระดับน้ำ vs พื้นบ้าน vs ตลิ่ง) ── */}
        {isLoading ? (
          <DataCardSkeleton />
        ) : data ? (
          <WaterElevationCrossSection
            houseElevationM={data._terrainElevation?.elevationM}
            riverWaterLevelM={
              data._northernRunoff?.corridor.nearest?.waterLevelM ??
              data.water?.current?.waterLevelM
            }
            bankLevelM={
              data._northernRunoff?.corridor.nearest?.bankLevelM ??
              data._waterExtra?.bankLevelM
            }
            elevationMarginM={data.risk.estimatedElevationMarginM}
            diffBankM={
              data._northernRunoff?.corridor.nearest?.diffBankM ??
              data._waterExtra?.diffBankM
            }
            stationName={
              data._northernRunoff?.corridor.nearest?.stationName ??
              data.water?.station?.name
            }
            tideExtremes={data._tide?.dailyExtremes}
          />
        ) : null}

        {/* ── SECTION: สัญญาณมวลน้ำหลักและการระบาย ───────────── */}
        <div style={{ marginTop: "22px", marginBottom: "10px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "var(--color-text-secondary)",
              letterSpacing: "0.02em",
            }}
          >
            <span>🌊</span>
            <span>สัญญาณมวลน้ำหลักและการไหลผ่าน</span>
          </div>
        </div>

        {/* ── 3. Bento Micro-Gauges (3 สัญญาณชี้ชะตา: เขื่อน C.13 / ฝน / อ่างเก็บน้ำ) ── */}
        {isLoading ? (
          <DataCardSkeleton />
        ) : data ? (
          <BentoVitals
            c13DischargeM3s={
              data._northernRunoff?.c13ChaoPhrayaDam?.dischargeM3s
            }
            rain24hMm={data.rain?.total24h}
            reservoirBasin={data._reservoirBasin}
          />
        ) : null}

        {/* ── 4. River Flowline Stepper (เส้นทางมวลน้ำ 4 จุดสำคัญ) ── */}
        {isLoading ? (
          <DataCardSkeleton />
        ) : data?._northernRunoff ? (
          <RiverFlowStepper data={data._northernRunoff} />
        ) : null}

        {/* ── SECTION: เครื่องมือวิเคราะห์เชิงลึกและประวัติการณ์ ── */}
        <div style={{ marginTop: "22px", marginBottom: "10px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "var(--color-text-secondary)",
              letterSpacing: "0.02em",
            }}
          >
            <span>📊</span>
            <span>แบบจำลองและประวัติการณ์เปรียบเทียบ</span>
          </div>
        </div>

        {/* ── 5. Teaser Links Grid (5 สัญญาณวิกฤต + เทียบปี 2554) ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "10px",
            marginBottom: "18px",
          }}
        >
          {/* Teaser 1: Critical Triggers */}
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
              textDecoration: "none",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span
                style={{
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "12px",
                  background: "#ffffff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  flexShrink: 0,
                }}
              >
                <Zap size={20} color="var(--color-severe)" strokeWidth={2.2} />
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
                  <span>5 สัญญาณวิกฤต</span>
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
                  เช็กเขื่อน + ฝนซ้ำ + น้ำทะเลหนุน
                </div>
              </div>
            </div>

            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "var(--color-accent)",
                whiteSpace: "nowrap",
                paddingLeft: "6px",
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
              }}
            >
              ดู <ArrowRight size={14} />
            </span>
          </Link>

          {/* Teaser 2: 2554 Comparison */}
          <Link
            href="/2554"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background:
                "linear-gradient(135deg, rgba(240, 253, 250, 0.95), rgba(239, 246, 255, 0.8))",
              border: "1px solid rgba(153, 246, 228, 0.7)",
              borderRadius: "16px",
              padding: "14px 16px",
              textDecoration: "none",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span
                style={{
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "12px",
                  background: "#ffffff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  flexShrink: 0,
                }}
              >
                <BarChart3
                  size={20}
                  color="var(--color-low)"
                  strokeWidth={2.2}
                />
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
                  <span>เทียบน้ำท่วมปี 2554</span>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "rgba(13, 148, 136, 0.1)",
                      color: "var(--color-low)",
                      fontWeight: 700,
                    }}
                  >
                    เช็กลิสต์
                  </span>
                </div>
                <div
                  style={{
                    fontSize: "0.72rem",
                    color: "var(--color-text-secondary)",
                    marginTop: "2px",
                  }}
                >
                  เทียบ C.13, C.2 และ 4 เขื่อนใหญ่
                </div>
              </div>
            </div>

            <span
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "var(--color-accent)",
                whiteSpace: "nowrap",
                paddingLeft: "6px",
                display: "inline-flex",
                alignItems: "center",
                gap: "2px",
              }}
            >
              ดู <ArrowRight size={14} />
            </span>
          </Link>
        </div>

        {/* ── 5. Progressive Disclosure: Toggle Details ───────── */}
        <button
          id="toggle-details-btn"
          className="btn btn--outline"
          style={{
            width: "100%",
            marginBottom: "16px",
            padding: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            fontWeight: 600,
          }}
          onClick={() => setShowDetails((v) => !v)}
        >
          {showDetails ? (
            <>
              <ChevronUp size={16} /> ซ่อนรายละเอียดระดับน้ำและฝน
            </>
          ) : (
            <>
              <ChevronDown size={16} /> ดูรายละเอียดระดับน้ำ ฝน และอ่างเก็บน้ำ
            </>
          )}
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
                <WaterDataCard
                  water={data.water}
                  extra={data._waterExtra}
                  tide={data._tide}
                />
                <RainDataCard rain={data.rain} />

                {/* Reservoir overview card */}
                {data._reservoirBasin && (
                  <div className="card">
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: "10px",
                      }}
                    >
                      <h2
                        style={{
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          margin: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <MountainSnow size={18} color="var(--color-accent)" />
                        <span>เขื่อนหลักลุ่มน้ำเจ้าพระยา (ชป.)</span>
                      </h2>
                      {data._reservoirBasin.observedDate && (
                        <span
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          ข้อมูล ณ {data._reservoirBasin.observedDate}
                          {data._reservoirBasin.isFallbackToPreviousDay
                            ? " (รอบ 24 ชม. ล่าสุดที่ครบ)"
                            : ""}
                        </span>
                      )}
                    </div>
                    <div className="data-row">
                      <span className="data-row__label">
                        ความจุน้ำกักเก็บเฉลี่ย
                        {data._reservoirBasin.missingDams &&
                        data._reservoirBasin.missingDams.length > 0
                          ? " (เฉพาะเขื่อนที่รายงาน)"
                          : ""}
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
                        ล้าน ลบ.ม./วัน
                      </span>
                    </div>
                    <div className="data-row">
                      <span className="data-row__label">ปริมาณน้ำระบายออก</span>
                      <span className="data-row__value">
                        {data._reservoirBasin.totalOutflowM3s.toLocaleString()}{" "}
                        ล้าน ลบ.ม./วัน
                      </span>
                    </div>
                    <div className="data-row">
                      <span className="data-row__label">
                        จำนวนเขื่อนที่มีรายงาน
                      </span>
                      <span className="data-row__value">
                        {data._reservoirBasin.damCount} จาก{" "}
                        {data._reservoirBasin.totalDamsInBasin ?? 9} แห่ง
                      </span>
                    </div>

                    {/* Reporting dams list sorted by strategic importance */}
                    {data._reservoirBasin.reportingDams &&
                      data._reservoirBasin.reportingDams.length > 0 && (
                        <div
                          style={{
                            marginTop: "10px",
                            borderTop: "1px dashed var(--color-border)",
                            paddingTop: "8px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "6px",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                color: "var(--color-text-secondary)",
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <Activity size={14} color="var(--color-accent)" />
                              <span>
                                {data._reservoirBasin.isFallbackToPreviousDay
                                  ? "ปริมาณน้ำเขื่อนที่ตรวจวัดจริง (รอบสรุปล่าสุด):"
                                  : "ปริมาณน้ำเขื่อนที่ตรวจวัดจริงวันนี้:"}
                              </span>
                            </div>
                            <span
                              style={{
                                fontSize: "0.64rem",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              เรียงตามลำดับความสำคัญยุทธศาสตร์
                            </span>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "2px",
                            }}
                          >
                            {data._reservoirBasin.reportingDams.map(
                              (d, idx) => {
                                const pct = d.percent_storage;
                                let statusColor = "var(--color-text-primary)";
                                let badgeText: string | null = null;
                                let badgeBg = "transparent";
                                let badgeColor = "transparent";

                                if (pct !== null) {
                                  if (pct >= 100) {
                                    statusColor = "var(--color-severe)"; // Red
                                    badgeText = "วิกฤต";
                                    badgeBg = "rgba(239, 68, 68, 0.12)";
                                    badgeColor = "var(--color-severe)";
                                  } else if (pct >= 80) {
                                    statusColor = "var(--color-watch)"; // Orange
                                    badgeText = "เฝ้าระวัง";
                                    badgeBg = "rgba(245, 158, 11, 0.12)";
                                    badgeColor = "var(--color-watch)";
                                  }
                                }

                                return (
                                  <div
                                    key={d.id}
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center",
                                      fontSize: "0.72rem",
                                      padding: "5px 0",
                                      borderBottom:
                                        "1px solid rgba(0,0,0,0.04)",
                                    }}
                                  >
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "5px",
                                      }}
                                    >
                                      <span
                                        style={{
                                          color: "var(--color-text-muted)",
                                          fontSize: "0.66rem",
                                          width: "16px",
                                          fontVariantNumeric: "tabular-nums",
                                        }}
                                      >
                                        {idx + 1}.
                                      </span>
                                      <span
                                        style={{
                                          fontWeight: d.isMajor ? 700 : 500,
                                          color: "var(--color-text-primary)",
                                        }}
                                      >
                                        {d.name}
                                      </span>
                                      {d.isMajor && (
                                        <span
                                          style={{
                                            fontSize: "0.6rem",
                                            padding: "1px 5px",
                                            borderRadius: "4px",
                                            background:
                                              "rgba(37, 99, 235, 0.08)",
                                            color: "var(--color-accent)",
                                            fontWeight: 700,
                                          }}
                                        >
                                          เขื่อนหลัก
                                        </span>
                                      )}
                                    </div>

                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                      }}
                                    >
                                      <span
                                        style={{
                                          fontWeight: 700,
                                          fontFamily: "var(--font-inter)",
                                          color: statusColor,
                                          fontVariantNumeric: "tabular-nums",
                                          fontSize: "0.75rem",
                                        }}
                                      >
                                        {pct !== null
                                          ? `${pct.toFixed(1)}%`
                                          : "-"}
                                      </span>
                                      {badgeText && (
                                        <span
                                          style={{
                                            fontSize: "0.6rem",
                                            padding: "1px 5px",
                                            borderRadius: "4px",
                                            background: badgeBg,
                                            color: badgeColor,
                                            fontWeight: 700,
                                          }}
                                        >
                                          {badgeText}
                                        </span>
                                      )}
                                      <span
                                        style={{
                                          fontSize: "0.66rem",
                                          color: "var(--color-text-muted)",
                                          fontVariantNumeric: "tabular-nums",
                                        }}
                                      >
                                        ({d.volume.toLocaleString()} /{" "}
                                        {d.capacity.toLocaleString()} ล้าน
                                        ลบ.ม.)
                                      </span>
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      )}

                    {/* Missing dams alert box */}
                    {data._reservoirBasin.missingDams &&
                      data._reservoirBasin.missingDams.length > 0 && (
                        <div
                          style={{
                            marginTop: "12px",
                            padding: "10px 12px",
                            background: "var(--color-surface-2)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "8px",
                            fontSize: "0.72rem",
                            lineHeight: 1.5,
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              color: "var(--color-watch)",
                              marginBottom: "3px",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            <AlertTriangle
                              size={14}
                              color="var(--color-watch)"
                            />
                            <span>
                              รอรายงานตรวจวัดประจำวันจาก{" "}
                              {data._reservoirBasin.missingDams.length} เขื่อน:
                            </span>
                          </div>
                          <div style={{ color: "var(--color-text-secondary)" }}>
                            {data._reservoirBasin.missingDams
                              .map((d) => d.name)
                              .join(", ")}
                          </div>
                          <div
                            style={{
                              fontSize: "0.66rem",
                              color: "var(--color-text-muted)",
                              marginTop: "4px",
                            }}
                          >
                            * ระบบคำนวณสถิติจากเขื่อนที่มีการตรวจวัดจริงเท่านั้น
                            จะไม่นำค่าประมาณการหรือค่าสมมุติมาคิด
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* ── Daily Dam Status Notice (Placed at the very bottom) ─────── */}
        {data?.dataNotices &&
          data.dataNotices
            .filter((n) => n.includes("ข้อมูลเขื่อนประจำวัน"))
            .map((notice, i) => (
              <div
                key={i}
                style={{
                  marginBottom: "20px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowDamNotice((v) => !v)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "rgba(37, 99, 235, 0.05)",
                    border: "1px solid rgba(37, 99, 235, 0.15)",
                    borderRadius: "20px",
                    padding: "6px 14px",
                    fontSize: "0.72rem",
                    color: "var(--color-accent)",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  <Info size={13} />
                  <span>
                    ข้อมูลเขื่อนประจำวัน (
                    {data._reservoirBasin?.damCount ?? "?"}/
                    {data._reservoirBasin?.totalDamsInBasin ?? 9} แห่ง)
                    {data._reservoirBasin?.isFallbackToPreviousDay
                      ? " • รอบล่าสุดที่ครบ"
                      : ""}
                  </span>
                  {showDamNotice ? (
                    <ChevronUp size={13} />
                  ) : (
                    <ChevronDown size={13} />
                  )}
                </button>

                {showDamNotice && (
                  <div
                    className="notice notice--info"
                    style={{
                      marginTop: "10px",
                      width: "100%",
                      fontSize: "0.74rem",
                      lineHeight: 1.5,
                      textAlign: "left",
                    }}
                  >
                    <Info
                      size={15}
                      color="var(--color-accent)"
                      style={{ flexShrink: 0, marginTop: "2px" }}
                    />
                    <div>
                      <div>{notice}</div>
                      {data._reservoirBasin?.reportingDams &&
                        data._reservoirBasin.reportingDams.some(
                          (d) => (d.percent_storage ?? 0) >= 80,
                        ) && (
                          <div
                            style={{
                              marginTop: "8px",
                              display: "flex",
                              flexWrap: "wrap",
                              gap: "6px",
                            }}
                          >
                            {data._reservoirBasin.reportingDams
                              .filter((d) => (d.percent_storage ?? 0) >= 80)
                              .map((d) => {
                                const isSevere =
                                  (d.percent_storage ?? 0) >= 100;
                                return (
                                  <span
                                    key={d.id}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                      fontSize: "0.68rem",
                                      padding: "3px 8px",
                                      borderRadius: "6px",
                                      background: isSevere
                                        ? "rgba(239, 68, 68, 0.12)"
                                        : "rgba(245, 158, 11, 0.12)",
                                      color: isSevere
                                        ? "var(--color-severe)"
                                        : "var(--color-watch)",
                                      fontWeight: 600,
                                    }}
                                  >
                                    <span>{d.name}</span>
                                    <strong
                                      style={{
                                        fontFamily: "var(--font-inter)",
                                        fontVariantNumeric: "tabular-nums",
                                      }}
                                    >
                                      {d.percent_storage?.toFixed(1)}%
                                    </strong>
                                    <span>
                                      ({isSevere ? "วิกฤต" : "เฝ้าระวัง"})
                                    </span>
                                  </span>
                                );
                              })}
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </div>
            ))}

        {/* ── Footer & Disclaimer ───────────────────────────── */}
        <Footer />
      </main>

      <BottomNav />
    </>
  );
}
