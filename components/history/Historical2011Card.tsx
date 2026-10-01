"use client";

import type { HistoricalComparison } from "@/lib/types/domain";

interface Historical2011CardProps {
  comparison: HistoricalComparison | null;
  currentLevelM?: number;
  c2Discharge?: number | null;
  c13Discharge?: number | null;
  reservoirStoragePercent?: number | null;
}

type ChecklistItem = {
  title: string;
  year2554Text: string;
  year2554Status: "ท่วม" | "วิกฤต";
  currentYearText: string;
  currentYearStatus: "ยังไม่ท่วม" | "เฝ้าระวัง" | "ท่วม" | "วิกฤต" | "ไม่มีข้อมูล";
  diffNote: string;
};

export function Historical2011Card({
  comparison,
  currentLevelM,
  c2Discharge,
  c13Discharge,
  reservoirStoragePercent,
}: Historical2011CardProps) {
  const currentLevel = currentLevelM ?? comparison?.currentLevelM ?? null;
  const peak2554 = comparison?.referencePeakLevelM ?? 2.72;
  const diffLevel =
    currentLevel !== null
      ? Math.round((peak2554 - currentLevel) * 100) / 100
      : null;

  // Active metrics with real-time values strictly (NO fake defaults)
  const activeC13 = c13Discharge ?? null;
  const activeC2 = c2Discharge ?? null;
  const activeDamStorage = reservoirStoragePercent ?? null;

  // Check statuses
  const c13Status =
    activeC13 === null
      ? "ไม่มีข้อมูล"
      : activeC13 >= 3000
        ? "ท่วม"
        : activeC13 >= 2000
          ? "เฝ้าระวัง"
          : "ยังไม่ท่วม";

  const c2Status =
    activeC2 === null
      ? "ไม่มีข้อมูล"
      : activeC2 >= 4000
        ? "ท่วม"
        : activeC2 >= 2500
          ? "เฝ้าระวัง"
          : "ยังไม่ท่วม";

  const damStatus =
    activeDamStorage === null
      ? "ไม่มีข้อมูล"
      : activeDamStorage >= 95
        ? "วิกฤต"
        : activeDamStorage >= 80
          ? "เฝ้าระวัง"
          : "ยังไม่ท่วม";

  const levelStatus =
    currentLevel === null || diffLevel === null
      ? "ไม่มีข้อมูล"
      : diffLevel <= 0
        ? "ท่วม"
        : diffLevel < 0.2
          ? "เฝ้าระวัง"
          : "ยังไม่ท่วม";

  const checklist: ChecklistItem[] = [
    {
      title: "การระบายน้ำเขื่อนเจ้าพระยา (C.13)",
      year2554Text: "3,650 ลบ.ม./วินาที",
      year2554Status: "ท่วม",
      currentYearText:
        activeC13 !== null
          ? `${activeC13.toLocaleString()} ลบ.ม./วินาที`
          : "ไม่มีข้อมูลตรวจวัด",
      currentYearStatus: c13Status,
      diffNote:
        activeC13 !== null
          ? `ต่ำกว่าปี 54 อยู่ ${(3650 - activeC13).toLocaleString()} ลบ.ม./วินาที`
          : "ยังไม่มีรายงานข้อมูลอัตราการระบายน้ำล่าสุดจากสถานี C.13",
    },
    {
      title: "น้ำไหลผ่านนครสวรรค์ (C.2)",
      year2554Text: "4,686 ลบ.ม./วินาที",
      year2554Status: "ท่วม",
      currentYearText:
        activeC2 !== null
          ? `${activeC2.toLocaleString()} ลบ.ม./วินาที`
          : "ไม่มีข้อมูลตรวจวัด",
      currentYearStatus: c2Status,
      diffNote:
        activeC2 !== null
          ? `คิดเป็น ~${Math.round((activeC2 / 4686) * 100)}% ของมวลน้ำปี 54`
          : "ยังไม่มีรายงานข้อมูลอัตราการไหลผ่านล่าสุดจากสถานี C.2",
    },
    {
      title: "น้ำกักเก็บใน 4 เขื่อนหลักลุ่มเจ้าพระยา",
      year2554Text: "เกิน 100% (เขื่อนล้น)",
      year2554Status: "วิกฤต",
      currentYearText:
        activeDamStorage !== null
          ? `${activeDamStorage.toFixed(1)}% ของความจุ (เฉพาะเขื่อนที่รายงาน)`
          : "ไม่มีข้อมูลตรวจวัด",
      currentYearStatus: damStatus,
      diffNote:
        activeDamStorage !== null
          ? `ยังเหลือพื้นที่รับน้ำได้อีก ${(100 - activeDamStorage).toFixed(1)}% (เฉพาะเขื่อนที่รายงาน)`
          : "ยังไม่มีรายงานข้อมูลปริมาตรน้ำกักเก็บล่าสุดจากเขื่อนในลุ่มน้ำ",
    },
    {
      title: "ระดับน้ำแม่น้ำเจ้าพระยา (ท่าน้ำนนทบุรี)",
      year2554Text: `${peak2554.toFixed(2)} ม.รทก. (ยอดสูงสุด)`,
      year2554Status: "ท่วม",
      currentYearText:
        currentLevel !== null
          ? `${currentLevel.toFixed(2)} ม.รทก.`
          : "ไม่มีข้อมูลตรวจวัด",
      currentYearStatus: levelStatus,
      diffNote:
        diffLevel !== null
          ? diffLevel > 0
            ? `ต่ำกว่ายอดสูงสุดปี 54 อยู่ ${diffLevel.toFixed(2)} เมตร`
            : `สูงกว่ายอดสูงสุดปี 54 อยู่ ${Math.abs(diffLevel).toFixed(2)} เมตร`
          : "ยังไม่มีข้อมูลระดับน้ำสถานีใกล้เคียงในขณะนี้",
    },
  ];

  function getBadgeStyle(status: string) {
    if (status === "ไม่มีข้อมูล") {
      return {
        bg: "rgba(148, 163, 184, 0.15)",
        color: "var(--color-text-muted)",
        icon: "⚪",
      };
    }
    if (status === "ท่วม" || status === "วิกฤต") {
      return {
        bg: "rgba(185, 28, 28, 0.12)",
        color: "var(--color-severe)",
        icon: "❌",
      };
    }
    if (status === "เฝ้าระวัง") {
      return {
        bg: "rgba(180, 83, 9, 0.12)",
        color: "var(--color-watch)",
        icon: "⚠️",
      };
    }
    return {
      bg: "rgba(45, 125, 70, 0.12)",
      color: "var(--color-low)",
      icon: "✅",
    };
  }

  return (
    <div className="card">
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "12px",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "0.95rem",
              fontWeight: 700,
              margin: 0,
              color: "var(--color-text-primary)",
            }}
          >
            📋 เช็กลิสต์เทียบกับมหาอุทกภัยปี 2554
          </h2>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-muted)",
              margin: "2px 0 0 0",
            }}
          >
            เทียบ 4 ตัวชี้วัดวิกฤตหลัก: ปี 2554 vs สภาพปัจจุบัน (ปี 2569)
          </p>
        </div>
        <div
          style={{
            padding: "4px 8px",
            borderRadius: "6px",
            fontSize: "0.72rem",
            fontWeight: 700,
            background: checklist.some((i) => i.currentYearStatus === "ท่วม" || i.currentYearStatus === "วิกฤต")
              ? "rgba(185, 28, 28, 0.12)"
              : checklist.some((i) => i.currentYearStatus === "เฝ้าระวัง")
                ? "rgba(180, 83, 9, 0.12)"
                : checklist.every((i) => i.currentYearStatus === "ไม่มีข้อมูล")
                  ? "rgba(148, 163, 184, 0.15)"
                  : "rgba(45, 125, 70, 0.12)",
            color: checklist.some((i) => i.currentYearStatus === "ท่วม" || i.currentYearStatus === "วิกฤต")
              ? "var(--color-severe)"
              : checklist.some((i) => i.currentYearStatus === "เฝ้าระวัง")
                ? "var(--color-watch)"
                : checklist.every((i) => i.currentYearStatus === "ไม่มีข้อมูล")
                  ? "var(--color-text-muted)"
                  : "var(--color-low)",
            whiteSpace: "nowrap",
          }}
        >
          {checklist.some((i) => i.currentYearStatus === "ท่วม" || i.currentYearStatus === "วิกฤต")
            ? "🚨 มีสัญญาณวิกฤต"
            : checklist.some((i) => i.currentYearStatus === "เฝ้าระวัง")
              ? "⚠️ มีจุดเฝ้าระวัง"
              : checklist.every((i) => i.currentYearStatus === "ไม่มีข้อมูล")
                ? "⚪ รอข้อมูลตรวจวัด"
                : "✓ ยังไม่วิกฤตเท่าปี 54"}
        </div>
      </div>

      {/* Checklist items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {checklist.map((item, idx) => {
          const badge54 = getBadgeStyle(item.year2554Status);
          const badgeNow = getBadgeStyle(item.currentYearStatus);

          return (
            <div
              key={idx}
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "8px",
                padding: "10px 12px",
              }}
            >
              {/* Title */}
              <div
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                  marginBottom: "6px",
                }}
              >
                {item.title}
              </div>

              {/* 2-Column Comparison */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  fontSize: "0.75rem",
                  paddingBottom: "6px",
                  borderBottom: "1px dashed var(--color-border)",
                }}
              >
                {/* Year 2554 */}
                <div
                  style={{
                    background: "rgba(0,0,0,0.02)",
                    padding: "6px 8px",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      color: "var(--color-text-muted)",
                      fontSize: "0.68rem",
                    }}
                  >
                    🔴 ปี 2554 (มหาอุทกภัย)
                  </div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: "var(--color-text-primary)",
                      margin: "2px 0",
                    }}
                  >
                    {item.year2554Text}
                  </div>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      color: badge54.color,
                    }}
                  >
                    {badge54.icon} {item.year2554Status}
                  </span>
                </div>

                {/* Year 2569 / Current */}
                <div
                  style={{
                    background: "rgba(45, 125, 70, 0.04)",
                    padding: "6px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(45, 125, 70, 0.15)",
                  }}
                >
                  <div
                    style={{
                      color: "var(--color-text-muted)",
                      fontSize: "0.68rem",
                    }}
                  >
                    🟢 ปัจจุบัน (ปี 2569)
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      margin: "2px 0",
                    }}
                  >
                    {item.currentYearText}
                  </div>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      color: badgeNow.color,
                    }}
                  >
                    {badgeNow.icon} {item.currentYearStatus}
                  </span>
                </div>
              </div>

              {/* Difference Note */}
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "var(--color-text-secondary)",
                  marginTop: "6px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>💡</span>
                <span>{item.diffNote}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Footer */}
      <div
        style={{
          marginTop: "12px",
          padding: "8px 12px",
          background: "rgba(29, 90, 168, 0.06)",
          border: "1px solid rgba(29, 90, 168, 0.2)",
          borderRadius: "6px",
          fontSize: "0.75rem",
          color: "var(--color-text-secondary)",
          lineHeight: 1.5,
        }}
      >
        <strong>สรุป:</strong> ตัวชี้วัดสำคัญทั้ง 4 ด้านยังห่างจากสถิติวิกฤตปี
        2554 พอสมควร
        ทั้งนี้ควรติดตามช่วงเวลาที่น้ำทะเลหนุนสูงร่วมกับฝนตกหนักในพื้นที่
      </div>
    </div>
  );
}
