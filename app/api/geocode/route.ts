import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";

  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const googleApiKey =
    process.env.GOOGLE_MAPS_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // 1. If Google Maps API key is configured, use official Google Geocoding API
  if (googleApiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        q
      )}&components=country:TH&language=th&key=${googleApiKey}`;

      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (res.ok) {
        const json = await res.json();
        if (json.status === "OK" && Array.isArray(json.results)) {
          const results = json.results.map((r: any) => ({
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
      q
    )}&countrycodes=th&format=json&limit=5&accept-language=th`;

    const res = await fetch(fallbackUrl, {
      headers: {
        "User-Agent": "BaanGuTuamMai/1.0 (contact@baangutuammai.local)",
      },
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const items = await res.json();
      if (Array.isArray(items)) {
        const results = items.map((item: any) => ({
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
