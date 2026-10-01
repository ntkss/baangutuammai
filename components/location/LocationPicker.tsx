"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUserPrefs } from "@/lib/store/userPrefs";
import {
  loadGoogleMaps,
  onGoogleMapsAuthError,
  hasGoogleMapsAuthFailed,
} from "@/lib/maps/googleMapsLoader";

interface LocationPickerProps {
  currentLat: number;
  currentLng: number;
  onLocationSelect: (lat: number, lng: number, label?: string) => void;
}

type SearchResultItem = {
  id: string;
  label: string;
  name: string;
  lat: number;
  lng: number;
};

export function LocationPicker({
  currentLat,
  currentLng,
  onLocationSelect,
}: LocationPickerProps) {
  const { homeLocation, setHomeLocation } = useUserPrefs();
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Address search query & results
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Manual Lat/Lng inputs
  const [manualLat, setManualLat] = useState(String(currentLat));
  const [manualLng, setManualLng] = useState(String(currentLng));

  // Google Maps JS Autocomplete ref
  const googleInputRef = useRef<HTMLInputElement>(null);
  const [googleLoaded, setGoogleLoaded] = useState(() => {
    if (typeof window !== "undefined") {
      if (hasGoogleMapsAuthFailed()) return false;
      const g = (
        window as unknown as { google?: { maps?: { places?: unknown } } }
      ).google;
      return Boolean(g?.maps?.places);
    }
    return false;
  });

  // Check if Google Maps JS API key is set
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  // ── Listen for Google Maps Authentication Errors (gm_authFailure) ──────
  useEffect(() => {
    const unsubscribe = onGoogleMapsAuthError(() => {
      console.warn(
        "[LocationPicker] Google Maps auth failure detected. Switching to fallback search.",
      );
      setGoogleLoaded(false);
    });
    return unsubscribe;
  }, []);

  const handleSelect = useCallback(
    (lat: number, lng: number, label?: string) => {
      const roundedLat = Math.round(lat * 10000) / 10000;
      const roundedLng = Math.round(lng * 10000) / 10000;

      setHomeLocation({
        id: `loc-${roundedLat.toFixed(4)}-${roundedLng.toFixed(4)}`,
        latitude: roundedLat,
        longitude: roundedLng,
        label,
      });
      setManualLat(String(roundedLat));
      setManualLng(String(roundedLng));
      onLocationSelect(roundedLat, roundedLng, label);
      setIsOpen(false);
      setGeoError(null);
      setSearchQuery("");
      setSearchResults([]);
    },
    [onLocationSelect, setHomeLocation],
  );

  // ── Load Google Maps JavaScript API via shared loader ─────────────────────
  useEffect(() => {
    if (
      !googleApiKey ||
      typeof window === "undefined" ||
      googleLoaded ||
      hasGoogleMapsAuthFailed()
    )
      return;

    let active = true;

    loadGoogleMaps(googleApiKey).then((success) => {
      if (!active) return;
      if (success && !hasGoogleMapsAuthFailed()) {
        const g = (
          window as unknown as { google?: { maps?: { places?: unknown } } }
        ).google;
        if (g?.maps?.places) {
          setGoogleLoaded(true);
        }
      } else {
        setGoogleLoaded(false);
      }
    });

    return () => {
      active = false;
    };
  }, [googleApiKey, googleLoaded]);

  // ── Attach Google Places Autocomplete widget ──────────────────────────────
  useEffect(() => {
    type GoogleWindow = {
      google?: {
        maps?: {
          places?: {
            Autocomplete: new (
              el: HTMLInputElement,
              opts: Record<string, unknown>,
            ) => {
              addListener: (event: string, handler: () => void) => void;
              getPlace: () => {
                name?: string;
                formatted_address?: string;
                geometry?: {
                  location?: {
                    lat: () => number;
                    lng: () => number;
                  };
                };
              };
            };
          };
        };
      };
    };

    const gWin = window as unknown as GoogleWindow;
    if (
      !googleLoaded ||
      !googleInputRef.current ||
      !gWin.google?.maps?.places
    ) {
      return;
    }

    try {
      const autocomplete = new gWin.google.maps.places.Autocomplete(
        googleInputRef.current,
        {
          componentRestrictions: { country: "th" },
          fields: ["formatted_address", "geometry", "name"],
        },
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
          setGeoError("ไม่พบพิกัดของสถานที่ที่เลือก");
          return;
        }

        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const label =
          place.name ||
          place.formatted_address ||
          "ตำแหน่งที่เลือกจาก Google Maps";

        handleSelect(lat, lng, label);
      });
    } catch (err) {
      console.error("Google Autocomplete attach failed:", err);
    }
  }, [googleLoaded, isOpen, handleSelect]);

  // ── Fallback Address Search via /api/geocode (debounced) ─────────────────
  useEffect(() => {
    if (googleLoaded) return; // If Google widget is active, it handles suggestions directly
    const trimmed = searchQuery.trim();
    if (!trimmed || trimmed.length < 2) {
      const timer = setTimeout(() => {
        setSearchResults([]);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setIsSearching(true);
      fetch(`/api/geocode?q=${encodeURIComponent(trimmed)}`)
        .then((r) => r.json())
        .then((data) => {
          setIsSearching(false);
          setSearchResults(data.results ?? []);
        })
        .catch(() => {
          setIsSearching(false);
          setSearchResults([]);
        });
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, googleLoaded]);

  function handleUseGps() {
    if (!navigator.geolocation) {
      setGeoError("เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง GPS");
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const { latitude, longitude } = position.coords;
        handleSelect(latitude, longitude, "ตำแหน่งปัจจุบันของฉัน (GPS)");
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError("กรุณาอนุญาตให้เข้าถึงตำแหน่งในเบราว์เซอร์");
        } else {
          setGeoError("ไม่สามารถดึงตำแหน่ง GPS ได้ในขณะนี้");
        }
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < 5 ||
      lat > 21 ||
      lng < 97 ||
      lng > 106
    ) {
      setGeoError("กรุณาระบุพิกัดในประเทศไทย (Lat: 5–21, Lng: 97–106)");
      return;
    }
    handleSelect(
      lat,
      lng,
      `พิกัดระบุเอง (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    );
  }

  const displayLabel =
    homeLocation?.label ||
    `พิกัดบ้าน: ${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`;

  return (
    <div style={{ marginBottom: "16px" }}>
      {/* Current location pill banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "var(--color-surface)",
          border: "1px solid var(--color-border)",
          borderRadius: "10px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            minWidth: 0,
          }}
        >
          <span style={{ fontSize: "1.1rem" }}>📍</span>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: "0.86rem",
                fontWeight: 600,
                color: "var(--color-text-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {displayLabel}
            </div>
            <div
              style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}
            >
              {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn"
          style={{
            padding: "6px 14px",
            fontSize: "0.78rem",
            fontWeight: 600,
            borderRadius: "6px",
            background: isOpen ? "var(--color-border)" : "var(--color-accent)",
            color: isOpen ? "var(--color-text-primary)" : "#ffffff",
            border: "none",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          {isOpen ? "ปิด" : "เปลี่ยน"}
        </button>
      </div>

      {/* Expandable Location Selection Drawer */}
      {isOpen && (
        <div
          style={{
            marginTop: "8px",
            padding: "16px",
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "10px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
        >
          {/* ── 1. GPS Button ──────────────────────────────────── */}
          <button
            onClick={handleUseGps}
            disabled={isLocating}
            style={{
              width: "100%",
              padding: "10px 14px",
              background: "rgba(29, 90, 168, 0.08)",
              border: "1px solid rgba(29, 90, 168, 0.3)",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--color-accent)",
              cursor: isLocating ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <span>{isLocating ? "⏳" : "🎯"}</span>
            <span>
              {isLocating
                ? "กำลังดึงพิกัด GPS..."
                : "ใช้ตำแหน่งปัจจุบันของฉัน (GPS)"}
            </span>
          </button>

          {geoError && (
            <div
              style={{
                padding: "8px 12px",
                background: "rgba(185, 28, 28, 0.1)",
                color: "var(--color-severe)",
                borderRadius: "6px",
                fontSize: "0.75rem",
                marginBottom: "14px",
              }}
            >
              ⚠️ {geoError}
            </div>
          )}

          {/* ── 2. Google Maps API Address Search ──────────────── */}
          <div style={{ marginBottom: "16px" }}>
            <label
              htmlFor="address-search-input"
              style={{
                display: "block",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                marginBottom: "6px",
              }}
            >
              {googleLoaded
                ? "🔍 ค้นหาที่อยู่บ้านจาก Google Maps API:"
                : "🔍 ค้นหาที่อยู่บ้าน (ค้นหาตำบล, อำเภอ, จังหวัด):"}
            </label>

            <div style={{ position: "relative" }}>
              <input
                id="address-search-input"
                ref={googleInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="พิมพ์ชื่อหมู่บ้าน, ซอย, ถนน, ตำบล, อำเภอ หรือสถานที่..."
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  fontSize: "0.84rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  boxSizing: "border-box",
                }}
              />
              {isSearching && (
                <div
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "10px",
                    fontSize: "0.75rem",
                    color: "var(--color-text-muted)",
                  }}
                >
                  กำลังค้นหา...
                </div>
              )}
            </div>

            {/* Address Search Suggestions Dropdown */}
            {searchResults.length > 0 && !googleLoaded && (
              <div
                style={{
                  marginTop: "4px",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  background: "var(--color-surface)",
                  maxHeight: "180px",
                  overflowY: "auto",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                }}
              >
                {searchResults.map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      handleSelect(item.lat, item.lng, item.name || item.label)
                    }
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 12px",
                      background: "transparent",
                      border: "none",
                      borderBottom: "1px solid var(--color-border)",
                      cursor: "pointer",
                      fontSize: "0.78rem",
                      color: "var(--color-text-primary)",
                    }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "rgba(29, 90, 168, 0.08)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background =
                        "transparent")
                    }
                  >
                    <div style={{ fontWeight: 600 }}>📍 {item.name}</div>
                    <div
                      style={{
                        fontSize: "0.68rem",
                        color: "var(--color-text-muted)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.label}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {hasGoogleMapsAuthFailed() && (
              <p
                style={{
                  fontSize: "0.68rem",
                  color: "var(--color-watch)",
                  margin: "4px 0 0 0",
                }}
              >
                ⚡ กำลังใช้งานระบบค้นหาพิกัดสำรอง (พิมพ์ชื่อตำบล, อำเภอ
                หรือสถานที่ แล้วเลือกจากรายการ)
              </p>
            )}
          </div>

          {/* ── 3. Manual Lat/Lng Input ───────────────────────── */}
          <form
            onSubmit={handleManualSubmit}
            style={{
              paddingTop: "14px",
              borderTop: "1px solid var(--color-border)",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                marginBottom: "6px",
              }}
            >
              ✏️ หรือระบุพิกัดเอง (Manual Lat, Lng):
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="number"
                step="0.000001"
                placeholder="ละติจูด (Lat) เช่น 13.8620"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  fontSize: "0.8rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  boxSizing: "border-box",
                }}
              />
              <input
                type="number"
                step="0.000001"
                placeholder="ลองจิจูด (Lng) เช่น 100.5140"
                value={manualLng}
                onChange={(e) => setManualLng(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  fontSize: "0.8rem",
                  border: "1px solid var(--color-border)",
                  borderRadius: "6px",
                  background: "var(--color-surface)",
                  color: "var(--color-text-primary)",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="submit"
                className="btn btn--primary"
                style={{
                  padding: "8px 16px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  borderRadius: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                ตกลง
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
