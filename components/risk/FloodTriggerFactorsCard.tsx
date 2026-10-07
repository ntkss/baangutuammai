"use client";

import { useState } from "react";
import type { RiskZone, RiskLevel } from "@/lib/types/domain";
import type { EstuarineTideResult } from "@/lib/risk/tide";

interface FloodTriggerFactorsCardProps {
  // Area Model Context
  zone?: RiskZone;
  zoneLabel?: string;
  riskLevel?: RiskLevel;

  // Local Water Level vs Bank
  localWaterStationName?: string;
  localRiverName?: string;
  localWaterLevelM?: number | null;
  bankLevelM?: number | null;
  diffBankM?: number | null;
  diffBankText?: string;
  waterLevelRisk?: number | null;
  waterDistanceKm?: number | null;

  // Upstream dam discharges
  c13Discharge?: number | null;
  c2Discharge?: number | null;

  // Rainfall
  rain24hMm?: number | null;
  rainPeak1hMm?: number | null;

  // Dam storage
  reservoirPercent?: number | null;

  // Elevation Margin (Freeboard)
  elevationMarginM?: number | null;

  // Estuarine Tide
  tide?: EstuarineTideResult | null;

  // Blackspot
  blackspot?: {
    name: string;
    distanceKm: number;
    severity: "critical" | "warning" | "advisory";
  } | null;
}

type TriggerFactor = {
  id: string;
  icon: string;
  name: string;
  subtitle: string;
  currentDisplay: string;
  thresholdDisplay: string;
  status: "safe" | "watch" | "critical" | "unknown";
  statusText: string;
  statusColor: string;
  impactExplanation: string;
  isPriorityForZone?: boolean;
  meterPercent: number; // 0 to 100 for visual gauge
  safeZoneLabel: string;
  watchZoneLabel: string;
  criticalZoneLabel: string;
};

