"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import { BottomNav } from "@/components/common/BottomNav";
import { Footer } from "@/components/common/Footer";
import { FloodTriggerFactorsCard } from "@/components/risk/FloodTriggerFactorsCard";
import { DataCardSkeleton } from "@/components/risk/RiskCard";
import { useUserPrefs } from "@/lib/store/userPrefs";
import type { DashboardResponse } from "@/lib/types/domain";
import type { NorthernRunoffSummary } from "@/lib/providers/thaiwater";
import type { EstuarineTideResult } from "@/lib/risk/tide";

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

export default function TriggersPage() {
  const { homeLocation } = useUserPrefs();
  const [data, setData] = useState<ExtendedDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
      lastFetchRef.current = Date.now();
    } catch {
      // preserve existing data
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  }, [activeLat, activeLng]);

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
          lastFetchRef.current = Date.now();
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeLat, activeLng]);

  useEffect(() => {
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        const elapsed = Date.now() - lastFetchRef.current;
        if (elapsed > 5 * 60 * 1000) {
          refreshDashboard();
        }
      }
    }

    window.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);
    return () => {
      window.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [refreshDashboard]);

  const isBkkUrban = data?.risk.zone === "bangkok_urban";

  return (
    <>
      <main
        className="page"
        id="main-content"
        style={{ paddingBottom: "110px" }}
      >
        {/* ── Top Bar ─────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "1.3rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(220, 38, 38, 0.1)",
                }}
              >
                ⚡
              </span>
              <div>
                <h1
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                    margin: 0,
                    letterSpacing: "-0.01em",
                  }}
                >
                  สัญญาณวิกฤต
                </h1>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    margin: 0,
                  }}
                >
                  เงื่อนไขชี้ชะตา: เมื่อไหร่น้ำจะท่วมถึงบ้านคุณ?
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => refreshDashboard()}
            disabled={isRefreshing || isLoading}
            aria-label="รีเฟรชข้อมูล"
            title="รีเฟรชข้อมูลล่าสุด"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              boxShadow: "var(--shadow-sm)",
              color: isRefreshing
                ? "var(--color-accent)"
                : "var(--color-text-muted)",
              cursor: isRefreshing || isLoading ? "default" : "pointer",
              transition: "all 0.2s ease",
            }}
          >
            <RotateCw
              size={14}
              className={isRefreshing || isLoading ? "spin" : ""}
            />
          </button>
        </div>

        {/* ── Active Location & Demographic Profile Banner ───── */}
        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: "14px",
            padding: "12px 14px",
            marginBottom: "16px",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "0.8rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span>📍</span>
              <span
                style={{ fontWeight: 700, color: "var(--color-text-primary)" }}
              >
                {homeLocation?.label || "พิกัดปัจจุบัน"}
              </span>
            </div>
            <Link
              href="/"
              style={{
                color: "var(--color-accent)",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "0.75rem",
                padding: "4px 8px",
                borderRadius: "6px",
                background: "rgba(2, 132, 199, 0.08)",
              }}
            >
              เปลี่ยน
            </Link>
          </div>

          {/* Demographic & Geographic Vitals Chips */}
          <div
            style={{
              display: "flex",
              gap: "6px",
              flexWrap: "wrap",
              marginTop: "8px",
              fontSize: "0.72rem",
            }}
          >
            {data?._terrainElevation?.elevationM !== null &&
              data?._terrainElevation?.elevationM !== undefined && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "3px 8px",
                    borderRadius: "6px",
                    background: "var(--color-surface-2)",
                    color: "var(--color-text-secondary)",
                    fontWeight: 600,
                  }}
                >
                  <span>📐 ระดับดิน:</span>
                  <strong style={{ color: "var(--color-text-primary)" }}>
                    +{data._terrainElevation.elevationM.toFixed(1)} ม.รทก.
                  </strong>
                </span>
              )}

            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                padding: "3px 8px",
                borderRadius: "6px",
                background: "var(--color-surface-2)",
                color: "var(--color-text-secondary)",
                fontWeight: 600,
              }}
            >
              <span>
                {isBkkUrban ? "🏙️ ในแนวคันกั้นน้ำ กทม." : "🏞️ ลุ่มน้ำเจ้าพระยา"}
              </span>
            </span>

            {(data?.water?.station?.river || data?.water?.station?.name) && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  background: "var(--color-surface-2)",
                  color: "var(--color-text-secondary)",
                  fontWeight: 600,
                }}
              >
                <span>🌊</span>
                <span>
                  {data.water.station.river
                    ? `${data.water.station.river.startsWith("คลอง") ? "" : "แม่น้ำ"}${data.water.station.river}`
                    : data.water.station.name}
                </span>
                {data._waterExtra?.distanceKm && (
                  <span style={{ color: "var(--color-text-muted)" }}>
                    ({data._waterExtra.distanceKm.toFixed(1)} กม.)
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* ── Main Trigger Card ───────────────────────────────── */}
        {isLoading ? (
          <DataCardSkeleton />
        ) : (
          <FloodTriggerFactorsCard
            zone={data?.risk.zone}
            zoneLabel={data?.risk.zoneLabel}
            riskLevel={data?.risk.level}
            localWaterStationName={
              data?._northernRunoff?.corridor.nearest?.stationName ??
              data?.water?.station?.name
            }
            localRiverName={data?.water?.station?.river}
            localWaterLevelM={
              data?._northernRunoff?.corridor.nearest?.waterLevelM ??
              data?.water?.current?.waterLevelM
            }
            bankLevelM={
              data?._northernRunoff?.corridor.nearest?.bankLevelM ??
              data?._waterExtra?.bankLevelM
            }
            diffBankM={
              data?._northernRunoff?.corridor.nearest?.diffBankM ??
              data?._waterExtra?.diffBankM
            }
            diffBankText={data?._waterExtra?.diffBankText}
            waterLevelRisk={data?.risk.waterLevelRisk}
            waterDistanceKm={data?._waterExtra?.distanceKm}
            c13Discharge={data?._northernRunoff?.c13ChaoPhrayaDam?.dischargeM3s}
            c2Discharge={data?._northernRunoff?.c2NakhonSawan?.dischargeM3s}
            rain24hMm={data?.rain.total24h}
            rainPeak1hMm={data?.rain.peakRate1h}
            reservoirPercent={data?._reservoirBasin?.avgStoragePercent}
            elevationMarginM={data?.risk.estimatedElevationMarginM}
            tide={data?._tide}
            blackspot={
              data?._blackspot
                ? {
                    name: data._blackspot.blackspot.name,
                    distanceKm: data._blackspot.distanceKm,
                    severity: data._blackspot.severity,
                  }
                : null
            }
          />
        )}

        {/* ── Action Matrix Infographic ───────────────────────── */}
        <div
          className="card"
          style={{
            marginTop: "16px",
            background: "var(--color-surface)",
            borderRadius: "16px",
            padding: "16px",
            border: "1px solid var(--color-border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "1.1rem" }}>🛡️</span>
              <h3
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                แผนเตรียมพร้อมรับมือฉุกเฉิน
              </h3>
            </div>
            <span
              style={{
                fontSize: "0.68rem",
                color: "var(--color-text-muted)",
              }}
            >
              Action Matrix
            </span>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {/* Tier 1: Normal */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "10px",
                background: "var(--color-surface-2)",
                border: "1px solid var(--color-border)",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "var(--color-low)",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  background: "var(--color-low-bg)",
                  whiteSpace: "nowrap",
                }}
              >
                🟢 สภาวะปกติ
              </span>
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  flexWrap: "wrap",
                  fontSize: "0.74rem",
                }}
              >
                <span
                  style={{
                    background: "var(--color-surface)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  📡 ติดตามสัญญาณเตือน
                </span>
                <span
                  style={{
                    background: "var(--color-surface)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  🧹 ตรวจทางระบายน้ำรอบบ้าน
                </span>
              </div>
            </div>

            {/* Tier 2: Watch (1 Factor) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "10px",
                background: "rgba(217, 119, 6, 0.04)",
                border: "1px solid rgba(217, 119, 6, 0.2)",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "var(--color-watch)",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  background: "var(--color-watch-bg)",
                  whiteSpace: "nowrap",
                }}
              >
                🟡 แตะ 1 ปัจจัย
              </span>
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  flexWrap: "wrap",
                  fontSize: "0.74rem",
                }}
              >
                <span
                  style={{
                    background: "var(--color-surface)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(217, 119, 6, 0.2)",
                  }}
                >
                  🚗 เตรียมย้ายรถขึ้นที่สูง
                </span>
                <span
                  style={{
                    background: "var(--color-surface)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(217, 119, 6, 0.2)",
                  }}
                >
                  🔌 ยกของมีค่าขึ้นชั้น 2
                </span>
                <span
                  style={{
                    background: "var(--color-surface)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(217, 119, 6, 0.2)",
                  }}
                >
                  🧱 สำรองกระสอบทราย
                </span>
              </div>
            </div>

            {/* Tier 3: Critical (2+ Factors) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "10px",
                background: "rgba(220, 38, 38, 0.04)",
                border: "1px solid rgba(220, 38, 38, 0.2)",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "var(--color-severe)",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  background: "var(--color-severe-bg)",
                  whiteSpace: "nowrap",
                }}
              >
                🔴 แตะ 2+ ปัจจัย
              </span>
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  flexWrap: "wrap",
                  fontSize: "0.74rem",
                }}
              >
                <span
                  style={{
                    background: "var(--color-surface)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(220, 38, 38, 0.2)",
                    color: "var(--color-severe)",
                    fontWeight: 600,
                  }}
                >
                  🧱 อุดท่อระบายน้ำป้องกันน้ำดันย้อน
                </span>
                <span
                  style={{
                    background: "var(--color-surface)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(220, 38, 38, 0.2)",
                    color: "var(--color-severe)",
                    fontWeight: 600,
                  }}
                >
                  ⚡ สับเบรกเกอร์ตัดไฟชั้นล่าง
                </span>
                <span
                  style={{
                    background: "var(--color-surface)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(220, 38, 38, 0.2)",
                  }}
                >
                  📦 สำรองน้ำดื่มและยา 3 วัน
                </span>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </main>

      <BottomNav />
    </>
  );
}
