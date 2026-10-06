import { NextResponse } from "next/server";
import { fetchRawThaiWaterStations } from "@/lib/providers/thaiwater";
import { fetchRawBMAWaterStations } from "@/lib/providers/bma-water";
import type { MapMarker } from "@/components/map/FloodMap";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rawStations, bmaStations] = await Promise.all([
      fetchRawThaiWaterStations().catch((err) => {
        console.error("[stations API] ThaiWater fetch error:", err);
        return [];
      }),
      fetchRawBMAWaterStations().catch((err) => {
        console.error("[stations API] BMA fetch error:", err);
        return [];
      }),
    ]);

    // ── 1. Map ThaiWater stations ──────────────────────────────────────────
    const validThaiWater = rawStations.filter((s) => {
      if (!s.waterlevel_msl || isNaN(parseFloat(s.waterlevel_msl)))
        return false;
      if (!s.station?.tele_station_lat || !s.station?.tele_station_long)
        return false;
      return true;
    });

    const thaiWaterMarkers: MapMarker[] = validThaiWater.map((s) => {
      const wl = parseFloat(s.waterlevel_msl!);
      const isOverflow = s.diff_wl_bank_text?.includes("ล้น");
      const diff = s.diff_wl_bank ? parseFloat(s.diff_wl_bank) : null;

      let color = "#1d5aa8"; // Blue: normal
      let statusText = "ระดับปกติ";

      if (isOverflow) {
        color = "#b91c1c"; // Red: overflow
        statusText = "ล้นตลิ่ง!";
      } else if (diff !== null && diff < 0.5) {
        color = "#c2410c"; // Orange: near bank
        statusText = "เสี่ยงล้นตลิ่ง";
      } else if (diff !== null && diff < 1.0) {
        color = "#b45309"; // Yellow: watch
        statusText = "เฝ้าระวัง";
      } else {
        color = "#2d7d46"; // Green: safe
        statusText = "ปลอดภัย";
      }

      const name = s.station.tele_station_name.th || `สถานี ${s.station.id}`;
      const prov = s.geocode?.province_name?.th || "";
      const river = s.river_name || "ลำน้ำ";

      const popup = `
        <div style="font-family: sans-serif; font-size: 13px; line-height: 1.5; color: #1e293b;">
          <span style="display:inline-block; font-size: 10px; background: #f1f5f9; color: #475569; padding: 1px 5px; border-radius: 3px; font-weight: bold; margin-bottom: 2px;">สสน. / ThaiWater</span><br/>
          <strong style="font-size: 14px; color: #0f172a;">${name}</strong>
          ${prov ? `<span style="font-size: 11px; color: #64748b;"> (${prov})</span>` : ""}<br/>
          <span style="color: #475569;">แม่น้ำ: ${river}</span><br/>
          <span>ระดับน้ำ: <strong>${wl.toFixed(2)} ม.รทก.</strong></span><br/>
          ${diff !== null ? `<span>${isOverflow ? "⚠️ ล้นตลิ่ง:" : "ต่ำกว่าตลิ่ง:"} <strong>${Math.abs(diff).toFixed(2)} ม.</strong></span><br/>` : ""}
          ${s.discharge ? `<span>อัตราไหล: <strong>${parseFloat(s.discharge).toLocaleString()} ลบ.ม./วินาที</strong></span><br/>` : ""}
          <div style="margin-top: 4px; display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; background: ${color}20; color: ${color};">
            ${statusText}
          </div>
        </div>
      `;

      return {
        id: `tw-${s.station.id}`,
        latitude: s.station.tele_station_lat,
        longitude: s.station.tele_station_long,
        color,
        label: name,
        popup,
      };
    });

    // ── 2. Map BMA (Bangkok Drainage Department) stations ──────────────────
    const bmaMarkers: MapMarker[] = bmaStations
      .filter(
        (s) =>
          typeof s.latitude === "number" &&
          typeof s.longitude === "number" &&
          s.latitude !== 0 &&
          s.longitude !== 0 &&
          typeof s.wl_in === "number" &&
          !isNaN(s.wl_in),
      )
      .map((s) => {
        const wl = s.wl_in!;
        const warning =
          typeof s.warning === "number" && !isNaN(s.warning) ? s.warning : null;
        const critical =
          typeof s.critical === "number" && !isNaN(s.critical)
            ? s.critical
            : null;
        const isCritical =
          s.txtStatus?.includes("วิกฤต") || (critical !== null && wl >= critical);
        const isWarning =
          s.txtStatus?.includes("เตือน") || (warning !== null && wl >= warning);
        const isOffline = s.txtStatus?.includes("ขัดข้อง");

        let color = "#1d5aa8";
        let statusText = s.txtStatus || "ปกติ";
        if (isOffline) {
          color = "#64748b";
        } else if (isCritical) {
          color = "#b91c1c";
        } else if (isWarning) {
          color = "#c2410c";
        } else {
          color = "#2d7d46";
        }

        const name = s.water_name;
        const dist = s.district_name ? ` (${s.district_name})` : "";
        const river = s.river_name || "คลองในพื้นที่ กทม.";

        const popup = `
          <div style="font-family: sans-serif; font-size: 13px; line-height: 1.5; color: #1e293b;">
            <span style="display:inline-block; font-size: 10px; background: #e0f2fe; color: #0369a1; padding: 1px 5px; border-radius: 3px; font-weight: bold; margin-bottom: 2px;">สำนักการระบายน้ำ กทม.</span><br/>
            <strong style="font-size: 14px; color: #0f172a;">${name}</strong>${dist ? `<span style="font-size: 11px; color: #64748b;">${dist}</span>` : ""}<br/>
            <span style="color: #475569;">คลอง: ${river}</span><br/>
            <span>ระดับน้ำ: <strong>${wl.toFixed(2)} ม.รทก.</strong></span><br/>
            ${warning !== null ? `<span style="font-size: 11px; color: #b45309;">เกณฑ์เตือนภัย: ${warning.toFixed(2)} ม.</span><br/>` : ""}
            ${critical !== null ? `<span style="font-size: 11px; color: #b91c1c;">เกณฑ์วิกฤต: ${critical.toFixed(2)} ม.</span><br/>` : ""}
            ${s.site_timestampTH ? `<span style="font-size: 11px; color: #64748b;">ตรวจวัด: ${s.site_timestampTH}</span><br/>` : ""}
            <div style="margin-top: 4px; display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; background: ${color}20; color: ${color};">
              ${statusText}
            </div>
          </div>
        `;

        return {
          id: `bma-${s.water_id}`,
          latitude: s.latitude,
          longitude: s.longitude,
          color,
          label: name,
          popup,
        };
      });

    const allMarkers = [...thaiWaterMarkers, ...bmaMarkers];

    return NextResponse.json({
      stationsCount: allMarkers.length,
      thaiWaterCount: thaiWaterMarkers.length,
      bmaCount: bmaMarkers.length,
      markers: allMarkers,
    });
  } catch (err) {
    console.error("[stations API] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch stations" },
      { status: 500 },
    );
  }
}
