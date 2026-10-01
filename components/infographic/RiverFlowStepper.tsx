"use client";

import React, { useState } from "react";
import {
  Compass,
  ChevronUp,
  ChevronDown,
  Mountain,
  Gauge,
  Home,
  Waves,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
} from "lucide-react";
import type { NorthernRunoffSummary } from "@/lib/providers/thaiwater";

interface RiverFlowStepperProps {
  data: NorthernRunoffSummary | null | undefined;
}

export function RiverFlowStepper({ data }: RiverFlowStepperProps) {
  const [expanded, setExpanded] = useState(false);

  if (!data) return null;

  const { c2NakhonSawan, c13ChaoPhrayaDam, corridor } = data;

  // C.2 Status
  const c2Discharge = c2NakhonSawan?.dischargeM3s ?? null;
  const isC2High = c2Discharge !== null && c2Discharge >= 2000;
  const isC2Severe = c2Discharge !== null && c2Discharge >= 2500;

  // C.13 Status
  const c13Discharge = c13ChaoPhrayaDam?.dischargeM3s ?? null;
  const isC13High = c13Discharge !== null && c13Discharge >= 2000;
  const isC13Severe = c13Discharge !== null && c13Discharge >= 2500;

  // Nearest station status
  const nearest = corridor.nearest;
  const isNearestOverflow = nearest?.diffBankText?.includes("ล้น");
  const isNearestClose =
    nearest?.diffBankM !== null &&
    nearest?.diffBankM !== undefined &&
    nearest.diffBankM < 0.3;

  // Downstream status
  const downstream = corridor.downstream;

  return (
    <div className="card" style={{ marginBottom: "16px", padding: "16px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Compass size={18} color="var(--color-accent)" />
          <h2
            style={{
              fontSize: "0.88rem",
              fontWeight: 700,
              margin: 0,
              color: "var(--color-text-primary)",
            }}
          >
            เส้นทางมวลน้ำ (River Corridor)
          </h2>
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            fontSize: "0.72rem",
            color: "var(--color-accent)",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: "3px",
          }}
        >
          {expanded ? (
            <>
              <span>ย่อผัง</span> <ChevronUp size={14} />
            </>
          ) : (
            <>
              <span>ดูสถิติเต็ม</span> <ChevronDown size={14} />
            </>
          )}
        </button>
      </div>

      {/* Visual Flowline (Horizontal Pipeline / Stepper) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "4px",
          position: "relative",
          padding: "6px 0",
        }}
      >
        {/* Node 1: C.2 Nakhon Sawan */}
        <FlowNode
          icon={Mountain}
          title="นครสวรรค์"
          sub="C.2"
          value={c2Discharge !== null ? `${c2Discharge.toLocaleString()}` : "--"}
          unit="ลบ.ม./วิ"
          statusColor={
            isC2Severe
              ? "var(--color-severe)"
              : isC2High
                ? "var(--color-high)"
                : "var(--color-low)"
          }
          isAlert={isC2Severe || isC2High}
        />

        {/* Node 2: C.13 Chao Phraya Dam */}
        <FlowNode
          icon={Gauge}
          title="เขื่อนเจ้าพระยา"
          sub="C.13"
          value={c13Discharge !== null ? `${c13Discharge.toLocaleString()}` : "--"}
          unit="ลบ.ม./วิ"
          statusColor={
            isC13Severe
              ? "var(--color-severe)"
              : isC13High
                ? "var(--color-high)"
                : c13Discharge && c13Discharge > 1500
                  ? "var(--color-watch)"
                  : "var(--color-low)"
          }
          isAlert={isC13Severe || isC13High}
        />

        {/* Node 3: Nearest Station */}
        <FlowNode
          icon={Home}
          title="จุดใกล้บ้าน"
          sub={nearest?.stationName ? nearest.stationName.slice(0, 10) : "ลำน้ำรอบบ้าน"}
          value={
            nearest?.waterLevelM !== undefined
              ? `+${nearest.waterLevelM.toFixed(2)}`
              : "--"
          }
          unit="ม.รทก."
          statusColor={
            isNearestOverflow
              ? "var(--color-severe)"
              : isNearestClose
                ? "var(--color-high)"
                : "var(--color-low)"
          }
          isHighlighted
        />

        {/* Node 4: Downstream */}
        <FlowNode
          icon={Waves}
          title="ปลายน้ำ"
          sub="สู่ทะเล"
          value={
            downstream?.waterLevelM !== undefined
              ? `+${downstream.waterLevelM.toFixed(2)}`
              : "--"
          }
          unit="ม.รทก."
          statusColor="var(--color-low)"
        />
      </div>

      {/* Expanded Details Section (Progressive disclosure) */}
      {expanded && (
        <div
          style={{
            marginTop: "14px",
            borderTop: "1px dashed var(--color-border)",
            paddingTop: "10px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
            }}
          >
            📋 รายละเอียดสถานีตรวจวัดตามลำดับการไหล:
          </div>

          {/* C.2 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.74rem",
              padding: "6px 8px",
              background: "var(--color-surface-2)",
              borderRadius: "6px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontWeight: 600 }}>
                <Mountain size={13} color="var(--color-accent)" />
                <span>1. สถานี C.2 นครสวรรค์</span>
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--color-text-muted)", marginLeft: "18px" }}>
                ระดับน้ำ {c2NakhonSawan?.waterLevelM.toFixed(2)} ม.รทก.
              </div>
            </div>
            <div style={{ textAlign: "right", fontWeight: 700 }}>
              {c2Discharge?.toLocaleString() ?? "--"} ลบ.ม./วิ
            </div>
          </div>

          {/* C.13 */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.74rem",
              padding: "6px 8px",
              background: "var(--color-surface-2)",
              borderRadius: "6px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontWeight: 600 }}>
                <Gauge size={13} color="var(--color-accent)" />
                <span>2. สถานี C.13 เขื่อนเจ้าพระยา (ชัยนาท)</span>
              </div>
              <div style={{ fontSize: "0.68rem", color: "var(--color-text-muted)", marginLeft: "18px" }}>
                ท้ายเขื่อน {c13ChaoPhrayaDam?.waterLevelM.toFixed(2)} ม.รทก.
              </div>
            </div>
            <div style={{ textAlign: "right", fontWeight: 700 }}>
              {c13Discharge?.toLocaleString() ?? "--"} ลบ.ม./วิ
            </div>
          </div>

          {/* Upstream */}
          {corridor.upstream && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.74rem",
                padding: "6px 8px",
                background: "var(--color-surface-2)",
                borderRadius: "6px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontWeight: 600 }}>
                  <ArrowUp size={13} color="var(--color-accent)" />
                  <span>เหนือบ้าน: {corridor.upstream.stationName}</span>
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--color-text-muted)", marginLeft: "18px" }}>
                  {corridor.upstream.distanceKm} กม. เหนือบ้าน
                </div>
              </div>
              <div style={{ textAlign: "right", fontWeight: 700 }}>
                +{corridor.upstream.waterLevelM.toFixed(2)} ม.รทก.
              </div>
            </div>
          )}

          {/* Nearest */}
          {nearest && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.74rem",
                padding: "6px 8px",
                background: "rgba(37, 99, 235, 0.08)",
                border: "1px solid rgba(37, 99, 235, 0.2)",
                borderRadius: "6px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontWeight: 700, color: "var(--color-accent)" }}>
                  <Home size={13} color="var(--color-accent)" />
                  <span>ใกล้บ้านที่สุด: {nearest.stationName}</span>
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--color-text-muted)", marginLeft: "18px" }}>
                  {nearest.diffBankM !== null && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                      {isNearestOverflow && <AlertTriangle size={11} color="var(--color-severe)" />}
                      {nearest.diffBankText?.includes("ล้น")
                        ? `ล้นตลิ่ง ${Math.abs(nearest.diffBankM).toFixed(2)} ม.`
                        : `ต่ำกว่าตลิ่ง ${nearest.diffBankM.toFixed(2)} ม.`}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ textAlign: "right", fontWeight: 700 }}>
                +{nearest.waterLevelM.toFixed(2)} ม.รทก.
              </div>
            </div>
          )}

          {/* Downstream */}
          {downstream && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "0.74rem",
                padding: "6px 8px",
                background: "var(--color-surface-2)",
                borderRadius: "6px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontWeight: 600 }}>
                  <ArrowDown size={13} color="var(--color-low)" />
                  <span>ใต้บ้าน: {downstream.stationName}</span>
                </div>
                <div style={{ fontSize: "0.68rem", color: "var(--color-text-muted)", marginLeft: "18px" }}>
                  ระบายออกสู่ปากอ่าวไทย ({downstream.distanceKm} กม.)
                </div>
              </div>
              <div style={{ textAlign: "right", fontWeight: 700 }}>
                +{downstream.waterLevelM.toFixed(2)} ม.รทก.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FlowNode({
  icon: IconComponent,
  title,
  sub,
  value,
  unit,
  statusColor,
  isAlert,
  isHighlighted,
}: {
  icon: React.ComponentType<{ size: number; strokeWidth?: number }>;
  title: string;
  sub: string;
  value: string;
  unit: string;
  statusColor: string;
  isAlert?: boolean;
  isHighlighted?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "6px 4px",
        background: isHighlighted ? "rgba(37, 99, 235, 0.05)" : "transparent",
        borderRadius: "8px",
        border: isHighlighted
          ? "1px solid rgba(37, 99, 235, 0.2)"
          : "1px solid transparent",
      }}
    >
      {/* Node Dot / Badge */}
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          background: statusColor,
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "4px",
          boxShadow: isAlert ? "0 0 0 4px rgba(239, 68, 68, 0.2)" : "none",
        }}
      >
        <IconComponent size={12} strokeWidth={2.4} />
      </div>

      <div
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          color: isHighlighted ? "var(--color-accent)" : "var(--color-text-primary)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          width: "100%",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "0.62rem",
          color: "var(--color-text-muted)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          width: "100%",
          marginBottom: "2px",
        }}
      >
        {sub}
      </div>

      <div
        style={{
          fontSize: "0.78rem",
          fontWeight: 800,
          color: "var(--color-text-primary)",
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: "0.58rem", color: "var(--color-text-muted)" }}>
        {unit}
      </div>
    </div>
  );
}
