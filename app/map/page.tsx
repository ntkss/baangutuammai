"use client";

import { BottomNav } from "@/components/common/BottomNav";
import { FloodMap, type MapMarker } from "@/components/map/FloodMap";
import { NAV_LABELS } from "@/lib/i18n/th";

// Demo markers — will be replaced by real station data from /api/stations/nearby
const DEMO_MARKERS: MapMarker[] = [
  {
    id: "hii-N67A",
    latitude: 13.8613,
    longitude: 100.5136,
    color: "#1d5aa8",
    label: "ท่าน้ำนนทบุรี",
    popup: `
      <strong>ท่าน้ำนนทบุรี</strong><br/>
      ระดับน้ำ: 1.43 ม.รทก.<br/>
      แนวโน้ม: ▲ กำลังเพิ่มขึ้น<br/>
      <span style="color:#b45309">เฝ้าระวัง</span>
    `,
  },
  {
    id: "hii-N68A",
    latitude: 13.7563,
    longitude: 100.5018,
    color: "#2d7d46",
    label: "สถานีวัดน้ำบางกอกน้อย",
    popup: `
      <strong>บางกอกน้อย</strong><br/>
      ระดับน้ำ: 0.87 ม.รทก.<br/>
      แนวโน้ม: → ทรงตัว<br/>
      <span style="color:#2d7d46">ปลอดภัย</span>
    `,
  },
];

export default function MapPage() {
  return (
    <>
      <main
        style={{ display: "flex", flexDirection: "column", height: "100dvh" }}
        id="main-content"
      >
        {/* Header */}
        <div
          style={{
            padding: "12px 16px 8px",
            background: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
            flexShrink: 0,
          }}
        >
          <h1 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
            🗺️ {NAV_LABELS.map}
          </h1>
          <p style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", margin: "2px 0 0 0" }}>
            สถานีวัดน้ำ · แตะที่จุดเพื่อดูรายละเอียด
          </p>
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            padding: "8px 16px",
            background: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
            flexShrink: 0,
          }}
        >
          {[
            { color: "#2d7d46", label: "ปลอดภัย" },
            { color: "#b45309", label: "เฝ้าระวัง" },
            { color: "#c2410c", label: "เสี่ยงสูง" },
            { color: "#991b1b", label: "อันตราย" },
          ].map((item) => (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: item.color,
                  border: "1.5px solid white",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }}
              />
              <span style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Map */}
        <div
          style={{
            flex: 1,
            paddingBottom: "64px", // nav bar height
            position: "relative",
          }}
        >
          <FloodMap
            center={[100.52, 13.81]}
            zoom={11}
            markers={DEMO_MARKERS}
            style={{ height: "100%", borderRadius: 0 }}
          />
        </div>
      </main>

      <BottomNav />
    </>
  );
}
