import { NextResponse } from "next/server";
import { fetchRawThaiWaterStations } from "@/lib/providers/thaiwater";
import type { MapMarker } from "@/components/map/FloodMap";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rawStations = await fetchRawThaiWaterStations();

    // Filter stations in Central / Chao Phraya / Pasak / Tha Chin basins or major rivers
    const valid = rawStations.filter((s) => {
      if (!s.waterlevel_msl || isNaN(parseFloat(s.waterlevel_msl))) return false;
      if (!s.station?.tele_station_lat || !s.station?.tele_station_long) return false;
      return true;
    });

    // Map to MapMarker
    const markers: MapMarker[] = valid.map((s) => {
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

    return NextResponse.json({
      stationsCount: markers.length,
      markers,
    });
  } catch (err) {
    console.error("[stations API] Error:", err);
    return NextResponse.json({ error: "Failed to fetch stations" }, { status: 500 });
  }
}
