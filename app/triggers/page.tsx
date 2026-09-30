"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/common/BottomNav";
import { FloodTriggerFactorsCard } from "@/components/risk/FloodTriggerFactorsCard";
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

export default function TriggersPage() {
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
        className="container"
        style={{
          paddingTop: "24px",
          paddingBottom: "88px",
          maxWidth: "600px",
          margin: "0 auto",
        }}
      >
        {/* ── Top Bar ─────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
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

          <Link
            href="/"
            style={{
              fontSize: "0.8rem",
              fontWeight: 600,
              color: "var(--color-accent)",
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: "20px",
              background: "var(--color-accent-light)",
            }}
          >
            ← กลับหน้าหลัก
          </Link>
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

        {/* ── Main Trigger Card ───────────────────────────────── */}
        {isLoading ? (
          <DataCardSkeleton />
        ) : (
          <FloodTriggerFactorsCard
            c13Discharge={data?._northernRunoff?.c13ChaoPhrayaDam?.dischargeM3s}
            c2Discharge={data?._northernRunoff?.c2NakhonSawan?.dischargeM3s}
            rain24hMm={data?.rain.total24h}
            reservoirPercent={data?._reservoirBasin?.avgStoragePercent}
            elevationMarginM={data?.risk.estimatedElevationMarginM}
          />
        )}

        {/* ── Practical Checklist ─────────────────────────────── */}
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
            <span>🛡️</span> ข้อแนะนำการเตรียมตัวเมื่อสัญญาณเริ่มเตือน
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                fontSize: "0.8rem",
                color: "var(--color-text-secondary)",
              }}
            >
              <span>1️⃣</span>
              <div>
                <strong>เมื่อเขื่อนเจ้าพระยาแตะ 2,200 – 2,500 ลบ.ม./วิ:</strong>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  เก็บสิ่งของมีค่าและเครื่องใช้ไฟฟ้าขึ้นชั้น 2
                  ยกรถไปจอดที่สูงสำหรับบ้านนอกคันกั้นน้ำ
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                fontSize: "0.8rem",
                color: "var(--color-text-secondary)",
              }}
            >
              <span>2️⃣</span>
              <div>
                <strong>
                  เมื่อมีฝนตกหนักแช่ขังเกิน 50 มม. ร่วมกับน้ำหนุน:
                </strong>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  อุดฝาท่อระบายน้ำด้วยกระสอบทราย
                  ป้องกันน้ำดันย้อนเข้าห้องน้ำชั้นล่าง
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                fontSize: "0.8rem",
                color: "var(--color-text-secondary)",
              }}
            >
              <span>3️⃣</span>
              <div>
                <strong>หากเข้าเกณฑ์อันตราย 2 ปัจจัยขึ้นไป:</strong>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  ตัดเบรกเกอร์ไฟฟ้าชั้นล่าง
                  กักตุนน้ำดื่มและยารักษาโรคประจำตัวอย่างน้อย 3 วัน
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </>
  );
}
