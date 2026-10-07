"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { RotateCw } from "lucide-react";
import { BottomNav } from "@/components/common/BottomNav";
import { Footer } from "@/components/common/Footer";
import { Historical2011Card } from "@/components/history/Historical2011Card";
import { DataCardSkeleton } from "@/components/risk/RiskCard";
import { useUserPrefs } from "@/lib/store/userPrefs";
import type { DashboardResponse } from "@/lib/types/domain";
import type { NorthernRunoffSummary } from "@/lib/providers/thaiwater";

const DEFAULT_LAT = 13.862;
const DEFAULT_LNG = 100.514;

type ExtendedDashboardResponse = DashboardResponse & {
  _waterExtra?: {
    distanceKm: number;
    bankLevelM: number | null;
    diffBankM: number | null;
    diffBankText?: string;
  } | null;
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

export default function History2554Page() {
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
                  background: "rgba(37, 99, 235, 0.1)",
                }}
              >
                📊
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
                  เทียบกับน้ำท่วมปี 2554
                </h1>
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                    margin: 0,
                  }}
                >
                  เช็กลิสต์เปรียบเทียบมวลน้ำปีนี้กับมหาอุทกภัยปี 2554
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

        {/* ── Main Historical 2011 Comparison Card ────────────── */}
        {isLoading ? (
          <DataCardSkeleton />
        ) : (
          <Historical2011Card
            comparison={data?.historicalComparison ?? null}
            currentLevelM={data?.water.current?.waterLevelM}
            bankLevelM={data?._waterExtra?.bankLevelM}
            diffBankM={data?._waterExtra?.diffBankM}
            stationName={data?.water.station.name}
            riverName={data?.water.station.river}
            c2Discharge={data?._northernRunoff?.c2NakhonSawan?.dischargeM3s}
            c13Discharge={data?._northernRunoff?.c13ChaoPhrayaDam?.dischargeM3s}
            reservoirStoragePercent={data?._reservoirBasin?.avgStoragePercent}
          />
        )}

        {/* ── Visual 2554 Anatomy vs Today Matrix ─────────────── */}
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
              <span style={{ fontSize: "1.1rem" }}>💡</span>
              <h3
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  margin: 0,
                }}
              >
                ผ่า 3 ชนวนมหาอุทกภัยปี 54 เทียบปัจจุบัน
              </h3>
            </div>
            <span
              style={{
                fontSize: "0.68rem",
                color: "var(--color-text-muted)",
              }}
            >
              Anatomy Matrix
            </span>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            {/* 1. Storms */}
            <div
              style={{
                background: "var(--color-surface-2)",
                borderRadius: "10px",
                padding: "10px 12px",
                border: "1px solid var(--color-border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                  }}
                >
                  🌀 1. พายุจรเข้าไทย
                </span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--color-low)",
                    fontWeight: 700,
                    background: "var(--color-low-bg)",
                    padding: "1px 6px",
                    borderRadius: "4px",
                  }}
                >
                  🟢 ต่างกันชัดเจน
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  fontSize: "0.73rem",
                  marginTop: "4px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    color: "var(--color-severe)",
                    background: "var(--color-severe-bg)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  ปี 54: พายุ 5 ลูกซ้อน (ฝนสะสม +35%)
                </span>
                <span
                  style={{
                    color: "var(--color-low)",
                    background: "var(--color-low-bg)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  ปัจจุบัน: ฝนตามฤดูกาล ไม่มีพายุจร
                </span>
              </div>
            </div>

            {/* 2. Dams */}
            <div
              style={{
                background: "var(--color-surface-2)",
                borderRadius: "10px",
                padding: "10px 12px",
                border: "1px solid var(--color-border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                  }}
                >
                  🏞️ 2. ปริมาณน้ำในเขื่อนหลัก
                </span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--color-low)",
                    fontWeight: 700,
                    background: "var(--color-low-bg)",
                    padding: "1px 6px",
                    borderRadius: "4px",
                  }}
                >
                  🟢 ยังหน่วงน้ำได้
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  fontSize: "0.73rem",
                  marginTop: "4px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    color: "var(--color-severe)",
                    background: "var(--color-severe-bg)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  ปี 54: เขื่อนเต็ม &gt;100% ตั้งแต่ต้นฤดู
                </span>
                <span
                  style={{
                    color: "var(--color-low)",
                    background: "var(--color-low-bg)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  ปัจจุบัน: กักเก็บปกติ มีช่องว่างรับน้ำ
                </span>
              </div>
            </div>

            {/* 3. Polders & Dikes */}
            <div
              style={{
                background: "var(--color-surface-2)",
                borderRadius: "10px",
                padding: "10px 12px",
                border: "1px solid var(--color-border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: "var(--color-text-primary)",
                  }}
                >
                  🧱 3. คันกั้นน้ำ & การระบาย
                </span>
                <span
                  style={{
                    fontSize: "0.68rem",
                    color: "var(--color-low)",
                    fontWeight: 700,
                    background: "var(--color-low-bg)",
                    padding: "1px 6px",
                    borderRadius: "4px",
                  }}
                >
                  🟢 เสริมแนวป้องกันแล้ว
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  fontSize: "0.73rem",
                  marginTop: "4px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    color: "var(--color-severe)",
                    background: "var(--color-severe-bg)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  ปี 54: คันกั้นน้ำพัง มวลน้ำหลากทุ่ง
                </span>
                <span
                  style={{
                    color: "var(--color-low)",
                    background: "var(--color-low-bg)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  ปัจจุบัน: เสริมคันเจ้าพระยา & อุโมงค์ระบาย
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
