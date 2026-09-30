"use client";

/**
 * BaanGuTuamMai — Google Maps Component for Flood Telemetry
 *
 * Uses official Google Maps JavaScript API with native Thailand maps,
 * custom color-coded flood station markers, and interactive InfoWindows.
 */

import { useEffect, useRef, useState } from "react";

export type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  color?: string;
  label?: string;
  popup?: string; // HTML content for InfoWindow
};

interface FloodMapProps {
  center?: [number, number]; // [lng, lat]
  zoom?: number;
  markers?: MapMarker[];
  className?: string;
  style?: React.CSSProperties;
}

type GoogleMapsAPI = {
  Map: new (
    el: HTMLElement,
    opts: unknown
  ) => {
    setCenter: (pos: { lat: number; lng: number }) => void;
  };
  Marker: new (opts: unknown) => {
    setMap: (map: unknown) => void;
    setPosition: (pos: { lat: number; lng: number }) => void;
    addListener: (event: string, handler: () => void) => void;
  };
  InfoWindow: new (opts?: unknown) => {
    setContent: (content: string) => void;
    open: (opts: { map: unknown; anchor?: unknown; shouldFocus?: boolean }) => void;
    close: () => void;
  };
  MapTypeControlStyle: {
    HORIZONTAL_BAR: unknown;
  };
  ControlPosition: {
    TOP_LEFT: unknown;
  };
  SymbolPath: {
    CIRCLE: unknown;
  };
};

type GoogleWindow = {
  google?: {
    maps?: GoogleMapsAPI;
  };
};

export function FloodMap({
  center = [100.514, 13.862], // [lng, lat] - Nonthaburi default
  zoom = 11,
  markers = [],
  className,
  style,
}: FloodMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<{
    setCenter: (pos: { lat: number; lng: number }) => void;
  } | null>(null);
  const markersRef = useRef<
    Map<
      string,
      {
        setMap: (map: unknown) => void;
        setPosition: (pos: { lat: number; lng: number }) => void;
      }
    >
  >(new Map());
  const activeInfoWindowRef = useRef<{
    setContent: (c: string) => void;
    open: (opts: { map: unknown; anchor?: unknown; shouldFocus?: boolean }) => void;
    close: () => void;
  } | null>(null);

  const [isApiLoaded, setIsApiLoaded] = useState(() => {
    if (typeof window !== "undefined") {
      const g = (window as unknown as GoogleWindow).google;
      return Boolean(g?.maps);
    }
    return false;
  });
  const [loadError, setLoadError] = useState<string | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  // ── 1. Load Google Maps JavaScript API ─────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || isApiLoaded) return;

    const g = (window as unknown as GoogleWindow).google;
    if (g?.maps) {
      queueMicrotask(() => setIsApiLoaded(true));
      return;
    }

    const scriptId = "google-maps-core-script";
    const existingScript = document.getElementById(scriptId);

    if (existingScript) {
      existingScript.addEventListener("load", () => setIsApiLoaded(true));
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=th&region=TH`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsApiLoaded(true);
    };

    script.onerror = () => {
      setLoadError("ไม่สามารถโหลด Google Maps ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต");
    };

    document.head.appendChild(script);
  }, [apiKey, isApiLoaded]);

  // ── 2. Initialize Google Map ──────────────────────────────────────────────
  useEffect(() => {
    if (!isApiLoaded || !containerRef.current || mapInstanceRef.current) return;

    const google = (window as unknown as GoogleWindow).google;
    if (!google?.maps) return;

    const [lng, lat] = center;

    const map = new google.maps.Map(containerRef.current, {
      center: { lat, lng },
      zoom,
      mapTypeId: "roadmap",
      mapTypeControl: true,
      mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_LEFT,
      },
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#93c5fd" }], // Highlight water bodies in soft flood blue
        },
      ],
    });

    mapInstanceRef.current = map;
  }, [isApiLoaded, center, zoom]);

  // ── 3. Sync Center when coordinates change ────────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const [lng, lat] = center;
    mapInstanceRef.current.setCenter({ lat, lng });
  }, [center]);

  // ── 4. Render Markers ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isApiLoaded || !mapInstanceRef.current) return;

    const google = (window as unknown as GoogleWindow).google;
    if (!google?.maps) return;

    const map = mapInstanceRef.current;
    const currentMarkerIds = new Set(markers.map((m) => m.id));

    // Remove old markers that are no longer in props
    for (const [id, marker] of markersRef.current.entries()) {
      if (!currentMarkerIds.has(id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    }

    // Add or update markers
    for (const m of markers) {
      if (markersRef.current.has(m.id)) {
        const existing = markersRef.current.get(m.id);
        existing?.setPosition({ lat: m.latitude, lng: m.longitude });
      } else {
        const isHome = m.id === "user-home";

        // Create custom SVG Pin Icon
        let icon: unknown;

        if (isHome) {
          // Home Icon (Gold star / pin)
          icon = {
            path: "M 0,-15 A 15,15 0 1,0 0,15 A 15,15 0 1,0 0,-15 Z",
            fillColor: "#eab308",
            fillOpacity: 1,
            strokeColor: "#854d0e",
            strokeWeight: 3,
            scale: 0.9,
          };
        } else {
          // Circular telemetry marker
          icon = {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: m.color || "#1d5aa8",
            fillOpacity: 0.9,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            scale: 6.5,
          };
        }

        const marker = new google.maps.Marker({
          position: { lat: m.latitude, lng: m.longitude },
          map,
          title: m.label || "",
          icon,
          zIndex: isHome ? 9999 : 100,
        });

        if (m.popup) {
          const infoWindow = new google.maps.InfoWindow({
            content: m.popup,
          });

          marker.addListener("click", () => {
            if (activeInfoWindowRef.current) {
              activeInfoWindowRef.current.close();
            }
            infoWindow.open({
              anchor: marker,
              map,
              shouldFocus: false,
            });
            activeInfoWindowRef.current = infoWindow;
          });
        }

        markersRef.current.set(m.id, marker);
      }
    }
  }, [isApiLoaded, markers]);

  if (loadError) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-surface)",
          color: "var(--color-severe)",
          padding: "20px",
          textAlign: "center",
          fontSize: "0.9rem",
        }}
      >
        ⚠️ {loadError}
      </div>
    );
  }

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
      aria-label="แผนที่แสดงสถานีวัดน้ำและระดับน้ำ"
    >
      {!isApiLoaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(241, 245, 249, 0.9)",
            color: "var(--color-text-secondary)",
            fontSize: "0.85rem",
            gap: "8px",
            zIndex: 10,
          }}
        >
          <span>🗺️ กำลังโหลดแผนที่ Google Maps...</span>
        </div>
      )}
    </div>
  );
}
