"use client";

import { useState } from "react";

interface FloodTriggerFactorsCardProps {
  c13Discharge?: number | null;
  c2Discharge?: number | null;
  rain24hMm?: number | null;
  reservoirPercent?: number | null;
  elevationMarginM?: number | null;
}

type TriggerFactor = {
  id: string;
  icon: string;
  name: string;
  subtitle: string;
  criticalThreshold: string;
  currentValue: string;
  status: "safe" | "watch" | "critical" | "unknown";
  statusText: string;
  statusColor: string;
  impactExplanation: string;
};

export function FloodTriggerFactorsCard({
  c13Discharge,
  c2Discharge,
  rain24hMm,
  reservoirPercent,
  elevationMarginM,
}: FloodTriggerFactorsCardProps) {
  const [expanded, setExpanded] = useState(true);

  // 1. C.13 Status (Chao Phraya Dam Release) - Strictly check null
  const c13Status: "safe" | "watch" | "critical" | "unknown" =
    c13Discharge === null || c13Discharge === undefined
      ? "unknown"
      : c13Discharge >= 2700
        ? "critical"
        : c13Discharge >= 2000
          ? "watch"
          : "safe";

  // 2. Local Heavy Rain Status (24h)
  const rainStatus: "safe" | "watch" | "critical" | "unknown" =
    rain24hMm === null || rain24hMm === undefined
      ? "unknown"
      : rain24hMm >= 100
        ? "critical"
        : rain24hMm >= 35
          ? "watch"
          : "safe";

  // 3. Elevation Margin Status (Ground vs Water Level)
  const marginStatus: "safe" | "watch" | "critical" | "unknown" =
    elevationMarginM === null || elevationMarginM === undefined
      ? "unknown"
      : elevationMarginM <= 0.3
        ? "critical"
        : elevationMarginM <= 1.5
          ? "watch"
          : "safe";

  // 4. C.2 Runoff Status (Nakhon Sawan)
  const c2Status: "safe" | "watch" | "critical" | "unknown" =
    c2Discharge === null || c2Discharge === undefined
      ? "unknown"
      : c2Discharge >= 3500
        ? "critical"
        : c2Discharge >= 2500
          ? "watch"
          : "safe";

  // 5. Dam Storage Status
  const damStatus: "safe" | "watch" | "critical" | "unknown" =
    reservoirPercent === null || reservoirPercent === undefined
      ? "unknown"
      : reservoirPercent >= 90
        ? "critical"
        : reservoirPercent >= 80
          ? "watch"
          : "safe";

  const factors: TriggerFactor[] = [
    {
      id: "c13",
      icon: "🌊",
      name: "เขื่อนเจ้าพระยาระบายน้ำวิกฤต (C.13)",
      subtitle: "หัวใจหลักชี้ชะตาน้ำล้นตลิ่งภาคกลาง",
      criticalThreshold: "> 2,700 – 3,500 ลบ.ม./วินาที",
      currentValue:
        c13Discharge !== null && c13Discharge !== undefined
          ? `${c13Discharge.toLocaleString()} ลบ.ม./วินาที`
          : "ไม่มีข้อมูลตรวจวัด",
      status: c13Status,
      statusText:
        c13Status === "critical"
          ? "🚨 วิกฤตเกินเกณฑ์"
          : c13Status === "watch"
            ? "⚠️ ระดับเฝ้าระวัง"
            : c13Status === "safe"
              ? "🟢 ปลอดภัย"
              : "⚪ ไม่มีข้อมูลสถานี",
      statusColor:
        c13Status === "critical"
          ? "var(--color-severe)"
          : c13Status === "watch"
            ? "var(--color-watch)"
            : c13Status === "safe"
              ? "var(--color-low)"
              : "var(--color-text-muted)",
      impactExplanation:
        "หากระบายเกิน 2,700 ลบ.ม./วิ พื้นที่นอกคันกั้นน้ำจะเริ่มท่วม และหากแตะ 3,500 ลบ.ม./วิ มวลน้ำจะเอ่อล้นเข้าท่วมพื้นที่ลุ่มต่ำ ชัยนาท สิงห์บุรี อ่างทอง อยุธยา ปทุมฯ นนทบุรี กทม.",
    },
    {
      id: "rain",
      icon: "🌧️",
      name: "ฝนตกหนักแช่ขังในพื้นที่ (Local Rain)",
      subtitle: "น้ำรอระบายและน้ำท่วมขังฉับพลัน",
      criticalThreshold: "ฝนสะสม > 100 – 150 มม./24 ชม.",
      currentValue:
        rain24hMm !== null && rain24hMm !== undefined
          ? `${rain24hMm.toFixed(1)} มม. (24 ชม.)`
          : "ไม่มีข้อมูลตรวจวัด",
      status: rainStatus,
      statusText:
        rainStatus === "critical"
          ? "🚨 ฝนตกหนักวิกฤต"
          : rainStatus === "watch"
            ? "⚠️ มีฝนปานกลาง"
            : rainStatus === "safe"
              ? "🟢 ฝนน้อย/ไม่มี"
              : "⚪ ไม่มีข้อมูลสถานี",
      statusColor:
        rainStatus === "critical"
          ? "var(--color-severe)"
          : rainStatus === "watch"
            ? "var(--color-watch)"
            : rainStatus === "safe"
              ? "var(--color-low)"
              : "var(--color-text-muted)",
      impactExplanation:
        "แม้แม่น้ำจะไม่ล้นตลิ่ง แต่ถ้ามีฝนตกหนักเกิน 100 มม. แช่ขังในพื้นที่ ท่อระบายน้ำเมืองและเครื่องสูบน้ำจะระบายไม่ทัน ทำให้เกิดน้ำท่วมขังถึงพื้นบ้านทันที",
    },
    {
      id: "margin",
      icon: "🏠",
      name: "ระดับผิวน้ำแม่น้ำสูงเกินระดับพื้นบ้าน",
      subtitle: "ความสูงต่างระหว่างผิวน้ำกับพื้นบ้านคุณ",
      criticalThreshold: "ระยะสูงกว่าน้ำ ≤ 0.00 ม. (น้ำสูงกว่าพื้น)",
      currentValue:
        elevationMarginM !== null && elevationMarginM !== undefined
          ? elevationMarginM > 0
            ? `+${elevationMarginM.toFixed(2)} ม.`
            : `${elevationMarginM.toFixed(2)} ม.`
          : "ไม่มีข้อมูลความสูง",
      status: marginStatus,
      statusText:
        marginStatus === "critical"
          ? "🚨 ผิวน้ำสูงปริ่ม/ท่วมพื้น"
          : marginStatus === "watch"
            ? "⚠️ ระยะปลอดภัยแคบ"
            : marginStatus === "safe"
              ? "🟢 พื้นบ้านสูงกว่าผิวน้ำ"
              : "⚪ ไม่มีข้อมูล",
      statusColor:
        marginStatus === "critical"
          ? "var(--color-severe)"
          : marginStatus === "watch"
            ? "var(--color-watch)"
            : marginStatus === "safe"
              ? "var(--color-low)"
              : "var(--color-text-muted)",
      impactExplanation:
        "หากผิวน้ำในแม่น้ำเจ้าพระยาใกล้บ้านคุณสูงกว่าระดับพื้นดินบ้าน (Margin ติดลบ) น้ำจะดันย้อนท่อระบายน้ำและไหลเข้าบ้านโดยตรงหากไม่มีแนวคันกั้นน้ำส่วนตัว",
    },
    {
      id: "c2",
      icon: "🏔️",
      name: "น้ำหลากจากนครสวรรค์ (C.2)",
      subtitle: "มวลน้ำเหนือก่อนไหลเข้าสู่เขื่อนเจ้าพระยา",
      criticalThreshold: "> 3,500 – 4,000 ลบ.ม./วินาที",
      currentValue:
        c2Discharge !== null && c2Discharge !== undefined
          ? `${c2Discharge.toLocaleString()} ลบ.ม./วินาที`
          : "ไม่มีข้อมูลตรวจวัด",
      status: c2Status,
      statusText:
        c2Status === "critical"
          ? "🚨 มวลน้ำเหนือวิกฤต"
          : c2Status === "watch"
            ? "⚠️ น้ำหลากปานกลาง"
            : c2Status === "safe"
              ? "🟢 ปลอดภัย"
              : "⚪ ไม่มีข้อมูลสถานี",
      statusColor:
        c2Status === "critical"
          ? "var(--color-severe)"
          : c2Status === "watch"
            ? "var(--color-watch)"
            : c2Status === "safe"
              ? "var(--color-low)"
              : "var(--color-text-muted)",
      impactExplanation:
        "เป็นสัญญาณเตือนภัยล่วงหน้า 2–4 วัน ถ้าน้ำผ่านนครสวรรค์เกิน 3,500 ลบ.ม./วิ เขื่อนเจ้าพระยาจะถูกบีบให้ต้องเร่งระบายน้ำเพิ่มขึ้นอย่างหลีกเลี่ยงไม่ได้",
    },
    {
      id: "dam",
      icon: "🏞️",
      name: "ปริมาตรน้ำเขื่อนหลักลุ่มเจ้าพระยา",
      subtitle: "เขื่อนภูมิพล สิริกิติ์ แควน้อย ป่าสักฯ",
      criticalThreshold: "กักเก็บเกิน > 85% – 90% ของความจุ",
      currentValue:
        reservoirPercent !== null && reservoirPercent !== undefined
          ? `${reservoirPercent.toFixed(1)}% ของความจุ (เฉพาะเขื่อนที่รายงาน)`
          : "ไม่มีข้อมูลตรวจวัด",
      status: damStatus,
      statusText:
        damStatus === "critical"
          ? "🚨 เขื่อนเต็มความจุ"
          : damStatus === "watch"
            ? "⚠️ กักเก็บค่อนข้างสูง"
            : damStatus === "safe"
              ? "🟢 ยังรองรับน้ำได้"
              : "⚪ ไม่มีข้อมูลเขื่อน",
      statusColor:
        damStatus === "critical"
          ? "var(--color-severe)"
          : damStatus === "watch"
            ? "var(--color-watch)"
            : damStatus === "safe"
              ? "var(--color-low)"
              : "var(--color-text-muted)",
      impactExplanation:
        "เมื่อเขื่อนหลักเต็มความจุ เขื่อนจะไม่สามารถช่วยหน่วงน้ำเหนือได้อีกต่อไป และจำเป็นต้องระบายน้ำออกตามธรรมชาติ ทำให้มวลน้ำทั้งหมดไหลเทลงมาพร้อมกัน",
    },
  ];

  const criticalCount = factors.filter((f) => f.status === "critical").length;
  const watchCount = factors.filter((f) => f.status === "watch").length;
  const unknownCount = factors.filter((f) => f.status === "unknown").length;

  return (
    <div
      className="card"
      style={{
        marginBottom: "16px",
        background: "var(--color-surface)",
        border:
          criticalCount >= 2
            ? "2px solid var(--color-severe)"
            : criticalCount === 1
              ? "1px solid var(--color-high)"
              : "1px solid var(--color-border)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      {/* ── Card Header ────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "12px",
          gap: "8px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "1.1rem" }}>🚨</span>
            <h2
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                margin: 0,
              }}
            >
              สัญญาณวิกฤต: ปัจจัยที่ทำให้น้ำท่วมถึงบ้านคุณ
            </h2>
          </div>
          <p
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-secondary)",
              margin: "4px 0 0 0",
              lineHeight: 1.5,
            }}
          >
            หากปัจจัยเหล่านี้เกิดขึ้นพร้อมกัน
            มวลน้ำจะมีแนวโน้มเอ่อล้นเข้าท่วมพื้นที่ของคุณแน่นอน
          </p>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--color-text-muted)",
            fontSize: "0.8rem",
            cursor: "pointer",
            padding: "4px 8px",
          }}
          aria-label="ย่อขยาย"
        >
          {expanded ? "ย่อ ▲" : "ดูรายละเอียด ▼"}
        </button>
      </div>

      {/* ── Summary Gauge ──────────────────────────────────────── */}
      <div
        style={{
          background:
            criticalCount >= 2
              ? "rgba(220, 38, 38, 0.1)"
              : criticalCount === 1
                ? "rgba(234, 88, 12, 0.08)"
                : unknownCount === 5
                  ? "rgba(148, 163, 184, 0.08)"
                  : "rgba(16, 185, 129, 0.08)",
          borderRadius: "8px",
          padding: "10px 12px",
          marginBottom: "14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
          border:
            criticalCount >= 1
              ? "1px solid rgba(220, 38, 38, 0.2)"
              : unknownCount === 5
                ? "1px solid rgba(148, 163, 184, 0.2)"
                : "1px solid rgba(16, 185, 129, 0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.2rem" }}>
            {criticalCount >= 2
              ? "🔴"
              : criticalCount === 1
                ? "🟠"
                : unknownCount === 5
                  ? "⚪"
                  : "🟢"}
          </span>
          <div>
            <div
              style={{
                fontSize: "0.82rem",
                fontWeight: 700,
                color:
                  criticalCount >= 2
                    ? "var(--color-severe)"
                    : criticalCount === 1
                      ? "var(--color-high)"
                      : unknownCount === 5
                        ? "var(--color-text-muted)"
                        : "var(--color-low)",
              }}
            >
              {criticalCount >= 2
                ? `เข้าเกณฑ์อันตรายแล้ว ${criticalCount} จาก 5 ปัจจัย!`
                : criticalCount === 1
                  ? `เข้าเกณฑ์อันตราย 1 ปัจจัย (เฝ้าระวัง ${watchCount}${unknownCount > 0 ? `, ไม่มีข้อมูล ${unknownCount}` : ""})`
                  : unknownCount === 5
                    ? "รอข้อมูลตรวจวัดจากสถานี (ไม่มีข้อมูลล่าสุด)"
                    : `ปัจจุบันเข้าเกณฑ์อันตราย 0 จาก 5 ปัจจัย${unknownCount > 0 ? ` (ไม่มีข้อมูล ${unknownCount} ปัจจัย)` : " (ยังปลอดภัย)"}`}
            </div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--color-text-secondary)",
              }}
            >
              {criticalCount >= 1
                ? "มีปัจจัยเสี่ยงเริ่มตรงตามเงื่อนไข ควรติดตามระดับน้ำอย่างใกล้ชิด"
                : unknownCount > 0
                  ? `มี ${unknownCount} ปัจจัยที่ยังไม่มีรายงานตรวจวัดล่าสุดจากสถานี/หน่วยงาน`
                  : "สถานการณ์น้ำขณะนี้ยังอยู่ในเกณฑ์ที่ระบบชลประทานควบคุมได้"}
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: "0.72rem",
            fontWeight: 600,
            padding: "4px 8px",
            borderRadius: "4px",
            background: "var(--color-surface)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border)",
          }}
        >
          เฝ้าระวัง {watchCount} / วิกฤต {criticalCount}
          {unknownCount > 0 && ` / ไม่มีข้อมูล ${unknownCount}`}
        </div>
      </div>

      {/* ── Factors List ───────────────────────────────────────── */}
      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {factors.map((factor) => (
            <div
              key={factor.id}
              style={{
                background:
                  factor.status === "critical"
                    ? "rgba(220, 38, 38, 0.04)"
                    : "var(--color-surface)",
                border:
                  factor.status === "critical"
                    ? "1px solid rgba(220, 38, 38, 0.3)"
                    : "1px solid var(--color-border)",
                borderRadius: "8px",
                padding: "10px 12px",
              }}
            >
              {/* Factor Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "8px",
                  marginBottom: "6px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <span style={{ fontSize: "1rem" }}>{factor.icon}</span>
                  <div>
                    <span
                      style={{
                        fontSize: "0.84rem",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {factor.name}
                    </span>
                    <div
                      style={{
                        fontSize: "0.68rem",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {factor.subtitle}
                    </div>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    color: factor.statusColor,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background:
                      factor.status === "critical"
                        ? "rgba(220, 38, 38, 0.12)"
                        : factor.status === "watch"
                          ? "rgba(234, 88, 12, 0.12)"
                          : factor.status === "safe"
                            ? "rgba(16, 185, 129, 0.12)"
                            : "rgba(148, 163, 184, 0.15)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {factor.statusText}
                </span>
              </div>

              {/* Threshold vs Current Comparison */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  background: "rgba(0, 0, 0, 0.02)",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  marginBottom: "6px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    🎯 เกณฑ์อันตรายที่ทำให้น้ำท่วม:
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--color-severe)",
                    }}
                  >
                    {factor.criticalThreshold}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    📡 ตรวจวัดจริงขณะนี้:
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: factor.statusColor,
                    }}
                  >
                    {factor.currentValue}
                  </div>
                </div>
              </div>

              {/* Impact Explanation */}
              <div
                style={{
                  fontSize: "0.7rem",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.4,
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                  }}
                >
                  ผลกระทบ:{" "}
                </span>
                {factor.impactExplanation}
              </div>
            </div>
          ))}

          {/* ── 3-Factors Disaster Formula Banner ──────────────────── */}
          <div
            style={{
              background: "rgba(29, 90, 168, 0.05)",
              border: "1px dashed rgba(29, 90, 168, 0.3)",
              borderRadius: "8px",
              padding: "10px 12px",
              marginTop: "4px",
            }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 700,
                color: "var(--color-accent)",
                marginBottom: "4px",
              }}
            >
              💡 กฎ 3 ปัจจัยมหาอุทกภัย (จุดแตกหักที่บ้านคุณจะท่วมแน่นอน):
            </div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--color-text-secondary)",
                lineHeight: 1.5,
              }}
            >
              น้ำท่วมใหญ่ในภาคกลางจะเกิดขึ้นเมื่อเกิด{" "}
              <strong>3 ปัจจัยพร้อมกัน</strong>: <strong>น้ำเหนือ</strong>{" "}
              (เขื่อนปล่อยเกิน 2,700–3,500 ลบ.ม./วิ) + <strong>น้ำฝน</strong>{" "}
              (ร่องมรสุมตกซ้ำในพื้นที่เกิน 100 มม.) + <strong>น้ำหนุน</strong>{" "}
              (น้ำทะเลอ่าวไทยหนุนสูงปิดทางน้ำ)
              หากครบทั้งสามปัจจัยในสัปดาห์เดียวกัน
              มวลน้ำจะเอ่อล้นเข้าท่วมแน่นอนครับ
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
