"use client";

import React from "react";
import {
  Zap,
  Gauge,
  Sun,
  CloudSun,
  CloudRain,
  CloudLightning,
  MountainSnow,
  ArrowDownRight,
  ArrowUpRight,
} from "lucide-react";

interface BentoVitalsProps {
  c13DischargeM3s: number | null | undefined;
  rain24hMm: number | null | undefined;
  rainIntensity?: string;
  reservoirBasin: {
    avgStoragePercent: number;
    totalInflowM3s: number;
    totalOutflowM3s: number;
    damCount: number;
    totalDamsInBasin?: number;
  } | null | undefined;
}

export function BentoVitals({
  c13DischargeM3s,
  rain24hMm,
  reservoirBasin,
}: BentoVitalsProps) {
  // C.13 Status & thresholds
  let c13Label = "ไม่มีข้อมูลตรวจวัด";
  let c13Color = "var(--color-text-muted)";
  let c13Bg = "rgba(100,116,139,0.1)";
  let c13Percent = 0;

  if (c13DischargeM3s !== null && c13DischargeM3s !== undefined) {
    // 0 to 3000 m3/s scale
    c13Percent = Math.min(100, Math.max(5, (c13DischargeM3s / 3000) * 100));
    if (c13DischargeM3s < 1500) {
      c13Label = "ปกติ (รับน้ำได้)";
      c13Color = "var(--color-low)";
      c13Bg = "var(--color-low-bg)";
    } else if (c13DischargeM3s <= 2000) {
      c13Label = "เฝ้าระวังพื้นที่ลุ่ม";
      c13Color = "var(--color-watch)";
      c13Bg = "var(--color-watch-bg)";
    } else if (c13DischargeM3s <= 2500) {
      c13Label = "วิกฤต! นนทบุรี-ปทุมฯ";
      c13Color = "var(--color-high)";
      c13Bg = "var(--color-high-bg)";
    } else {
      c13Label = "วิกฤตรุนแรง ท่วมกว้าง";
      c13Color = "var(--color-severe)";
      c13Bg = "var(--color-severe-bg)";
    }
  }

  // Rain status
  let rainLabel = "ไม่มีข้อมูลฝน";
  let rainColor = "var(--color-text-muted)";
  let RainIconComponent = CloudSun;
  let rainPercent = 0;

  if (rain24hMm !== null && rain24hMm !== undefined) {
    // 0 to 100mm scale
    rainPercent = Math.min(100, (rain24hMm / 100) * 100);
    if (rain24hMm < 0.5) {
      rainLabel = "ไม่มีฝนสะสม";
      rainColor = "var(--color-low)";
      RainIconComponent = Sun;
    } else if (rain24hMm <= 10) {
      rainLabel = "ฝนตกเล็กน้อย";
      rainColor = "var(--color-low)";
      RainIconComponent = CloudSun;
    } else if (rain24hMm <= 35) {
      rainLabel = "ฝนปานกลาง";
      rainColor = "var(--color-watch)";
      RainIconComponent = CloudRain;
    } else if (rain24hMm <= 90) {
      rainLabel = "ฝนตกหนัก";
      rainColor = "var(--color-high)";
      RainIconComponent = CloudRain;
    } else {
      rainLabel = "ฝนตกหนักมาก!";
      rainColor = "var(--color-severe)";
      RainIconComponent = CloudLightning;
    }
  }

  return (
    <div style={{ marginBottom: "16px" }}>
      {/* Section Subheading */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Zap size={18} color="var(--color-watch)" />
          <h2
            style={{
              fontSize: "0.88rem",
              fontWeight: 700,
              margin: 0,
              color: "var(--color-text-primary)",
            }}
          >
            3 สัญญาณชี้ชะตา (Vital Signs)
          </h2>
        </div>
        <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
          ตรวจวัดจริงรอบ 24 ชม.
        </span>
      </div>

      {/* Bento Grid: 2 columns top + 1 wide card bottom */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginBottom: "10px",
        }}
      >
        {/* Card 1: C.13 Chao Phraya Dam */}
        <div
          className="card"
          style={{
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "4px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "0.72rem",
                  color: "var(--color-text-muted)",
                  fontWeight: 600,
                }}
              >
                <Gauge size={14} color="var(--color-text-secondary)" />
                <span>เขื่อนเจ้าพระยา</span>
              </div>
              <span
                style={{
                  fontSize: "0.65rem",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  background: c13Bg,
                  color: c13Color,
                  fontWeight: 700,
                }}
              >
                C.13
              </span>
            </div>

            <div style={{ margin: "4px 0" }}>
              <span
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "var(--color-text-primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                {c13DischargeM3s !== null && c13DischargeM3s !== undefined
                  ? c13DischargeM3s.toLocaleString()
                  : "--"}
              </span>
              <span
                style={{
                  fontSize: "0.68rem",
                  color: "var(--color-text-muted)",
                  marginLeft: "4px",
                }}
              >
                ลบ.ม./วิ
              </span>
            </div>
          </div>

          <div>
            {/* Visual Gauge Bar */}
            <div
              style={{
                height: "6px",
                background: "var(--color-surface-2)",
                borderRadius: "3px",
                overflow: "hidden",
                margin: "6px 0 4px 0",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${c13Percent}%`,
                  background: c13Color,
                  borderRadius: "3px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <div
              style={{
                fontSize: "0.68rem",
                fontWeight: 600,
                color: c13Color,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {c13Label}
            </div>
          </div>
        </div>

        {/* Card 2: 24h Rainfall */}
        <div
          className="card"
          style={{
            padding: "12px 14px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "4px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  fontSize: "0.72rem",
                  color: "var(--color-text-muted)",
                  fontWeight: 600,
                }}
              >
                <RainIconComponent size={14} color="var(--color-accent)" />
                <span>ฝนสะสม 24 ชม.</span>
              </div>
              <span
                style={{
                  fontSize: "0.65rem",
                  padding: "1px 6px",
                  borderRadius: "4px",
                  background: "var(--color-surface-2)",
                  color: "var(--color-text-secondary)",
                  fontWeight: 600,
                }}
              >
                รอบบ้าน
              </span>
            </div>

            <div style={{ margin: "4px 0" }}>
              <span
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: "var(--color-text-primary)",
                  letterSpacing: "-0.02em",
                }}
              >
                {rain24hMm !== null && rain24hMm !== undefined
                  ? rain24hMm.toFixed(1)
                  : "--"}
              </span>
              <span
                style={{
                  fontSize: "0.68rem",
                  color: "var(--color-text-muted)",
                  marginLeft: "4px",
                }}
              >
                มม.
              </span>
            </div>
          </div>

          <div>
            {/* Visual Gauge Bar */}
            <div
              style={{
                height: "6px",
                background: "var(--color-surface-2)",
                borderRadius: "3px",
                overflow: "hidden",
                margin: "6px 0 4px 0",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.max(5, rainPercent)}%`,
                  background: rainColor,
                  borderRadius: "3px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
            <div
              style={{
                fontSize: "0.68rem",
                fontWeight: 600,
                color: rainColor,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {rainLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Card 3: Reservoir Basin Capacity (Wide card) */}
      {reservoirBasin && (
        <div
          className="card"
          style={{
            padding: "12px 14px",
            background: "linear-gradient(135deg, rgba(255,255,255,1), rgba(248,250,252,0.8))",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <MountainSnow size={18} color="var(--color-accent)" />
              <span
                style={{
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                }}
              >
                ความจุน้ำกักเก็บลุ่มน้ำเจ้าพระยา (ชป.)
              </span>
            </div>
            <span
              style={{
                fontSize: "0.95rem",
                fontWeight: 800,
                color:
                  reservoirBasin.avgStoragePercent > 80
                    ? "var(--color-watch)"
                    : "var(--color-low)",
              }}
            >
              {reservoirBasin.avgStoragePercent.toFixed(1)}%
            </span>
          </div>

          {/* Progress bar with 80% caution indicator line */}
          <div
            style={{
              position: "relative",
              height: "7px",
              background: "var(--color-surface-2)",
              borderRadius: "4px",
              overflow: "hidden",
              marginBottom: "6px",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, reservoirBasin.avgStoragePercent)}%`,
                background:
                  reservoirBasin.avgStoragePercent > 80
                    ? "linear-gradient(90deg, #10b981, #f59e0b)"
                    : "#10b981",
                borderRadius: "4px",
              }}
            />
          </div>

          {/* Water Inflow & Outflow info */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.7rem",
              color: "var(--color-text-muted)",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
              <ArrowDownRight size={13} color="var(--color-low)" />
              ไหลเข้า {reservoirBasin.totalInflowM3s.toLocaleString()} ล้าน ลบ.ม./วัน
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
              <ArrowUpRight size={13} color="var(--color-accent)" />
              ระบายออก {reservoirBasin.totalOutflowM3s.toLocaleString()} ล้าน ลบ.ม./วัน
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
