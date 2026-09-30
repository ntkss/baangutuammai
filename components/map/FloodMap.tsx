"use client";

/**
 * BaanGuTuamMai — Base MapLibre GL JS map component
 *
 * Wraps MapLibre GL JS as a React client component.
 * Uses OpenStreetMap tiles (free, no API key required for MVP).
 *
 * Props:
 *   center     — initial [lng, lat]
 *   zoom       — initial zoom level
 *   onMapReady — callback when map has loaded
 *   markers    — array of markers to display
 *   className  — optional CSS class on the container div
 */

import { useEffect, useRef } from "react";

// MapLibre is a client-only library (uses WebGL)
type MaplibreMap = import("maplibre-gl").Map;
type Marker = import("maplibre-gl").Marker;

export type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  color?: string;
  label?: string;
  popup?: string; // Thai HTML content for popup
};

interface FloodMapProps {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  markers?: MapMarker[];
  onMapReady?: (map: MaplibreMap) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function FloodMap({
  center = [100.5018, 13.7563], // Bangkok default
  zoom = 11,
  markers = [],
  onMapReady,
  className,
  style,
}: FloodMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const markerRefs = useRef<Map<string, Marker>>(new Map());

  // ─── Init map ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: MaplibreMap;

    // Dynamic import — MapLibre must not be bundled on the server
    import("maplibre-gl").then((maplibre) => {
      map = new maplibre.Map({
        container: containerRef.current!,
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
                '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              maxzoom: 19,
            },
          },
          layers: [
            {
              id: "osm",
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
        "bottom-left"
      );

      map.addControl(
        new maplibre.NavigationControl({ showCompass: false }),
        "top-right"
      );

      map.on("load", () => {
        onMapReady?.(map);
      });

      mapRef.current = map;
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Sync markers ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current) return;

    import("maplibre-gl").then((maplibre) => {
      const map = mapRef.current!;
      const currentIds = new Set(markers.map((m) => m.id));

      // Remove old markers
      for (const [id, marker] of markerRefs.current.entries()) {
        if (!currentIds.has(id)) {
          marker.remove();
          markerRefs.current.delete(id);
        }
      }

      // Add / update markers
      for (const m of markers) {
        if (markerRefs.current.has(m.id)) {
          // Update position
          markerRefs.current
            .get(m.id)!
            .setLngLat([m.longitude, m.latitude]);
        } else {
          // Create element
          const el = document.createElement("div");
          el.style.cssText = `
            width: 14px;
            height: 14px;
            border-radius: 50%;
            background: ${m.color ?? "#1d5aa8"};
            border: 2px solid white;
            box-shadow: 0 1px 4px rgba(0,0,0,0.3);
            cursor: pointer;
          `;
          if (m.label) el.title = m.label;

          const marker = new maplibre.Marker({ element: el })
            .setLngLat([m.longitude, m.latitude]);

          if (m.popup) {
            const popup = new maplibre.Popup({
              offset: 12,
              closeButton: false,
              className: "flood-map-popup",
            }).setHTML(`
              <div style="font-family: Sarabun, sans-serif; font-size: 13px; padding: 4px 2px; line-height: 1.5;">
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
        minHeight: 300,
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        ...style,
      }}
      aria-label="แผนที่แสดงสถานีวัดน้ำและระดับน้ำ"
    />
  );
}