export function FloodTriggerFactorsCard({
  zone = "bangkok_urban",
  localWaterStationName,
  localRiverName,
  localWaterLevelM,
  bankLevelM,
  diffBankM,
  diffBankText,
  waterLevelRisk,
  waterDistanceKm,
  c13Discharge,
  c2Discharge,
  rain24hMm,
  rainPeak1hMm,
  reservoirPercent,
  elevationMarginM,
  tide,
  blackspot,
}: FloodTriggerFactorsCardProps) {
  const [expandedDetailId, setExpandedDetailId] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────
  // 1. Local Water Station & Bank Overflow Status
  // diffBankM: positive = below bank (safe), negative = overflow (critical)
  // ─────────────────────────────────────────────────────────────
  let localBankStatus: "safe" | "watch" | "critical" | "unknown" = "unknown";
  let localBankStatusText = "ไม่มีข้อมูล";
  let localBankStatusColor = "var(--color-text-muted)";
  let localBankCurrentVal = "ไม่มีข้อมูลตรวจวัด";
  let localBankMeter = 20;

  if (diffBankM !== null && diffBankM !== undefined) {
    if (diffBankM < 0) {
      localBankStatus = "critical";
      localBankStatusText = `ล้นตลิ่ง +${Math.abs(diffBankM).toFixed(2)} ม.`;
      localBankStatusColor = "var(--color-severe)";
      localBankMeter = Math.min(100, 80 + Math.abs(diffBankM) * 15);
    } else if (diffBankM < 0.5) {
      localBankStatus = "watch";
      localBankStatusText = `ปริ่มตลิ่ง (${diffBankM.toFixed(2)} ม.)`;
      localBankStatusColor = "var(--color-watch)";
      localBankMeter = 60 + ((0.5 - diffBankM) / 0.5) * 15;
    } else {
      localBankStatus = "safe";
      localBankStatusText = `ต่ำกว่าตลิ่ง ${diffBankM.toFixed(2)} ม.`;
      localBankStatusColor = "var(--color-low)";
      localBankMeter = Math.max(10, 45 - Math.min(diffBankM, 3) * 10);
    }

    const waterStr =
      localWaterLevelM !== null && localWaterLevelM !== undefined
        ? `+${localWaterLevelM.toFixed(2)} ม.`
        : "";
    const bankStr =
      bankLevelM !== null && bankLevelM !== undefined
        ? ` (ตลิ่ง +${bankLevelM.toFixed(2)} ม.)`
        : "";
    const statusNote = diffBankText ? ` • ${diffBankText}` : "";
    localBankCurrentVal = `${waterStr}${bankStr}${statusNote}`.trim();
  } else if (waterLevelRisk !== null && waterLevelRisk !== undefined) {
    if (waterLevelRisk >= 0.75) {
      localBankStatus = "critical";
      localBankStatusText = "ระดับน้ำวิกฤต";
      localBankStatusColor = "var(--color-severe)";
      localBankMeter = 85;
    } else if (waterLevelRisk >= 0.5) {
      localBankStatus = "watch";
      localBankStatusText = "ระดับเฝ้าระวัง";
      localBankStatusColor = "var(--color-watch)";
      localBankMeter = 65;
    } else {
      localBankStatus = "safe";
      localBankStatusText = "ระดับปกติ";
      localBankStatusColor = "var(--color-low)";
      localBankMeter = 25;
    }
    if (localWaterLevelM !== null && localWaterLevelM !== undefined) {
      localBankCurrentVal = `+${localWaterLevelM.toFixed(2)} ม.รทก.`;
    }
  }

  const formattedRiver = localRiverName
    ? localRiverName.startsWith("คลอง") || localRiverName.startsWith("แม่น้ำ")
      ? localRiverName
      : `แม่น้ำ${localRiverName}`
    : "ลำน้ำใกล้บ้าน";

  const localBankFactor: TriggerFactor = {
    id: "local_bank",
    icon: "🌊",
    name: `ระดับน้ำ${formattedRiver}`,
    subtitle: localWaterStationName
      ? `${localWaterStationName}${waterDistanceKm ? ` (${waterDistanceKm} กม.)` : ""}`
      : "สถานีโทรมาตรใกล้บ้าน",
    currentDisplay: localBankCurrentVal,
    thresholdDisplay:
      bankLevelM !== null && bankLevelM !== undefined
        ? `เสมอสันตลิ่ง (+${bankLevelM.toFixed(2)} ม.)`
        : "ระดับเสมอสันตลิ่ง",
    status: localBankStatus,
    statusText: localBankStatusText,
    statusColor: localBankStatusColor,
    impactExplanation:
      diffBankM !== null && diffBankM !== undefined && diffBankM < 0
        ? `ระดับน้ำสูงกว่าสันตลิ่ง ${Math.abs(diffBankM).toFixed(2)} ม. มวลน้ำเอ่อดันเข้าท่อระบายน้ำและทะลักท่วมพื้นที่ลุ่มต่ำทันที`
        : "เมื่อน้ำสูงเกินสันตลิ่ง จะดันย้อนเข้าท่อระบายน้ำชุมชนโดยไม่ต้องรอน้ำเหนือหลาก",
    isPriorityForZone: true,
    meterPercent: localBankMeter,
    safeZoneLabel: "ต่ำกว่าตลิ่ง >0.5 ม.",
    watchZoneLabel: "เหลือ <0.5 ม.",
    criticalZoneLabel: "ล้นตลิ่ง",
  };

  // ─────────────────────────────────────────────────────────────
  // 2. Local Heavy Rain Status
  // ─────────────────────────────────────────────────────────────
  const isRainBurst =
    rainPeak1hMm !== null && rainPeak1hMm !== undefined && rainPeak1hMm >= 50;
  const isRainBurstWatch =
    rainPeak1hMm !== null && rainPeak1hMm !== undefined && rainPeak1hMm >= 25;

  let rainStatus: "safe" | "watch" | "critical" | "unknown" = "unknown";
  let rainMeter = 10;
  if (rain24hMm !== null && rain24hMm !== undefined) {
    if (rain24hMm >= 100 || isRainBurst) {
      rainStatus = "critical";
      rainMeter = 85;
    } else if (rain24hMm >= 35 || isRainBurstWatch) {
      rainStatus = "watch";
      rainMeter = 60 + ((rain24hMm - 35) / 65) * 15;
    } else {
      rainStatus = "safe";
      rainMeter = Math.max(10, (rain24hMm / 35) * 45);
    }
  }

  const rainFactor: TriggerFactor = {
    id: "rain",
    icon: "🌧️",
    name: "ฝนตกสะสม & ตกหนักเฉียบพลัน",
    subtitle: "น้ำรอระบาย & ขังฉับพลัน",
    currentDisplay:
      rain24hMm !== null && rain24hMm !== undefined
        ? `${rain24hMm.toFixed(1)} มม. (24 ชม.)${rainPeak1hMm ? ` • พีค ${rainPeak1hMm.toFixed(1)} มม./ชม.` : ""}`
        : "ไม่มีข้อมูล",
    thresholdDisplay: "> 100 มม. (หรือ > 50 มม./ชม.)",
    status: rainStatus,
    statusText:
      rainStatus === "critical"
        ? isRainBurst
          ? "ฝนหนักฉับพลัน"
          : "ฝนสะสมวิกฤต"
        : rainStatus === "watch"
          ? "เฝ้าระวัง"
          : rainStatus === "safe"
            ? "ปกติ"
            : "ไม่มีข้อมูล",
    statusColor:
      rainStatus === "critical"
        ? "var(--color-severe)"
        : rainStatus === "watch"
          ? "var(--color-watch)"
          : rainStatus === "safe"
            ? "var(--color-low)"
            : "var(--color-text-muted)",
    impactExplanation:
      "ฝนตกหนักเกิน 100 มม. ใน 24 ชม. หรือเกิน 50 มม./ชม. ระบบท่อระบายน้ำเมืองจะระบายไม่ทันและเอ่อท่วมผิวจราจรและพื้นบ้านทันที",
    isPriorityForZone: zone === "bangkok_urban",
    meterPercent: rainMeter,
    safeZoneLabel: "< 35 มม.",
    watchZoneLabel: "35–100 มม.",
    criticalZoneLabel: "> 100 มม.",
  };

  // ─────────────────────────────────────────────────────────────
  // 3. Elevation Margin Status (Ground vs Water Level)
  // ─────────────────────────────────────────────────────────────
  const marginStatus: "safe" | "watch" | "critical" | "unknown" =
    elevationMarginM === null || elevationMarginM === undefined
      ? "unknown"
      : elevationMarginM <= 0.3
        ? "critical"
        : elevationMarginM <= 1.5
          ? "watch"
          : "safe";

  let marginMeter = 25;
  if (elevationMarginM !== null && elevationMarginM !== undefined) {
    if (elevationMarginM <= 0.3) {
      marginMeter = 90;
    } else if (elevationMarginM <= 1.5) {
      marginMeter = 65;
    } else {
      marginMeter = Math.max(15, 45 - (elevationMarginM - 1.5) * 8);
    }
  }

  const marginFactor: TriggerFactor = {
    id: "margin",
    icon: "🏠",
    name: "ระดับผิวน้ำเทียบพื้นดินบ้าน (Freeboard)",
    subtitle: "ระยะปลอดภัยจากระดับน้ำถึงพื้นดิน",
    currentDisplay:
      elevationMarginM !== null && elevationMarginM !== undefined
        ? `${elevationMarginM > 0 ? "+" : ""}${elevationMarginM.toFixed(2)} ม.`
        : "ไม่มีข้อมูล",
    thresholdDisplay: "ผิวน้ำเสมอพื้น (ระยะ ≤ 0.3 ม.)",
    status: marginStatus,
    statusText:
      marginStatus === "critical"
        ? "ผิวน้ำเสมอพื้นดิน"
        : marginStatus === "watch"
          ? "ระยะปลอดภัยต่ำ"
          : marginStatus === "safe"
            ? "ปลอดภัย"
            : "ไม่มีข้อมูล",
    statusColor:
      marginStatus === "critical"
        ? "var(--color-severe)"
        : marginStatus === "watch"
          ? "var(--color-watch)"
          : marginStatus === "safe"
            ? "var(--color-low)"
            : "var(--color-text-muted)",
    impactExplanation:
      "เมื่อระยะห่างระหว่างระดับน้ำและพื้นดินเหลือน้อยกว่า 30 ซม. คลื่นน้ำหรือน้ำหนุนจะดันล้นเข้าตัวบ้านได้ง่าย",
    meterPercent: marginMeter,
    safeZoneLabel: "> 1.5 ม.",
    watchZoneLabel: "0.3–1.5 ม.",
    criticalZoneLabel: "≤ 0.3 ม.",
  };

  // ─────────────────────────────────────────────────────────────
  // 4. Estuarine High Tide Status
  // ─────────────────────────────────────────────────────────────
  let tideStatus: "safe" | "watch" | "critical" | "unknown" = "unknown";
  let tideStatusText = "ไม่มีข้อมูล";
  let tideStatusColor = "var(--color-text-muted)";
  let tideCurrentVal = "ไม่มีข้อมูล";
  let tideMeter = 20;

  if (tide) {
    if (tide.isHighTideAlert) {
      tideStatus = "critical";
      tideStatusText = "หนุนสูงวิกฤต";
      tideStatusColor = "var(--color-severe)";
      tideMeter = 88;
    } else if (tide.tideRisk >= 0.4 || tide.astronomicalLevelM >= 1.4) {
      tideStatus = "watch";
      tideStatusText = "หนุนปานกลาง";
      tideStatusColor = "var(--color-watch)";
      tideMeter = 62;
    } else {
      tideStatus = "safe";
      tideStatusText = "ปกติ";
      tideStatusColor = "var(--color-low)";
      tideMeter = 28;
    }
    tideCurrentVal = `+${tide.astronomicalLevelM.toFixed(2)} ม.รทก. (${tide.phaseLabel})`;
  }

  const tideFactor: TriggerFactor = {
    id: "tide",
    icon: "🌊",
    name: "สภาวะน้ำทะเลหนุนสูง (Tide Surge)",
    subtitle: "อิทธิพลน้ำทะเลหนุนปากแม่น้ำ",
    currentDisplay: tideCurrentVal,
    thresholdDisplay: "> +1.80 ม.รทก.",
    status: tideStatus,
    statusText: tideStatusText,
    statusColor: tideStatusColor,
    impactExplanation:
      "น้ำทะเลหนุนสูงจะดันปิดปากแม่น้ำเจ้าพระยา ทำให้ระบายน้ำช้าลง และดันน้ำในคลองระบายน้ำให้สูงขึ้นตาม",
    isPriorityForZone: zone === "bangkok_urban",
    meterPercent: tideMeter,
    safeZoneLabel: "< 1.4 ม.",
    watchZoneLabel: "1.4–1.8 ม.",
    criticalZoneLabel: "> 1.8 ม.",
  };

  // ─────────────────────────────────────────────────────────────
  // 5. C.13 Status (Chao Phraya Dam Release)
  // ─────────────────────────────────────────────────────────────
  const c13Status: "safe" | "watch" | "critical" | "unknown" =
    c13Discharge === null || c13Discharge === undefined
      ? "unknown"
      : c13Discharge >= 2700
        ? "critical"
        : c13Discharge >= 2000
          ? "watch"
          : "safe";

  let c13Meter = 20;
  if (c13Discharge !== null && c13Discharge !== undefined) {
    if (c13Discharge >= 2700) {
      c13Meter = Math.min(100, 80 + ((c13Discharge - 2700) / 800) * 20);
    } else if (c13Discharge >= 2000) {
      c13Meter = 55 + ((c13Discharge - 2000) / 700) * 20;
    } else {
      c13Meter = Math.max(10, (c13Discharge / 2000) * 45);
    }
  }

  const isUrbanBkk = zone === "bangkok_urban";

  const c13Factor: TriggerFactor = {
    id: "c13",
    icon: "⚡",
    name: isUrbanBkk
      ? "เขื่อนเจ้าพระยาระบายน้ำ (C.13)"
      : "ระบายน้ำเขื่อนเจ้าพระยา (C.13)",
    subtitle: isUrbanBkk ? "น้ำเหนือนอกคันกั้นน้ำ" : "จุดชี้ชะตาน้ำหลากภาคกลาง",
    currentDisplay:
      c13Discharge !== null && c13Discharge !== undefined
        ? `${c13Discharge.toLocaleString()} ลบ.ม./วิ`
        : "ไม่มีข้อมูล",
    thresholdDisplay: "> 2,700 ลบ.ม./วินาที",
    status: c13Status,
    statusText:
      c13Status === "critical"
        ? "วิกฤตเกินเกณฑ์"
        : c13Status === "watch"
          ? "เฝ้าระวัง"
          : c13Status === "safe"
            ? "ปกติ"
            : "ไม่มีข้อมูล",
    statusColor:
      c13Status === "critical"
        ? "var(--color-severe)"
        : c13Status === "watch"
          ? "var(--color-watch)"
          : c13Status === "safe"
            ? "var(--color-low)"
            : "var(--color-text-muted)",
    impactExplanation: isUrbanBkk
      ? "กทม. มีคันกั้นน้ำรองรับได้ถึง 2,500–2,800 ลบ.ม./วิ หากเกิน 2,700 ลบ.ม./วิ ชุมชนนอกคันจะเริ่มได้รับผลกระทบ"
      : "หากระบายเกิน 2,700 ลบ.ม./วิ พื้นที่ลุ่มต่ำ ชัยนาท สิงห์บุรี อ่างทอง อยุธยา จะเริ่มมีน้ำล้นตลิ่ง",
    isPriorityForZone: zone === "chao_phraya_valley",
    meterPercent: c13Meter,
    safeZoneLabel: "< 2,000",
    watchZoneLabel: "2,000–2,700",
    criticalZoneLabel: "> 2,700",
  };

  // ─────────────────────────────────────────────────────────────
  // 6. C.2 Runoff Status (Nakhon Sawan)
  // ─────────────────────────────────────────────────────────────
  const c2Status: "safe" | "watch" | "critical" | "unknown" =
    c2Discharge === null || c2Discharge === undefined
      ? "unknown"
      : c2Discharge >= 3500
        ? "critical"
        : c2Discharge >= 2500
          ? "watch"
          : "safe";

  let c2Meter = 20;
  if (c2Discharge !== null && c2Discharge !== undefined) {
    if (c2Discharge >= 3500) {
      c2Meter = Math.min(100, 80 + ((c2Discharge - 3500) / 1000) * 20);
    } else if (c2Discharge >= 2500) {
      c2Meter = 55 + ((c2Discharge - 2500) / 1000) * 20;
    } else {
      c2Meter = Math.max(10, (c2Discharge / 2500) * 45);
    }
  }

  const c2Factor: TriggerFactor = {
    id: "c2",
    icon: "🏔️",
    name: "น้ำหลากนครสวรรค์ (C.2)",
    subtitle: "มวลน้ำเหนือก่อนถึงเขื่อน",
    currentDisplay:
      c2Discharge !== null && c2Discharge !== undefined
        ? `${c2Discharge.toLocaleString()} ลบ.ม./วิ`
        : "ไม่มีข้อมูล",
    thresholdDisplay: "> 3,500 ลบ.ม./วินาที",
    status: c2Status,
    statusText:
      c2Status === "critical"
        ? "มวลน้ำเหนือวิกฤต"
        : c2Status === "watch"
          ? "น้ำหลากปานกลาง"
          : c2Status === "safe"
            ? "ปกติ"
            : "ไม่มีข้อมูล",
    statusColor:
      c2Status === "critical"
        ? "var(--color-severe)"
        : c2Status === "watch"
          ? "var(--color-watch)"
          : c2Status === "safe"
            ? "var(--color-low)"
            : "var(--color-text-muted)",
    impactExplanation:
      "เตือนล่วงหน้า 2–4 วัน หากน้ำผ่านนครสวรรค์เกิน 3,500 ลบ.ม./วิ เขื่อนเจ้าพระยาจะต้องเร่งระบายน้ำเพิ่มตามมา",
    isPriorityForZone: zone === "chao_phraya_valley",
    meterPercent: c2Meter,
    safeZoneLabel: "< 2,500",
    watchZoneLabel: "2,500–3,500",
    criticalZoneLabel: "> 3,500",
  };

  // ─────────────────────────────────────────────────────────────
  // 7. Dam Storage Status
  // ─────────────────────────────────────────────────────────────
  const damStatus: "safe" | "watch" | "critical" | "unknown" =
    reservoirPercent === null || reservoirPercent === undefined
      ? "unknown"
      : reservoirPercent >= 90
        ? "critical"
        : reservoirPercent >= 80
          ? "watch"
          : "safe";

  let damMeter = 20;
  if (reservoirPercent !== null && reservoirPercent !== undefined) {
    damMeter = Math.min(100, Math.max(5, reservoirPercent));
  }

  const damFactor: TriggerFactor = {
    id: "dam",
    icon: "🏞️",
    name: "น้ำในเขื่อนหลักลุ่มเจ้าพระยา",
    subtitle: "ความจุกักเก็บเฉลี่ย",
    currentDisplay:
      reservoirPercent !== null && reservoirPercent !== undefined
        ? `${reservoirPercent.toFixed(1)}%`
        : "ไม่มีข้อมูล",
    thresholdDisplay: "> 85% – 90% ของความจุ",
    status: damStatus,
    statusText:
      damStatus === "critical"
        ? "เขื่อนใกล้เต็ม"
        : damStatus === "watch"
          ? "กักเก็บสูง"
          : damStatus === "safe"
            ? "รับน้ำได้"
            : "ไม่มีข้อมูล",
    statusColor:
      damStatus === "critical"
        ? "var(--color-severe)"
        : damStatus === "watch"
          ? "var(--color-watch)"
          : damStatus === "safe"
            ? "var(--color-low)"
            : "var(--color-text-muted)",
    impactExplanation:
      "เมื่อเขื่อนหลักใกล้เต็มความจุ จะไม่สามารถหน่วงน้ำได้อีก และต้องระบายน้ำออกตามธรรมชาติ",
    meterPercent: damMeter,
    safeZoneLabel: "< 80%",
    watchZoneLabel: "80–90%",
    criticalZoneLabel: "> 90%",
  };

  // Order factors based on zone
  let factors: TriggerFactor[] = [];
  if (zone === "bangkok_urban") {
    factors = [
      localBankFactor,
      rainFactor,
      marginFactor,
      tideFactor,
      c13Factor,
      damFactor,
    ];
  } else if (zone === "chao_phraya_valley") {
    factors = [
      c13Factor,
      localBankFactor,
      c2Factor,
      marginFactor,
      damFactor,
      rainFactor,
    ];
  } else {
    factors = [
      localBankFactor,
      rainFactor,
      marginFactor,
      c13Factor,
      c2Factor,
      damFactor,
    ];
  }

  const criticalFactors = factors.filter((f) => f.status === "critical");
  const criticalCount = criticalFactors.length;
  const watchCount = factors.filter((f) => f.status === "watch").length;
  const safeCount = factors.filter((f) => f.status === "safe").length;
  const unknownCount = factors.filter((f) => f.status === "unknown").length;

  // The Big 3 Disaster Formula components
  const big3 = [
    {
      label: "น้ำเหนือ (C.13)",
      icon: "🏔️",
      val: c13Discharge ? `${c13Discharge.toLocaleString()} ลบ.ม.` : "ปกติ",
      status: c13Status,
      isTriggered: c13Status === "critical",
    },
    {
      label: "น้ำฝนสะสม",
      icon: "🌧️",
      val: rain24hMm ? `${rain24hMm.toFixed(1)} มม.` : "ปกติ",
      status: rainStatus,
      isTriggered: rainStatus === "critical",
    },
    {
      label: "น้ำหนุนสูง",
      icon: "🌊",
      val: tide ? `+${tide.astronomicalLevelM.toFixed(2)} ม.` : "ปกติ",
      status: tideStatus,
      isTriggered: tideStatus === "critical",
    },
  ];
  const big3TriggerCount = big3.filter((b) => b.isTriggered).length;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        marginBottom: "16px",
      }}
    >
      {/* ── 1. The Big 3 Disaster Formula Infographic ─────────────── */}
      <div
        className="card"
        style={{
          background: "var(--color-surface)",
          border:
            big3TriggerCount >= 2
              ? "2px solid var(--color-severe)"
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
            <span style={{ fontSize: "1.2rem" }}>⚡</span>
            <div>
              <div
                style={{
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  color: "var(--color-text-primary)",
                }}
              >
                ผัง 3 ปัจจัยมหาอุทกภัย (The Big 3 Synergy)
              </div>
              <div
                style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}
              >
                จุดเสี่ยงสูงสุดเมื่อทั้ง 3 ปัจจัยมาบรรจบพร้อมกัน
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
                big3TriggerCount >= 2
                  ? "var(--color-severe-bg)"
                  : big3TriggerCount === 1
                    ? "var(--color-watch-bg)"
                    : "var(--color-low-bg)",
              color:
                big3TriggerCount >= 2
                  ? "var(--color-severe)"
                  : big3TriggerCount === 1
                    ? "var(--color-watch)"
                    : "var(--color-low)",
              border: `1px solid ${
                big3TriggerCount >= 2
                  ? "var(--color-severe-border)"
                  : big3TriggerCount === 1
                    ? "var(--color-watch-border)"
                    : "var(--color-low-border)"
              }`,
            }}
          >
            {big3TriggerCount >= 2
              ? "🚨 วิกฤตซ้อน"
              : big3TriggerCount === 1
                ? "⚠️ เฝ้าระวัง 1 ปัจจัย"
                : "🟢 สภาวะปกติ"}
          </span>
        </div>

        {/* 3 Pillars Grid Infographic */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            background: "var(--color-surface-2)",
            padding: "10px",
            borderRadius: "12px",
          }}
        >
          {big3.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: "var(--color-surface)",
                borderRadius: "10px",
                padding: "8px 6px",
                textAlign: "center",
                border: item.isTriggered
                  ? "1.5px solid var(--color-severe)"
                  : item.status === "watch"
                    ? "1.5px solid var(--color-watch)"
                    : "1px solid var(--color-border)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "2px",
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: "var(--color-text-secondary)",
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: item.isTriggered
                    ? "var(--color-severe)"
                    : item.status === "watch"
                      ? "var(--color-watch)"
                      : "var(--color-text-primary)",
                }}
              >
                {item.val}
              </span>
              <span
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  color: item.isTriggered
                    ? "var(--color-severe)"
                    : item.status === "watch"
                      ? "var(--color-watch)"
                      : "var(--color-low)",
                  marginTop: "2px",
                }}
              >
                {item.isTriggered
                  ? "🔴 วิกฤต"
                  : item.status === "watch"
                    ? "🟡 เฝ้าระวัง"
                    : "🟢 ปกติ"}
              </span>
            </div>
          ))}
        </div>

        {/* Convergence Indicator Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: "10px",
            padding: "6px 10px",
            borderRadius: "8px",
            background:
              big3TriggerCount >= 2
                ? "rgba(220, 38, 38, 0.08)"
                : "rgba(0, 0, 0, 0.02)",
            fontSize: "0.74rem",
          }}
        >
          <span style={{ color: "var(--color-text-muted)" }}>
            ระดับการบรรจบ:
          </span>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background:
                  big3TriggerCount >= 1
                    ? "var(--color-watch)"
                    : "var(--color-border)",
              }}
            />
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background:
                  big3TriggerCount >= 2
                    ? "var(--color-severe)"
                    : "var(--color-border)",
              }}
            />
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background:
                  big3TriggerCount >= 3
                    ? "var(--color-severe)"
                    : "var(--color-border)",
              }}
            />
            <span
              style={{
                fontWeight: 700,
                color:
                  big3TriggerCount >= 2
                    ? "var(--color-severe)"
                    : big3TriggerCount === 1
                      ? "var(--color-watch)"
                      : "var(--color-low)",
                marginLeft: "4px",
              }}
            >
              {big3TriggerCount}/3 ปัจจัยวิกฤต
            </span>
          </div>
        </div>
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
            🟢 ปกติ
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
            ปัจจัยปลอดภัย
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
            ใกล้จุดอันตราย
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
            🔴 วิกฤต
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
            แตะเกณฑ์ท่วม
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
          รอข้อมูลสถานีตรวจวัด {unknownCount} ปัจจัย
        </div>
      )}

      {/* Near Blackspot Warning Chip if applicable */}
      {blackspot && blackspot.distanceKm <= 0.8 && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: "8px",
            background: "var(--color-severe-bg)",
            border: "1px solid var(--color-severe-border)",
            color: "var(--color-severe)",
            fontSize: "0.75rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>⚠️</span>
          <span>
            ใกล้จุดเสี่ยงน้ำท่วมขัง กทม.: <strong>{blackspot.name}</strong> (
            {Math.round(blackspot.distanceKm * 1000)} ม.)
          </span>
        </div>
      )}

      {/* ── 3. Visual Infographic Meters for All Factors ─────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {factors.map((factor) => {
          const isExpanded = expandedDetailId === factor.id;
          return (
            <div
              key={factor.id}
              style={{
                background: "var(--color-surface)",
                borderRadius: "12px",
                padding: "12px 14px",
                border:
                  factor.status === "critical"
                    ? "1.5px solid var(--color-severe)"
                    : "1px solid var(--color-border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {/* Header: Icon + Name + Value */}
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
                  <span style={{ fontSize: "1.2rem" }}>{factor.icon}</span>
                  <div>
                    <div
                      style={{
                        fontSize: "0.84rem",
                        fontWeight: 700,
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {factor.name}
                    </div>
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

                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 800,
                      color: factor.statusColor,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {factor.currentDisplay}
                  </div>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: "0.64rem",
                      fontWeight: 700,
                      color: factor.statusColor,
                      background:
                        factor.status === "critical"
                          ? "var(--color-severe-bg)"
                          : factor.status === "watch"
                            ? "var(--color-watch-bg)"
                            : factor.status === "safe"
                              ? "var(--color-low-bg)"
                              : "rgba(100,116,139,0.1)",
                      padding: "1px 6px",
                      borderRadius: "4px",
                      marginTop: "2px",
                    }}
                  >
                    {factor.statusText}
                  </span>
                </div>
              </div>

              {/* ── Visual Spectrum Meter (Infographic Gauge) ────── */}
              <div
                style={{
                  position: "relative",
                  marginTop: "10px",
                  marginBottom: "6px",
                }}
              >
                {/* 3-Zone Segmented Bar */}
                <div
                  style={{
                    height: "8px",
                    borderRadius: "999px",
                    background:
                      "linear-gradient(to right, #10b981 0%, #10b981 50%, #f59e0b 50%, #f59e0b 75%, #ef4444 75%, #ef4444 100%)",
                    position: "relative",
                  }}
                />

                {/* Needle / Value Pin Indicator */}
                <div
                  style={{
                    position: "absolute",
                    left: `${Math.min(96, Math.max(4, factor.meterPercent))}%`,
                    top: "-3px",
                    transform: "translateX(-50%)",
                    width: "14px",
                    height: "14px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: `3px solid ${factor.statusColor}`,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.25)",
                    transition: "left 0.3s ease",
                  }}
                />
              </div>

              {/* Gauge Scale Labels */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.62rem",
                  color: "var(--color-text-muted)",
                  padding: "0 2px",
                }}
              >
                <span>🟢 {factor.safeZoneLabel}</span>
                <span>🟡 {factor.watchZoneLabel}</span>
                <span style={{ color: "var(--color-severe)", fontWeight: 600 }}>
                  🔴 {factor.criticalZoneLabel}
                </span>
              </div>

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
                  เกณฑ์เสี่ยง: <strong>{factor.thresholdDisplay}</strong>
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setExpandedDetailId(isExpanded ? null : factor.id)
                  }
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-accent)",
                    fontWeight: 600,
                    cursor: "pointer",
                    padding: 0,
                    fontSize: "0.68rem",
                  }}
                >
                  {isExpanded ? "ซ่อนคำอธิบาย ▲" : "ผลกระทบต่อบ้าน ▼"}
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
                    lineHeight: 1.4,
                  }}
                >
                  💡 {factor.impactExplanation}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
