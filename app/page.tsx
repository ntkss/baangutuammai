"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { BottomNav } from "@/components/common/BottomNav";
import { Footer } from "@/components/common/Footer";
import {
  RiskStatusCard,
  RiskCardSkeleton,
  DataCardSkeleton,
} from "@/components/risk/RiskCard";
import { WaterDataCard, RainDataCard } from "@/components/risk/DataCards";
import { NorthernRunoffCard } from "@/components/risk/NorthernRunoffCard";
import { WaterElevationCrossSection } from "@/components/infographic/WaterElevationCrossSection";
import { BentoVitals } from "@/components/infographic/BentoVitals";
import { RiverFlowStepper } from "@/components/infographic/RiverFlowStepper";
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
    totalDamsInBasin?: number;
    reportingDams?: Array<{
      id: string;
      name: string;
      volume: number;
      capacity: number;
      percent_storage: number | null;
      inflow: number | null;
      outflow: number | null;
    }>;
    missingDams?: Array<{
      id: string;
      name: string;
    }>;
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
                <Info size={16} color="var(--color-accent)" style={{ flexShrink: 0, marginTop: "2px" }} />
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
            <AlertTriangle size={16} color="var(--color-watch)" style={{ flexShrink: 0, marginTop: "2px" }} />
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
            bankLevelM={data._northernRunoff?.corridor.nearest?.bankLevelM}
            elevationMarginM={data.risk.estimatedElevationMarginM}
            diffBankM={data._northernRunoff?.corridor.nearest?.diffBankM}
            stationName={
              data._northernRunoff?.corridor.nearest?.stationName ??
              data.water?.station?.name
            }
          />
        ) : null}

        {/* ── 3. Bento Micro-Gauges (3 สัญญาณชี้ชะตา: เขื่อน C.13 / ฝน / อ่างเก็บน้ำ) ── */}
        {isLoading ? (
          <DataCardSkeleton />
        ) : data ? (
          <BentoVitals
            c13DischargeM3s={data._northernRunoff?.c13ChaoPhrayaDam?.dischargeM3s}
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
              <Zap size={22} color="var(--color-severe)" strokeWidth={2.2} />
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
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            ดูเงื่อนไข <ArrowRight size={14} />
          </span>
        </Link>

        {/* ── 5. Teaser Link to 2554 Comparison Page (ปี 2554) ── */}
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
            marginBottom: "16px",
            textDecoration: "none",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
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
              <BarChart3 size={22} color="var(--color-low)" strokeWidth={2.2} />
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
                <span>เทียบกับมหาอุทกภัยปี 2554</span>
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
                เทียบปริมาณน้ำ C.13, C.2 และ 4 เขื่อนใหญ่กับปี 54
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
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            เปรียบเทียบ <ArrowRight size={14} />
          </span>
        </Link>

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
                {data._northernRunoff && (
                  <NorthernRunoffCard data={data._northernRunoff} />
                )}
                <WaterDataCard water={data.water} />
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

                    {/* Reporting dams list */}
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
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              color: "var(--color-text-secondary)",
                              marginBottom: "4px",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            <Activity size={14} />
                            <span>ปริมาณน้ำเขื่อนที่ตรวจวัดจริงวันนี้:</span>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "3px",
                            }}
                          >
                            {data._reservoirBasin.reportingDams.map((d) => (
                              <div
                                key={d.id}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  fontSize: "0.72rem",
                                  color: "var(--color-text-primary)",
                                }}
                              >
                                <span>• {d.name}</span>
                                <span style={{ fontWeight: 600 }}>
                                  {d.percent_storage !== null
                                    ? `${d.percent_storage.toFixed(1)}%`
                                    : "-"}{" "}
                                  ({d.volume.toLocaleString()} /{" "}
                                  {d.capacity.toLocaleString()} ล้าน ลบ.ม.)
                                </span>
                              </div>
                            ))}
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
                            <AlertTriangle size={14} color="var(--color-watch)" />
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

        {/* ── Footer & Disclaimer ───────────────────────────── */}
        <Footer />
      </main>

      <BottomNav />
    </>
  );
}
