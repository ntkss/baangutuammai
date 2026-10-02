"use client";

import React from "react";
import { Ruler, Home, Anchor, Waves } from "lucide-react";

interface WaterElevationCrossSectionProps {
  /** House ground elevation in meters above sea level (ม.รทก.) */
  houseElevationM: number | null | undefined;
  /** Nearest river station water level (ม.รทก.) */
  riverWaterLevelM: number | null | undefined;
  /** Nearest river bank level (ม.รทก.) */
  bankLevelM: number | null | undefined;
  /** Margin between house ground and water level (ม.) */
  elevationMarginM: number | null | undefined;
  /** Margin between bank and water level (ม.) */
  diffBankM: number | null | undefined;
  /** Station name */
  stationName?: string;
}

export function WaterElevationCrossSection({
  houseElevationM,
  riverWaterLevelM,
  bankLevelM,
  elevationMarginM,
  diffBankM,
  stationName,
}: WaterElevationCrossSectionProps) {
  // If no water level data at all
  if (riverWaterLevelM === null || riverWaterLevelM === undefined) {
    return (
      <div
        className="card"
        style={{
          marginBottom: "16px",
          padding: "20px 16px",
          textAlign: "center",
          background: "var(--color-surface)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "8px",
          }}
        >
          <Waves size={28} color="var(--color-accent)" />
        </div>
        <p
          style={{
            margin: "0",
            fontSize: "0.85rem",
            color: "var(--color-text-muted)",
          }}
        >
          รอข้อมูลระดับน้ำจากสถานีตรวจวัดเพื่อแสดงภาพตัดขวาง
        </p>
      </div>
    );
  }

  // Calculate clearance
  const isOverflowBank =
    diffBankM !== undefined && diffBankM !== null ? diffBankM < 0 : false;
  const bankClearance =
    diffBankM !== undefined && diffBankM !== null
      ? Math.abs(diffBankM)
      : bankLevelM !== undefined && bankLevelM !== null
        ? bankLevelM - riverWaterLevelM
        : null;

  // Margin to house
  const houseMargin =
    elevationMarginM !== undefined && elevationMarginM !== null
      ? elevationMarginM
      : houseElevationM !== undefined && houseElevationM !== null
        ? houseElevationM - riverWaterLevelM
        : null;

  const isHouseAtRisk = houseMargin !== null && houseMargin < 0.3;

  // Status theme
  let statusTheme = {
    color: "var(--color-low)",
    bg: "var(--color-low-bg)",
    border: "var(--color-low-border)",
    waterColor: "#38bdf8",
    waterDeep: "#0284c7",
    label: "ระดับน้ำปลอดภัย",
  };

  if (isOverflowBank || (houseMargin !== null && houseMargin <= 0)) {
    statusTheme = {
      color: "var(--color-severe)",
      bg: "var(--color-severe-bg)",
      border: "var(--color-severe-border)",
      waterColor: "#f87171",
      waterDeep: "#dc2626",
      label: "วิกฤต! น้ำล้นตลิ่ง",
    };
  } else if (isHouseAtRisk || (bankClearance !== null && bankClearance < 0.3)) {
    statusTheme = {
      color: "var(--color-high)",
      bg: "var(--color-high-bg)",
      border: "var(--color-high-border)",
      waterColor: "#fb923c",
      waterDeep: "#ea580c",
      label: "เฝ้าระวังสูงสุด น้ำใกล้ตลิ่ง",
    };
  } else if (bankClearance !== null && bankClearance < 0.8) {
    statusTheme = {
      color: "var(--color-watch)",
      bg: "var(--color-watch-bg)",
      border: "var(--color-watch-border)",
      waterColor: "#38bdf8",
      waterDeep: "#0369a1",
      label: "ระดับน้ำเฝ้าระวัง",
    };
  }

  // Calculate SVG Y level for water:
  // Bank level is at Y = 90
  // Safe low water is around Y = 145
  // Overflow goes above 90 (up to Y = 68)
  let waterY = 120;
  if (bankClearance !== null) {
    if (isOverflowBank) {
      waterY = Math.max(68, 90 - Math.min(bankClearance * 30, 22));
    } else {
      waterY = Math.min(145, 90 + Math.min(bankClearance * 25, 55));
    }
  }

  // Calculate slope contact point for water
  let waterSlopeX = 195;
  let waterPath = "";
  if (waterY >= 90) {
    // Water below or at bank level
    waterSlopeX = 195 + ((waterY - 90) / 70) * 40;
    waterPath = `M ${waterSlopeX},${waterY} L 400,${waterY} L 400,170 L 235,170 L ${waterSlopeX},${Math.max(waterY, 160)} Z`;
  } else {
    // Water overflowed crest
    waterSlopeX = Math.max(160, 195 - (90 - waterY) * 1.5);
    waterPath = `M ${waterSlopeX},${waterY} L 400,${waterY} L 400,170 L 235,170 L 195,160 L 195,90 L ${waterSlopeX},90 Z`;
  }

  return (
    <div
      className="card card--elevated"
      style={{
        marginBottom: "16px",
        padding: "16px",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Ruler size={16} color="var(--color-accent)" />
          <h2
            style={{
              fontSize: "0.9rem",
              fontWeight: 700,
              margin: 0,
              color: "var(--color-text-primary)",
            }}
          >
            ระดับน้ำ
          </h2>
        </div>
        <span
          style={{
            fontSize: "0.72rem",
            padding: "2px 8px",
            borderRadius: "9999px",
            background: statusTheme.bg,
            color: statusTheme.color,
            border: `1px solid ${statusTheme.border}`,
            fontWeight: 600,
          }}
        >
          {statusTheme.label}
        </span>
      </div>

      {/* SVG Cross-Section Illustration */}
      <div
        style={{
          width: "100%",
          borderRadius: "12px",
          background: "linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)",
          border: "1px solid var(--color-border)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg
          viewBox="0 0 400 170"
          style={{ width: "100%", height: "auto", display: "block" }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={statusTheme.waterColor}
                stopOpacity="0.88"
              />
              <stop
                offset="100%"
                stopColor={statusTheme.waterDeep}
                stopOpacity="0.95"
              />
            </linearGradient>
            <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
            <linearGradient id="embankGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>

          {/* Reference subtle lines */}
          <line
            x1="0"
            y1="55"
            x2="400"
            y2="55"
            stroke="#e2e8f0"
            strokeDasharray="3 3"
            strokeWidth="0.8"
          />
          <line
            x1="0"
            y1="90"
            x2="400"
            y2="90"
            stroke="#e2e8f0"
            strokeDasharray="3 3"
            strokeWidth="0.8"
          />

          {/* 1. Ground Profile */}
          <path
            d="M 0,55 L 135,55 L 180,90 L 195,90 L 235,160 L 400,160 L 400,170 L 0,170 Z"
            fill="url(#groundGrad)"
          />

          {/* Grass strip on top of high ground */}
          <rect
            x="0"
            y="54"
            width="135"
            height="3"
            fill="#10b981"
            opacity="0.6"
          />

          {/* Embankment Wall */}
          <rect
            x="190"
            y="84"
            width="7"
            height="15"
            rx="1.5"
            fill="url(#embankGrad)"
          />

          {/* 2. Water Body */}
          <path d={waterPath} fill="url(#waterGrad)" />

          {/* Water surface highlight line */}
          <line
            x1={waterSlopeX}
            y1={waterY}
            x2="400"
            y2={waterY}
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeOpacity="0.85"
            strokeDasharray="16 4"
          />

          {/* 3. House Icon */}
          <g transform="translate(45, 12)">
            <polygon points="20,8 3,24 37,24" fill="#3b82f6" />
            <rect
              x="8"
              y="24"
              width="24"
              height="19"
              fill="#ffffff"
              stroke="#93c5fd"
              strokeWidth="1.5"
              rx="1"
            />
            <rect x="17" y="31" width="6" height="12" fill="#2563eb" rx="1" />
            <rect x="11" y="27" width="5" height="5" fill="#bfdbfe" rx="0.5" />
          </g>

          {/* House Ground Badge */}
          <g transform="translate(20, 64)">
            <rect
              x="0"
              y="0"
              width="86"
              height="24"
              rx="6"
              fill="#ffffff"
              stroke="rgba(0,0,0,0.06)"
              filter="drop-shadow(0 1px 2px rgba(0,0,0,0.05))"
            />
            <text
              x="43"
              y="11"
              fontSize="9"
              fontWeight="700"
              fill="#1e293b"
              textAnchor="middle"
            >
              🏠 พื้นบ้านของคุณ
            </text>
            <text
              x="43"
              y="20"
              fontSize="8"
              fontWeight="600"
              fill="#64748b"
              textAnchor="middle"
            >
              {houseElevationM !== null && houseElevationM !== undefined
                ? `+${houseElevationM.toFixed(2)} ม.รทก.`
                : "ระดับพื้นดิน"}
            </text>
          </g>

          {/* Bank Crest Marker */}
          <text
            x="184"
            y="80"
            fontSize="8.5"
            fontWeight="700"
            fill="#475569"
            textAnchor="end"
          >
            ⚓ ขอบตลิ่ง
          </text>
          <text
            x="184"
            y="89"
            fontSize="8"
            fontWeight="600"
            fill="#64748b"
            textAnchor="end"
          >
            {bankLevelM !== null && bankLevelM !== undefined
              ? `+${bankLevelM.toFixed(2)} ม.`
              : ""}
          </text>

          {/* River Water Level Indicator Pill */}
          <g transform={`translate(325, ${Math.max(68, waterY - 14)})`}>
            <rect
              x="-46"
              y="-13"
              width="92"
              height="20"
              rx="10"
              fill="#ffffff"
              stroke="rgba(0,0,0,0.08)"
              filter="drop-shadow(0 2px 4px rgba(0,0,0,0.12))"
            />
            <text
              x="0"
              y="1"
              fontSize="9"
              fontWeight="800"
              fill="#0284c7"
              textAnchor="middle"
            >
              🌊 +{riverWaterLevelM.toFixed(2)} ม.รทก.
            </text>
          </g>

          {/* Clearance Guide Line */}
          {bankClearance !== null && (
            <g transform="translate(210, 0)">
              <line
                x1="0"
                y1="90"
                x2="0"
                y2={waterY}
                stroke={isOverflowBank ? "#dc2626" : "#0284c7"}
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <polygon
                points={`-3,${Math.min(92, waterY - 2)} 3,${Math.min(92, waterY - 2)} 0,90`}
                fill={isOverflowBank ? "#dc2626" : "#0284c7"}
              />
              <polygon
                points={`-3,${Math.max(88, waterY - 2)} 3,${Math.max(88, waterY - 2)} 0,${waterY}`}
                fill={isOverflowBank ? "#dc2626" : "#0284c7"}
              />
            </g>
          )}
        </svg>
      </div>

      {/* Summary Clearance Pills */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px",
          marginTop: "12px",
        }}
      >
        <div
          style={{
            background: "var(--color-surface-2)",
            borderRadius: "10px",
            padding: "8px 10px",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--color-text-muted)",
              marginBottom: "3px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Anchor size={12} color="var(--color-text-secondary)" />
            <span>ระยะห่างจากตลิ่ง</span>
          </div>
          <div
            style={{
              fontSize: "0.95rem",
              fontWeight: 800,
              color: isOverflowBank
                ? "var(--color-severe)"
                : "var(--color-text-primary)",
            }}
          >
            {bankClearance !== null
              ? isOverflowBank
                ? `ล้นตลิ่ง ${bankClearance.toFixed(2)} ม.`
                : `ต่ำกว่าตลิ่ง ${bankClearance.toFixed(2)} ม.`
              : "ไม่มีข้อมูลตลิ่ง"}
          </div>
        </div>

        <div
          style={{
            background: "var(--color-surface-2)",
            borderRadius: "10px",
            padding: "8px 10px",
            border: "1px solid var(--color-border)",
          }}
        >
          <div
            style={{
              fontSize: "0.7rem",
              color: "var(--color-text-muted)",
              marginBottom: "3px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Home size={12} color="var(--color-text-secondary)" />
            <span>ระยะห่างจากพื้นบ้าน</span>
          </div>
          <div
            style={{
              fontSize: "0.95rem",
              fontWeight: 800,
              color:
                houseMargin !== null && houseMargin < 0.3
                  ? "var(--color-severe)"
                  : "var(--color-low)",
            }}
          >
            {houseMargin !== null
              ? houseMargin > 0
                ? `เหลือ ${houseMargin.toFixed(2)} ม.`
                : `น้ำท่วมถึงพื้นบ้าน`
              : "รอข้อมูลระดับดิน"}
          </div>
        </div>
      </div>

      {stationName && (
        <div
          style={{
            fontSize: "0.68rem",
            color: "var(--color-text-muted)",
            marginTop: "8px",
            textAlign: "right",
          }}
        >
          อิงระดับน้ำจาก: {stationName}
        </div>
      )}
    </div>
  );
}
