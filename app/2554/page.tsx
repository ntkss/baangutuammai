"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeLat, activeLng]);

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
        </div>

        {/* ── Active Location Banner ──────────────────────────── */}
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            padding: "10px 14px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.8rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📍</span>
            <span
              style={{ fontWeight: 600, color: "var(--color-text-primary)" }}
            >
              {homeLocation?.label || "พิกัดปัจจุบัน (นนทบุรี)"}
            </span>
          </div>
          <Link
            href="/"
            style={{
              color: "var(--color-accent)",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "0.75rem",
            }}
          >
            เปลี่ยนที่หน้าหลัก
          </Link>
        </div>

        {/* ── Main Historical 2011 Comparison Card ────────────── */}
        {isLoading ? (
          <DataCardSkeleton />
        ) : (
          <Historical2011Card
            comparison={data?.historicalComparison ?? null}
            currentLevelM={data?.water.current?.waterLevelM}
            c2Discharge={data?._northernRunoff?.c2NakhonSawan?.dischargeM3s}
            c13Discharge={data?._northernRunoff?.c13ChaoPhrayaDam?.dischargeM3s}
            reservoirStoragePercent={data?._reservoirBasin?.avgStoragePercent}
          />
        )}

        {/* ── Historical Context Education Card ────────────────── */}
        <div
          className="card"
          style={{
            marginTop: "16px",
            background: "var(--color-surface)",
            borderRadius: "16px",
            padding: "16px",
            border: "1px solid var(--color-border)",
          }}
        >
          <h3
            style={{
              fontSize: "0.9rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: "0 0 10px 0",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>💡</span> ทำไมปี 2554 ถึงเกิดมหาอุทกภัย?
          </h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              fontSize: "0.78rem",
              color: "var(--color-text-secondary)",
              lineHeight: 1.6,
            }}
          >
            <div>
              <strong style={{ color: "var(--color-text-primary)" }}>
                1. พายุเข้าติดต่อกันถึง 5 ลูก:
              </strong>{" "}
              (ไหหม่า, นกเตน, ไห่ถาง, เนสาด, นัลแก)
              ทำให้ฝนตกสะสมทั้งประเทศสูงกว่าค่าเฉลี่ยถึง 35%
            </div>
            <div>
              <strong style={{ color: "var(--color-text-primary)" }}>
                2. เขื่อนใหญ่เต็มความจุตั้งแต่ต้นฤดู:
              </strong>{" "}
              เขื่อนภูมิพลและเขื่อนสิริกิติ์กักเก็บน้ำเกิน 100%
              จนไม่สามารถหน่วงน้ำได้อีก จำเป็นต้องระบายน้ำออกเต็มกำลัง
            </div>
            <div>
              <strong style={{ color: "var(--color-text-primary)" }}>
                3. คันกั้นน้ำพังทลายหลายจุด:
              </strong>{" "}
              มวลน้ำมหาศาลไหลหลากทะลวงนิคมอุตสาหกรรมในอยุธยา ปทุมธานี
              และไหลเข้าสู่พื้นที่ฝั่งตะวันออกและตะวันตกของ กทม.
            </div>
          </div>
        </div>

        <Footer />
      </main>

      <BottomNav />
    </>
  );
}
