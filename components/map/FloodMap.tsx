"use client";

/**
 * BaanGuTuamMai — Google Maps Component for Flood Telemetry
 * with automatic OpenStreetMap (MapLibre) Fallback
 */

import { useEffect, useRef, useState } from "react";
import {
  loadGoogleMaps,
  onGoogleMapsAuthError,
  hasGoogleMapsAuthFailed,
} from "@/lib/maps/googleMapsLoader";
import { MapLibreFallback } from "./MapLibreFallback";

export type MapMarker = {
  id: string;
  latitude: number;
  longitude: number;
  color?: string;
  label?: string;
  popup?: string; // HTML content for InfoWindow / Popup
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
    opts: unknown,
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
    open: (opts: {
      map: unknown;
      anchor?: unknown;
      shouldFocus?: boolean;
    }) => void;
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
    open: (opts: {
      map: unknown;
      anchor?: unknown;
      shouldFocus?: boolean;
    }) => void;
    close: () => void;
  } | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const [useFallback, setUseFallback] = useState<boolean>(() => {
    if (!apiKey) return true;
    if (typeof window !== "undefined") {
      return hasGoogleMapsAuthFailed();
    }
    return false;
  });

  const [isApiLoaded, setIsApiLoaded] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const g = (window as unknown as GoogleWindow).google;
      return Boolean(g?.maps) && !hasGoogleMapsAuthFailed();
    }
    return false;
  });

  // ── 1. Listen for Google Maps Authentication Errors (gm_authFailure) ──────
  useEffect(() => {
    const unsubscribe = onGoogleMapsAuthError(() => {
      console.warn(
        "[FloodMap] Google Maps authentication failed. Activating OpenStreetMap fallback.",
      );
      setUseFallback(true);
    });
    return unsubscribe;
  }, []);

  // ── 2. Load Google Maps JavaScript API via shared loader ──────────────────
  useEffect(() => {
    if (typeof window === "undefined" || isApiLoaded || useFallback || !apiKey)
      return;

    let active = true;

    loadGoogleMaps(apiKey).then((success) => {
      if (!active) return;
      if (success) {
        setIsApiLoaded(true);
      } else {
        console.warn(
          "[FloodMap] Google Maps failed to initialize. Switching to OpenStreetMap fallback.",
        );
        setUseFallback(true);
      }
    });

    return () => {
      active = false;
    };
  }, [apiKey, isApiLoaded, useFallback]);

  // ── 3. Initialize Google Map if loaded ────────────────────────────────────
  useEffect(() => {
    if (
      !isApiLoaded ||
      useFallback ||
      !containerRef.current ||
      mapInstanceRef.current
    )
      return;

    const google = (window as unknown as GoogleWindow).google;
    if (!google?.maps) return;

    try {
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
            stylers: [{ color: "#93c5fd" }],
          },
        ],
      });

      mapInstanceRef.current = map;
    } catch (err) {
      console.error("[FloodMap] Error initializing Google Map:", err);
      queueMicrotask(() => setUseFallback(true));
    }
  }, [isApiLoaded, useFallback, center, zoom]);

  // ── 4. Sync Center when coordinates change ────────────────────────────────
  useEffect(() => {
    if (!mapInstanceRef.current || useFallback) return;
    const [lng, lat] = center;
    mapInstanceRef.current.setCenter({ lat, lng });
  }, [center, useFallback]);

  // ── 5. Render Markers on Google Map ───────────────────────────────────────
  useEffect(() => {
    if (!isApiLoaded || useFallback || !mapInstanceRef.current) return;

    const google = (window as unknown as GoogleWindow).google;
    if (!google?.maps) return;

    const map = mapInstanceRef.current;
    const currentMarkerIds = new Set(markers.map((m) => m.id));

    // Remove old markers
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

        let icon: unknown;

        if (isHome) {
          icon = {
            path: "M 0,-15 A 15,15 0 1,0 0,15 A 15,15 0 1,0 0,-15 Z",
            fillColor: "#eab308",
            fillOpacity: 1,
            strokeColor: "#854d0e",
            strokeWeight: 3,
            scale: 0.9,
          };
        } else {
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
  }, [isApiLoaded, useFallback, markers]);

  // ── 6. Fallback Render: OpenStreetMap via MapLibre GL ─────────────────────
  if (useFallback) {
    return (
      <div
        className={className}
        style={{
          width: "100%",
          height: "100%",
          minHeight: 350,
          position: "relative",
          ...style,
        }}
      >
        <MapLibreFallback
          center={center}
          zoom={zoom}
          markers={markers}
          style={{ width: "100%", height: "100%" }}
        />
        {/* Subtle fallback notification pill */}
        <div
          style={{
            position: "absolute",
            bottom: "8px",
            right: "8px",
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(4px)",
            color: "#f8fafc",
            padding: "3px 8px",
            borderRadius: "6px",
            fontSize: "0.68rem",
            zIndex: 10,
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>🌐 แผนที่สำรอง (OpenStreetMap)</span>
        </div>
      </div>
    );
  }

  // ── 7. Primary Render: Google Maps ────────────────────────────────────────
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
          <span>🗺️ กำลังโหลดแผนที่...</span>
        </div>
      )}
    </div>
  );
}
