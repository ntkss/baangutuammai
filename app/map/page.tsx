"use client";

import { useEffect, useState } from "react";
import { BottomNav } from "@/components/common/BottomNav";
import { FloodMap, type MapMarker } from "@/components/map/FloodMap";
import { NAV_LABELS } from "@/lib/i18n/th";
import { useUserPrefs } from "@/lib/store/userPrefs";

export default function MapPage() {
  const { homeLocation } = useUserPrefs();
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const homeLat = homeLocation?.latitude ?? 13.862;
  const homeLng = homeLocation?.longitude ?? 100.514;
  const homeLabel = homeLocation?.label ?? "บ้านของฉัน (ท่าน้ำนนทบุรี)";

  useEffect(() => {
    fetch("/api/stations")
      .then((r) => r.json())
      .then((d) => {
        const rawMarkers: MapMarker[] = d.markers ?? [];

        // Add user home location marker
        const homeMarker: MapMarker = {
          id: "user-home",
          latitude: homeLat,
          longitude: homeLng,
          color: "#854d0e", // Gold / amber for home
          label: homeLabel,
          popup: `
            <div style="font-family: sans-serif; font-size: 13px; color: #1e293b;">
              <strong style="font-size: 14px; color: #854d0e;">🏠 ${homeLabel}</strong><br/>
              <span style="font-size: 11px; color: #64748b;">ตำแหน่งบ้านของคุณ</span><br/>
              <span>พิกัด: ${homeLat.toFixed(4)}, ${homeLng.toFixed(4)}</span>
            </div>
          `,
        };

        setMarkers([homeMarker, ...rawMarkers]);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load map markers:", err);
        setIsLoading(false);
      });
  }, [homeLat, homeLng, homeLabel]);

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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>
              🗺️ {NAV_LABELS.map}
            </h1>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--color-text-muted)",
                margin: "2px 0 0 0",
              }}
            >
              สถานีโทรมาตรวัดระดับน้ำจริง สสน./ชป. · แตะหมุดเพื่อดูข้อมูล
            </p>
          </div>
          {isLoading && (
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              กำลังโหลดสถานี...
            </span>
          )}
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
            flexWrap: "wrap",
          }}
        >
          {[
            { color: "#854d0e", label: "บ้านของคุณ" },
            { color: "#2d7d46", label: "ปลอดภัย" },
            { color: "#b45309", label: "เฝ้าระวัง" },
            { color: "#c2410c", label: "เสี่ยงสูง" },
            { color: "#b91c1c", label: "ล้นตลิ่ง!" },
          ].map((item) => (
            <div
              key={item.label}
              style={{ display: "flex", alignItems: "center", gap: "4px" }}
            >
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
            center={[homeLng, homeLat]}
            zoom={11}
            markers={markers}
            style={{ height: "100%", borderRadius: 0 }}
          />
        </div>
      </main>

      <BottomNav />
    </>
  );
}
