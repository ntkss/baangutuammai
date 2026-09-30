"use client";

import type {
  NorthernRunoffSummary,
  KeyRiverStation,
} from "@/lib/providers/thaiwater";

interface NorthernRunoffCardProps {
  data: NorthernRunoffSummary | null;
}

function getDischargeStatus(dischargeM3s: number | null, type: "c2" | "c13") {
  if (dischargeM3s === null)
    return {
      label: "ไม่มีข้อมูล",
      color: "var(--color-text-muted)",
      bg: "rgba(100,116,139,0.1)",
    };

  if (type === "c13") {
    // Chao Phraya Dam thresholds (m3/s)
    if (dischargeM3s < 1500) {
      return {
        label: "ระดับปกติ (รับน้ำได้)",
        color: "var(--color-low)",
        bg: "rgba(45,125,70,0.12)",
      };
    }
    if (dischargeM3s <= 2000) {
      return {
        label: "เฝ้าระวังพื้นที่ลุ่มต่ำนอกคัน",
        color: "var(--color-watch)",
        bg: "rgba(180,83,9,0.12)",
      };
    }
    if (dischargeM3s <= 2500) {
      return {
        label: "วิกฤต! น้ำเริ่มกระทบนนทบุรี-ปทุมฯ",
        color: "var(--color-high)",
        bg: "rgba(194,65,12,0.12)",
      };
    }
    return {
      label: "วิกฤตรุนแรง! เสี่ยงท่วมเป็นวงกว้าง",
      color: "var(--color-severe)",
      bg: "rgba(185,28,28,0.15)",
    };
  } else {
    // C.2 Nakhon Sawan thresholds (m3/s)
    if (dischargeM3s < 1500) {
      return {
        label: "มวลน้ำปกติ",
        color: "var(--color-low)",
        bg: "rgba(45,125,70,0.12)",
      };
    }
    if (dischargeM3s <= 2000) {
      return {
        label: "มวลน้ำปานกลาง",
        color: "var(--color-watch)",
        bg: "rgba(180,83,9,0.12)",
      };
    }
    if (dischargeM3s <= 2500) {
      return {
        label: "มวลน้ำเหนือมาก (เฝ้าระวัง)",
        color: "var(--color-high)",
        bg: "rgba(194,65,12,0.12)",
      };
    }
    return {
      label: "มวลน้ำเหนือก้อนใหญ่มาก!",
      color: "var(--color-severe)",
      bg: "rgba(185,28,28,0.15)",
    };
  }
}

