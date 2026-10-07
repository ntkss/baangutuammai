"use client";

import { useState } from "react";
import type { HistoricalComparison } from "@/lib/types/domain";

interface Historical2011CardProps {
  comparison: HistoricalComparison | null;
  currentLevelM?: number;
  bankLevelM?: number | null;
  diffBankM?: number | null;
  stationName?: string;
  riverName?: string;
  c2Discharge?: number | null;
  c13Discharge?: number | null;
  reservoirStoragePercent?: number | null;
}

type IndicatorItem = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  year2554Display: string;
  currentDisplay: string;
  percentOf2554: number | null;
  status: "safe" | "watch" | "critical" | "unknown";
  statusText: string;
  statusColor: string;
  diffNote: string;
  headroomNote: string;
};

export function Historical2011Card({
  comparison,
  currentLevelM,
  stationName,
  riverName,
  c2Discharge,
  c13Discharge,
  reservoirStoragePercent,
}: Historical2011CardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const currentLevel = currentLevelM ?? comparison?.currentLevelM ?? null;
  const peak2554 = comparison?.referencePeakLevelM ?? 2.72;
  const diffLevel =
    currentLevel !== null
      ? Math.round((peak2554 - currentLevel) * 100) / 100
      : null;

  // Active metrics with real-time values strictly
  const activeC13 = c13Discharge ?? null;
  const activeC2 = c2Discharge ?? null;
  const activeDamStorage = reservoirStoragePercent ?? null;

  // 1. C.13 Discharge (Dam Release)
  const c13Peak2554 = 3650;
  let c13Percent: number | null = null;
  let c13Status: "safe" | "watch" | "critical" | "unknown" = "unknown";
  let c13Color = "var(--color-text-muted)";
  let c13Text = "ไม่มีข้อมูล";

  if (activeC13 !== null) {
    c13Percent = Math.min(100, Math.round((activeC13 / c13Peak2554) * 100));
    if (activeC13 >= 3000) {
      c13Status = "critical";
      c13Color = "var(--color-severe)";
      c13Text = "ใกล้เคียงปี 54";
    } else if (activeC13 >= 2000) {
      c13Status = "watch";
      c13Color = "var(--color-watch)";
      c13Text = "เฝ้าระวังน้ำหลาก";
    } else {
      c13Status = "safe";
      c13Color = "var(--color-low)";
      c13Text = "ต่ำกว่าปี 54 มาก";
    }
  }

  // 2. C.2 Runoff (Nakhon Sawan)
  const c2Peak2554 = 4686;
  let c2Percent: number | null = null;
  let c2Status: "safe" | "watch" | "critical" | "unknown" = "unknown";
  let c2Color = "var(--color-text-muted)";
  let c2Text = "ไม่มีข้อมูล";

  if (activeC2 !== null) {
    c2Percent = Math.min(100, Math.round((activeC2 / c2Peak2554) * 100));
    if (activeC2 >= 4000) {
      c2Status = "critical";
      c2Color = "var(--color-severe)";
      c2Text = "ใกล้เคียงปี 54";
    } else if (activeC2 >= 2500) {
      c2Status = "watch";
      c2Color = "var(--color-watch)";
      c2Text = "มวลน้ำปานกลาง";
    } else {
      c2Status = "safe";
      c2Color = "var(--color-low)";
      c2Text = "ต่ำกว่าปี 54 มาก";
    }
  }

  // 3. Dam Storage
  let damPercent: number | null = null;
  let damStatus: "safe" | "watch" | "critical" | "unknown" = "unknown";
  let damColor = "var(--color-text-muted)";
  let damText = "ไม่มีข้อมูล";

  if (activeDamStorage !== null) {
    damPercent = Math.min(100, Math.round(activeDamStorage));
    if (activeDamStorage >= 95) {
      damStatus = "critical";
      damColor = "var(--color-severe)";
      damText = "เขื่อนใกล้ล้น";
    } else if (activeDamStorage >= 80) {
      damStatus = "watch";
      damColor = "var(--color-watch)";
      damText = "กักเก็บสูง";
    } else {
      damStatus = "safe";
      damColor = "var(--color-low)";
      damText = "ยังมีพื้นที่รับน้ำ";
    }
  }

  // 4. Water Level vs 2554 Peak
  let levelPercent: number | null = null;
  let levelStatus: "safe" | "watch" | "critical" | "unknown" = "unknown";
  let levelColor = "var(--color-text-muted)";
  let levelText = "ไม่มีข้อมูล";

  if (currentLevel !== null && diffLevel !== null) {
    levelPercent = Math.min(
      100,
      Math.max(10, Math.round((currentLevel / peak2554) * 100)),
    );
    if (diffLevel <= 0) {
      levelStatus = "critical";
      levelColor = "var(--color-severe)";
      levelText = "แตะสถิติปี 54";
    } else if (diffLevel < 0.3) {
      levelStatus = "watch";
      levelColor = "var(--color-watch)";
      levelText = "ใกล้สถิติปี 54";
    } else {
      levelStatus = "safe";
      levelColor = "var(--color-low)";
      levelText = "ต่ำกว่าปี 54 ปลอดภัย";
    }
  }

  const indicators: IndicatorItem[] = [
    {
      id: "c13",
      icon: "⚡",
      title: "การระบายน้ำเขื่อนเจ้าพระยา (C.13)",
      subtitle: "จุดชี้ชะตาน้ำหลากภาคกลาง",
      year2554Display: "3,650 ลบ.ม./วินาที",
      currentDisplay:
        activeC13 !== null
          ? `${activeC13.toLocaleString()} ลบ.ม./วินาที`
          : "ไม่มีข้อมูลตรวจวัด",
      percentOf2554: c13Percent,
      status: c13Status,
      statusText: c13Text,
      statusColor: c13Color,
      diffNote:
        activeC13 !== null
          ? `ปัจจุบันปล่อยน้ำคิดเป็น ~${c13Percent}% ของปี 54 (ต่ำกว่าอยู่ ${(c13Peak2554 - activeC13).toLocaleString()} ลบ.ม./วิ)`
          : "ยังไม่มีรายงานข้อมูลล่าสุดจากสถานี C.13",
      headroomNote:
        activeC13 !== null
          ? `ปลอดภัย: รับน้ำเพิ่มได้อีก ${(c13Peak2554 - activeC13).toLocaleString()} ลบ.ม./วิ ก่อนแตะยอดปี 54`
          : "รอข้อมูลตรวจวัด",
    },
    {
      id: "c2",
      icon: "🏔️",
      title: "น้ำหลากผ่านนครสวรรค์ (C.2)",
      subtitle: "มวลน้ำเหนือก่อนไหลเข้าสู่เขื่อน",
      year2554Display: "4,686 ลบ.ม./วินาที",
      currentDisplay:
        activeC2 !== null
          ? `${activeC2.toLocaleString()} ลบ.ม./วินาที`
          : "ไม่มีข้อมูลตรวจวัด",
      percentOf2554: c2Percent,
      status: c2Status,
      statusText: c2Text,
      statusColor: c2Color,
      diffNote:
        activeC2 !== null
          ? `คิดเป็น ~${c2Percent}% ของมวลน้ำหลากปี 54 (ต่ำกว่าอยู่ ${(c2Peak2554 - activeC2).toLocaleString()} ลบ.ม./วิ)`
          : "ยังไม่มีรายงานข้อมูลล่าสุดจากสถานี C.2",
      headroomNote:
        activeC2 !== null
          ? `ปลอดภัย: ยังต่ำกว่ายอดมวลน้ำมหาอุทกภัย ${(c2Peak2554 - activeC2).toLocaleString()} ลบ.ม./วิ`
          : "รอข้อมูลตรวจวัด",
    },
    {
      id: "dam",
      icon: "🏞️",
      title: "น้ำกักเก็บในเขื่อนหลักลุ่มเจ้าพระยา",
      subtitle: "ความจุกักเก็บเฉลี่ยเขื่อนหลัก",
      year2554Display: "> 100% (เขื่อนล้นความจุ)",
      currentDisplay:
        activeDamStorage !== null
          ? `${activeDamStorage.toFixed(1)}% ของความจุ`
          : "ไม่มีข้อมูลตรวจวัด",
      percentOf2554: damPercent,
      status: damStatus,
      statusText: damText,
      statusColor: damColor,
      diffNote:
        activeDamStorage !== null
          ? `ปี 54 เขื่อนเต็ม 100% ตั้งแต่ต้นฤดู ปัจจุบันยังเหลือพื้นที่รับน้ำได้อีก ${(100 - activeDamStorage).toFixed(1)}%`
          : "ยังไม่มีรายงานข้อมูลปริมาตรน้ำกักเก็บบริหารจัดการ",
      headroomNote:
        activeDamStorage !== null
          ? `เหลือพื้นที่หน่วงน้ำ ${(100 - activeDamStorage).toFixed(1)}% ของความจุ`
          : "รอข้อมูลตรวจวัด",
    },
    {
      id: "water_level",
      icon: "🌊",
      title: `ระดับน้ำ${riverName ? `แม่น้ำ${riverName}` : "เจ้าพระยา"}เทียบยอดปี 54`,
      subtitle: stationName
        ? `สถานีตรวจวัด: ${stationName}`
        : "เทียบจุดสูงสุดปี 2554",
      year2554Display: `+${peak2554.toFixed(2)} ม.รทก. (ยอดสูงสุด)`,
      currentDisplay:
        currentLevel !== null
          ? `+${currentLevel.toFixed(2)} ม.รทก.`
          : "ไม่มีข้อมูลตรวจวัด",
      percentOf2554: levelPercent,
      status: levelStatus,
      statusText: levelText,
      statusColor: levelColor,
      diffNote:
        diffLevel !== null
          ? diffLevel > 0
            ? `ระดับน้ำยังต่ำกว่ายอดมหาอุทกภัยปี 54 อยู่ ${diffLevel.toFixed(2)} เมตร`
            : `ระดับน้ำสูงกว่ายอดสูงสุดปี 54 อยู่ ${Math.abs(diffLevel).toFixed(2)} เมตร`
          : "ยังไม่มีข้อมูลระดับน้ำสถานีใกล้เคียงในขณะนี้",
      headroomNote:
        diffLevel !== null && diffLevel > 0
          ? `ระยะปลอดภัยเหลืออีก ${diffLevel.toFixed(2)} ม. ก่อนแตะระดับท่วมปี 54`
          : "รอข้อมูลตรวจวัด",
    },
  ];

  const safeCount = indicators.filter((i) => i.status === "safe").length;
  const watchCount = indicators.filter((i) => i.status === "watch").length;
  const criticalCount = indicators.filter(
    (i) => i.status === "critical",
  ).length;
  const unknownCount = indicators.filter((i) => i.status === "unknown").length;

  // Calculate average pressure percent from known indicators
  const knownPercents = indicators
    .map((i) => i.percentOf2554)
    .filter((p): p is number => p !== null);
  const avgPressure =
    knownPercents.length > 0
      ? Math.round(
          knownPercents.reduce((a, b) => a + b, 0) / knownPercents.length,
        )
      : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        marginBottom: "16px",
      }}
    >
      {/* ── 1. Benchmark Pressure Headline Infographic ────────────── */}
      <div
        className="card"
        style={{
          background: "var(--color-surface)",
          border:
            criticalCount > 0
              ? "2px solid var(--color-severe)"
              : watchCount > 0
                ? "1.5px solid var(--color-watch)"
                : "1px solid var(--color-border)",
          borderRadius: "16px",
          padding: "16px",
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
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.2rem" }}>📊</span>
            <div>
              <div
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                }}
              >
                ดัชนีมวลน้ำเทียบสถิติปี 2554
              </div>
              <div
                style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}
              >
                เทียบ 4 ตัวชี้วัดวิกฤต: สภาพจริงปี 2569 vs มหาอุทกภัยปี 2554
              </div>
            </div>
          </div>

          <span
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: "999px",
              background:
                criticalCount > 0
                  ? "var(--color-severe-bg)"
                  : watchCount > 0
                    ? "var(--color-watch-bg)"
                    : "var(--color-low-bg)",
              color:
                criticalCount > 0
                  ? "var(--color-severe)"
                  : watchCount > 0
                    ? "var(--color-watch)"
                    : "var(--color-low)",
              border: `1px solid ${
                criticalCount > 0
                  ? "var(--color-severe-border)"
                  : watchCount > 0
                    ? "var(--color-watch-border)"
                    : "var(--color-low-border)"
              }`,
            }}
          >
            {criticalCount > 0
              ? "🚨 ใกล้เคียงปี 54"
              : watchCount > 0
                ? "⚠️ เฝ้าระวังบางจุด"
                : "🟢 ห่างจากปี 54 มาก"}
          </span>
        </div>

        {/* Overall Benchmark Pressure Bar */}
        {avgPressure !== null && (
          <div
            style={{
              background: "var(--color-surface-2)",
              borderRadius: "12px",
              padding: "10px 12px",
              marginTop: "4px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: "6px",
              }}
            >
              <span
                style={{
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                }}
              >
                แรงกดดันมวลน้ำรวมต่อปี 54:
              </span>
              <span
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  color:
                    avgPressure >= 85
                      ? "var(--color-severe)"
                      : avgPressure >= 60
                        ? "var(--color-watch)"
                        : "var(--color-low)",
                }}
              >
                ~{avgPressure}% ของปี 54
              </span>
            </div>

            {/* Comparison progress bar */}
            <div
              style={{
                height: "10px",
                borderRadius: "999px",
                background: "var(--color-border)",
                overflow: "hidden",
                position: "relative",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.min(100, avgPressure)}%`,
                  borderRadius: "999px",
                  background:
                    avgPressure >= 85
                      ? "var(--color-severe)"
                      : avgPressure >= 60
                        ? "var(--color-watch)"
                        : "var(--color-low)",
                  transition: "width 0.4s ease",
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.65rem",
                color: "var(--color-text-muted)",
                marginTop: "4px",
              }}
            >
              <span>0% (แห้งแล้ง)</span>
              <span>50% (ครึ่งหนึ่งของปี 54)</span>
              <span style={{ color: "var(--color-severe)", fontWeight: 700 }}>
                100% (จุดท่วมปี 54)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── 2. Summary Status Vitals ────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "8px",
        }}
      >
        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: "12px",
            padding: "10px 12px",
            border: "1px solid var(--color-border)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "0.68rem",
              color: "var(--color-low)",
              fontWeight: 700,
            }}
          >
            🟢 ห่างจากปี 54
          </div>
          <div
            style={{
              fontSize: "1.4rem",
              fontWeight: 800,
              color: "var(--color-low)",
              lineHeight: 1.2,
            }}
          >
            {safeCount}
          </div>
          <div
            style={{ fontSize: "0.62rem", color: "var(--color-text-muted)" }}
          >
            ด้านที่ปลอดภัย
          </div>
        </div>

        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: "12px",
            padding: "10px 12px",
            border:
              watchCount > 0
                ? "1.5px solid var(--color-watch)"
                : "1px solid var(--color-border)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "0.68rem",
              color: "var(--color-watch)",
              fontWeight: 700,
            }}
          >
            🟡 เฝ้าระวัง
          </div>
          <div
            style={{
              fontSize: "1.4rem",
              fontWeight: 800,
              color: "var(--color-watch)",
              lineHeight: 1.2,
            }}
          >
            {watchCount}
          </div>
          <div
            style={{ fontSize: "0.62rem", color: "var(--color-text-muted)" }}
          >
            ด้านที่ต้องติดตาม
          </div>
        </div>

        <div
          style={{
            background: "var(--color-surface)",
            borderRadius: "12px",
            padding: "10px 12px",
            border:
              criticalCount > 0
                ? "2px solid var(--color-severe)"
                : "1px solid var(--color-border)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "0.68rem",
              color: "var(--color-severe)",
              fontWeight: 700,
            }}
          >
            🔴 ใกล้เคียงปี 54
          </div>
          <div
            style={{
              fontSize: "1.4rem",
              fontWeight: 800,
              color: "var(--color-severe)",
              lineHeight: 1.2,
            }}
          >
            {criticalCount}
          </div>
          <div
            style={{ fontSize: "0.62rem", color: "var(--color-text-muted)" }}
          >
            แตะเกณฑ์วิกฤต
          </div>
        </div>
      </div>

      {unknownCount > 0 && (
        <div
          style={{
            fontSize: "0.68rem",
            color: "var(--color-text-muted)",
            textAlign: "center",
            marginTop: "-8px",
          }}
        >
          รอข้อมูลสถานีตรวจวัด {unknownCount} ด้าน
        </div>
      )}

      {/* ── 3. Visual Infographic Comparison Cards ──────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {indicators.map((item) => {
          const isExpanded = expandedId === item.id;
          const ratioPercent = item.percentOf2554 ?? 0;

          return (
            <div
              key={item.id}
              style={{
                background: "var(--color-surface)",
                borderRadius: "14px",
                padding: "12px 14px",
                border:
                  item.status === "critical"
                    ? "1.5px solid var(--color-severe)"
                    : "1px solid var(--color-border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
                  <div>
                    <div
                      style={{
                        fontSize: "0.84rem",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: "0.68rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {item.subtitle}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    display: "inline-block",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    color: item.statusColor,
                    background:
                      item.status === "critical"
                        ? "var(--color-severe-bg)"
                        : item.status === "watch"
                          ? "var(--color-watch-bg)"
                          : item.status === "safe"
                            ? "var(--color-low-bg)"
                            : "rgba(100,116,139,0.1)",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.statusText}
                </span>
              </div>

              {/* 2-Side Value Chips: ปี 2554 vs ปัจจุบัน */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  marginBottom: "10px",
                }}
              >
                <div
                  style={{
                    background: "rgba(220, 38, 38, 0.05)",
                    border: "1px solid rgba(220, 38, 38, 0.15)",
                    borderRadius: "8px",
                    padding: "6px 8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.64rem",
                      color: "var(--color-severe)",
                      fontWeight: 600,
                    }}
                  >
                    🚩 ยอดวิกฤตปี 2554
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      marginTop: "2px",
                    }}
                  >
                    {item.year2554Display}
                  </div>
                </div>

                <div
                  style={{
                    background:
                      item.status === "safe"
                        ? "rgba(16, 185, 129, 0.06)"
                        : "var(--color-surface-2)",
                    border:
                      item.status === "safe"
                        ? "1px solid rgba(16, 185, 129, 0.25)"
                        : "1px solid var(--color-border)",
                    borderRadius: "8px",
                    padding: "6px 8px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.64rem",
                      color: item.statusColor,
                      fontWeight: 600,
                    }}
                  >
                    📡 ตรวจวัดจริงปัจจุบัน
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      marginTop: "2px",
                    }}
                  >
                    {item.currentDisplay}
                  </div>
                </div>
              </div>

              {/* ── Infographic Comparison Meter (Bar vs 2554 Benchmark) ── */}
              {item.percentOf2554 !== null && (
                <div style={{ marginTop: "4px", marginBottom: "6px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.68rem",
                      color: "var(--color-text-muted)",
                      marginBottom: "4px",
                    }}
                  >
                    <span>
                      สัดส่วนเทียบปี 54:{" "}
                      <strong style={{ color: item.statusColor }}>
                        {item.percentOf2554}%
                      </strong>
                    </span>
                    <span
                      style={{ color: "var(--color-low)", fontWeight: 600 }}
                    >
                      {item.headroomNote}
                    </span>
                  </div>

                  {/* Relative bar */}
                  <div
                    style={{
                      height: "8px",
                      borderRadius: "999px",
                      background: "var(--color-surface-2)",
                      border: "1px solid var(--color-border)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(100, Math.max(5, ratioPercent))}%`,
                        borderRadius: "999px",
                        background:
                          ratioPercent >= 85
                            ? "var(--color-severe)"
                            : ratioPercent >= 60
                              ? "var(--color-watch)"
                              : "var(--color-low)",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Toggleable detail chip */}
              <div
                style={{
                  marginTop: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.68rem",
                  borderTop: "1px dashed var(--color-border)",
                  paddingTop: "6px",
                }}
              >
                <span style={{ color: "var(--color-text-muted)" }}>
                  💡 {item.diffNote}
                </span>

                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-accent)",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "0.68rem",
                    whiteSpace: "nowrap",
                    marginLeft: "8px",
                  }}
                >
                  {isExpanded ? "ย่อ ▲" : "ดูข้อมูล ▼"}
                </button>
              </div>

              {/* Collapsed impact text */}
              {isExpanded && (
                <div
                  style={{
                    marginTop: "6px",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    background: "var(--color-surface-2)",
                    fontSize: "0.7rem",
                    color: "var(--color-text-secondary)",
                    lineHeight: 1.45,
                  }}
                >
                  {item.diffNote}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
