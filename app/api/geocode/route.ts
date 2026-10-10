import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ── Simple in-memory rate limiter (per IP, resets on cold-start) ──────────────
// For serverless, this only works within a single function instance.
// For stricter limits, replace with Vercel KV / Redis.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 60; // requests per window
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

interface GoogleGeocodeResultItem {
  place_id: string;
  formatted_address: string;
  address_components?: Array<{ long_name: string }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface NominatimResultItem {
  place_id: number | string;
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
}

export async function GET(req: NextRequest) {
  // ── Rate limiting ────────────────────────────────────────────────────────
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a minute." },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const { searchParams } = req.nextUrl;
  const raw = searchParams.get("q")?.trim() ?? "";

  // ── Input validation ─────────────────────────────────────────────────────
  if (!raw) {
    return NextResponse.json({ results: [] });
  }
  if (raw.length > 200) {
    return NextResponse.json(
      { error: "Query too long (max 200 characters)" },
      { status: 400 },
    );
  }
  const q = raw;

  // Only use the server-side key (never NEXT_PUBLIC_ on the server).
  // NEXT_PUBLIC_ keys are embedded in the client bundle and visible to everyone.
  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;

  // 1. If Google Maps API key is configured, use official Google Geocoding API
  if (googleApiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        q,
      )}&components=country:TH&language=th&key=${googleApiKey}`;

      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const json = (await res.json()) as {
          status: string;
          results?: GoogleGeocodeResultItem[];
        };
        if (json.status === "OK" && Array.isArray(json.results)) {
          const results = json.results.map((r: GoogleGeocodeResultItem) => ({
            id: r.place_id,
            label: r.formatted_address,
            name: r.address_components?.[0]?.long_name || r.formatted_address,
            lat: r.geometry.location.lat,
            lng: r.geometry.location.lng,
            source: "google",
          }));
          return NextResponse.json({ results, provider: "google" });
        }
      }
    } catch (err) {
      console.error("[geocode] Google API failed:", err);
    }
  }

  // 2. Open Geocoding fallback for Thailand (Nominatim) when Google Key is not yet set
  try {
    const fallbackUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      q,
    )}&countrycodes=th&format=json&limit=5&accept-language=th`;

    const res = await fetch(fallbackUrl, {
      headers: {
        "User-Agent": "BaanGuTuamMai/1.0 (contact@baangutuammai.local)",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const items = (await res.json()) as NominatimResultItem[];
      if (Array.isArray(items)) {
        const results = items.map((item: NominatimResultItem) => ({
          id: String(item.place_id),
          label: item.display_name,
          name: item.name || item.display_name.split(",")[0],
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          source: "fallback",
        }));
        return NextResponse.json({
          results,
          provider: googleApiKey ? "google_failed_fallback" : "fallback",
          hasGoogleKey: Boolean(googleApiKey),
        });
      }
    }
  } catch (err) {
    console.error("[geocode] Fallback geocode failed:", err);
  }

  return NextResponse.json({ results: [], error: "No results found" });
}