export function NorthernRunoffCard({ data }: NorthernRunoffCardProps) {
  if (!data) return null;

  const { c2NakhonSawan, c13ChaoPhrayaDam, corridor } = data;
  const c2Status = getDischargeStatus(
    c2NakhonSawan?.dischargeM3s ?? null,
    "c2",
  );
  const c13Status = getDischargeStatus(
    c13ChaoPhrayaDam?.dischargeM3s ?? null,
    "c13",
  );

  return (
    <div className="card" style={{ marginBottom: "16px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "14px",
        }}
      >
        <span style={{ fontSize: "1.2rem" }}>🌊</span>
        <div>
          <h2
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              margin: 0,
              color: "var(--color-text-primary)",
            }}
          >
            สถานการณ์น้ำเหนือมุ่งสู่ภาคกลาง
          </h2>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              margin: "2px 0 0 0",
            }}
          >
            ติดตามจุดชี้ขาดสำคัญ: นครสวรรค์ · เขื่อนเจ้าพระยา · ลำน้ำรอบบ้าน
          </p>
        </div>
      </div>

      {/* 2 Key upstream floodgates / nodes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginBottom: "16px",
        }}
      >
        {/* C.2 Nakhon Sawan */}
        <div
          style={{
            background: "var(--color-surface-raised, rgba(255,255,255,0.03))",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            padding: "10px",
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--color-text-muted)",
              marginBottom: "4px",
            }}
          >
            📍 น้ำไหลผ่านนครสวรรค์ (C.2)
          </div>
          <div
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            {c2NakhonSawan?.dischargeM3s
              ? c2NakhonSawan.dischargeM3s.toLocaleString()
              : "—"}{" "}
            <span style={{ fontSize: "0.7rem", fontWeight: 400 }}>
              ลบ.ม./วินาที
            </span>
          </div>
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--color-text-secondary)",
              marginTop: "2px",
            }}
          >
            ระดับน้ำ: {c2NakhonSawan?.waterLevelM.toFixed(2)} ม.รทก.
          </div>
          <div
            style={{
              display: "inline-block",
              marginTop: "6px",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "0.68rem",
              fontWeight: 600,
              color: c2Status.color,
              background: c2Status.bg,
            }}
          >
            {c2Status.label}
          </div>
        </div>

        {/* C.13 Chao Phraya Dam */}
        <div
          style={{
            background: "var(--color-surface-raised, rgba(255,255,255,0.03))",
            border: "1px solid var(--color-border)",
            borderRadius: "8px",
            padding: "10px",
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--color-text-muted)",
              marginBottom: "4px",
            }}
          >
            🚪 ระบายน้ำเขื่อนเจ้าพระยา (C.13)
          </div>
          <div
            style={{
              fontSize: "1.1rem",
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            {c13ChaoPhrayaDam?.dischargeM3s
              ? c13ChaoPhrayaDam.dischargeM3s.toLocaleString()
              : "—"}{" "}
            <span style={{ fontSize: "0.7rem", fontWeight: 400 }}>
              ลบ.ม./วินาที
            </span>
          </div>
          <div
            style={{
              fontSize: "0.72rem",
              color: "var(--color-text-secondary)",
              marginTop: "2px",
            }}
          >
            ท้ายเขื่อน: {c13ChaoPhrayaDam?.waterLevelM.toFixed(2)} ม.รทก.
          </div>
          <div
            style={{
              display: "inline-block",
              marginTop: "6px",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: "0.68rem",
              fontWeight: 600,
              color: c13Status.color,
              background: c13Status.bg,
            }}
          >
            {c13Status.label}
          </div>
        </div>
      </div>

      {/* 3-Station Corridor: Upstream, Nearest, Downstream */}
      <div>
        <div
          style={{
            fontSize: "0.78rem",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>🧭 สถานีวัดน้ำ 3 ตอนเทียบกับบ้านคุณ</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* 1. Upstream */}
          <StationCorridorRow
            icon="⬆️"
            tag="เหนือบ้าน (น้ำกำลังมา)"
            tagColor="var(--color-accent)"
            station={corridor.upstream}
            hint="ต้นน้ำที่จะไหลผ่านบ้านคุณ"
          />

          {/* 2. Nearest */}
          <StationCorridorRow
            icon="🏠"
            tag="ใกล้บ้านที่สุด"
            tagColor="var(--color-watch)"
            station={corridor.nearest}
            isHighlighted
          />

          {/* 3. Downstream */}
          <StationCorridorRow
            icon="⬇️"
            tag="ใต้บ้าน (การระบายออก)"
            tagColor="var(--color-low)"
            station={corridor.downstream}
            hint="น้ำระบายสู่ทะเลอ่าวไทย"
          />
        </div>
      </div>
    </div>
  );
}

function StationCorridorRow({
  icon,
  tag,
  tagColor,
  station,
  hint,
  isHighlighted = false,
}: {
  icon: string;
  tag: string;
  tagColor: string;
  station: KeyRiverStation | null;
  hint?: string;
  isHighlighted?: boolean;
}) {
  if (!station) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 10px",
          background: "var(--color-surface)",
          border: "1px dashed var(--color-border)",
          borderRadius: "6px",
          fontSize: "0.75rem",
          color: "var(--color-text-muted)",
        }}
      >
        <span>
          {icon} {tag}: ไม่มีสถานีในระยะตรวจวัด
        </span>
      </div>
    );
  }

  const isOverflow = station.diffBankText?.includes("ล้น");

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 10px",
        background: isHighlighted
          ? "rgba(29, 90, 168, 0.08)"
          : "var(--color-surface)",
        border: `1px solid ${isHighlighted ? "rgba(29, 90, 168, 0.3)" : "var(--color-border)"}`,
        borderRadius: "6px",
      }}
    >
      <div style={{ flex: 1, minWidth: 0, paddingRight: "8px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "0.8rem" }}>{icon}</span>
          <span
            style={{
              fontSize: "0.68rem",
              fontWeight: 700,
              color: tagColor,
              textTransform: "uppercase",
            }}
          >
            {tag}
          </span>
          {station.distanceKm !== undefined && (
            <span
              style={{ fontSize: "0.68rem", color: "var(--color-text-muted)" }}
            >
              ({station.distanceKm} กม.)
            </span>
          )}
          {hint && (
            <span
              style={{ fontSize: "0.68rem", color: "var(--color-text-muted)" }}
            >
              • {hint}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: "0.82rem",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            marginTop: "2px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {station.stationName}
          {station.province ? ` · ${station.province}` : ""}
        </div>
      </div>

      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div
          style={{
            fontSize: "0.88rem",
            fontWeight: 700,
            color: "var(--color-text-primary)",
          }}
        >
          {station.waterLevelM.toFixed(2)}{" "}
          <span
            style={{
              fontSize: "0.7rem",
              fontWeight: 400,
              color: "var(--color-text-muted)",
            }}
          >
            ม.รทก.
          </span>
        </div>
        {station.diffBankM !== null && (
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              color: isOverflow
                ? "var(--color-severe)"
                : "var(--color-text-secondary)",
            }}
          >
            {isOverflow ? "⚠️ ล้นตลิ่ง " : "ต่ำกว่าตลิ่ง "}
            {Math.abs(station.diffBankM).toFixed(2)} ม.
          </div>
        )}
      </div>
    </div>
  );
}
