"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MaplibreMap, Marker } from "maplibre-gl";
import type { MapMarker } from "./FloodMap";

interface MapLibreFallbackProps {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  markers?: MapMarker[];
  className?: string;
  style?: React.CSSProperties;
}

export function MapLibreFallback({
  center = [100.514, 13.862],
  zoom = 11,
  markers = [],
  className,
  style,
}: MapLibreFallbackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const markerRefs = useRef<Map<string, Marker>>(new Map());

  // ── 1. Initialize MapLibre GL Map ──────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let active = true;

    import("maplibre-gl").then((maplibre) => {
      if (!active || !containerRef.current) return;

      const map = new maplibre.Map({
        container: containerRef.current,
        style: {
          version: 8,
          sources: {
            osm: {
              type: "raster",
              tiles: [
                "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
                "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
              ],
              tileSize: 256,
              attribution:
                '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
              maxzoom: 19,
            },
          },
          layers: [
            {
              id: "osm-layer",
              type: "raster",
              source: "osm",
            },
          ],
        },
        center,
        zoom,
        attributionControl: false,
      });

      map.addControl(
        new maplibre.AttributionControl({ compact: true }),
        "bottom-left",
      );

      map.addControl(
        new maplibre.NavigationControl({ showCompass: false }),
        "top-right",
      );

      mapRef.current = map;
    });

    return () => {
      active = false;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. Sync center when coordinates change ─────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setCenter(center);
  }, [center]);

  // ── 3. Render Markers ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    import("maplibre-gl").then((maplibre) => {
      const map = mapRef.current;
      if (!map) return;

      const currentIds = new Set(markers.map((m) => m.id));

      // Remove stale markers
      for (const [id, marker] of markerRefs.current.entries()) {
        if (!currentIds.has(id)) {
          marker.remove();
          markerRefs.current.delete(id);
        }
      }

      // Add or update markers
      for (const m of markers) {
        if (markerRefs.current.has(m.id)) {
          markerRefs.current.get(m.id)?.setLngLat([m.longitude, m.latitude]);
        } else {
          const isHome = m.id === "user-home";

          const el = document.createElement("div");
          if (isHome) {
            // Home gold pin
            el.innerHTML = `
              <div style="
                width: 28px;
                height: 28px;
                background: #eab308;
                border: 3px solid #854d0e;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 14px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.35);
                cursor: pointer;
              ">🏠</div>
            `;
          } else {
            // Station telemetry circle
            const color = m.color || "#1d5aa8";
            el.innerHTML = `
              <div style="
                width: 14px;
                height: 14px;
                border-radius: 50%;
                background: ${color};
                border: 2px solid #ffffff;
                box-shadow: 0 1px 4px rgba(0,0,0,0.3);
                cursor: pointer;
              "></div>
            `;
          }

          if (m.label) {
            el.title = m.label;
          }

          const marker = new maplibre.Marker({ element: el })
            .setLngLat([m.longitude, m.latitude]);

          if (m.popup) {
            const popup = new maplibre.Popup({
              offset: isHome ? 16 : 10,
              closeButton: true,
              closeOnClick: true,
              maxWidth: "280px",
            }).setHTML(`
              <div style="font-family: Sarabun, sans-serif; font-size: 13px; line-height: 1.5; color: #1e293b; padding: 4px 2px;">
                ${m.popup}
              </div>
            `);
            marker.setPopup(popup);
          }

          marker.addTo(map);
          markerRefs.current.set(m.id, marker);
        }
      }
    });
  }, [markers]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        minHeight: 350,
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        position: "relative",
        background: "#e2e8f0",
        ...style,
      }}
      aria-label="แผนที่สำรอง OpenStreetMap แสดงสถานีวัดน้ำและระดับน้ำ"
    />
  );
}
