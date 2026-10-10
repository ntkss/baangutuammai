import { NextResponse } from "next/server";
import { fetchRealWaterLevel } from "@/lib/providers/thaiwater";
import { broadcastNotification } from "@/lib/notifications/pushService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // CRON_SECRET is mandatory — endpoint must not be publicly accessible.
    // Vercel Cron automatically sends Authorization: Bearer <CRON_SECRET>.
    if (!cronSecret) {
      console.error(
        "[Cron Push] CRON_SECRET env var is not set. Refusing to execute.",
      );
      return NextResponse.json(
        { error: "Server misconfiguration: CRON_SECRET is required" },
        { status: 503 },
      );
    }

    const providedSecret =
      authHeader?.replace("Bearer ", "") || searchParams.get("secret");
    if (providedSecret !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Default reference coordinate (Nonthaburi / Chao Phraya corridor)
    const data = await fetchRealWaterLevel(13.862, 100.514);
    if (!data || !data.northernRunoff) {
      return NextResponse.json({
        message: "No river telemetry data available",
      });
    }

    const c13 = data.northernRunoff.c13ChaoPhrayaDam;
    const c2 = data.northernRunoff.c2NakhonSawan;
    const c13Discharge = c13?.dischargeM3s ?? 0;

    let alertTriggered = false;
    let title = "";
    let body = "";

    if (c13Discharge >= 2500) {
      alertTriggered = true;
      title = "🚨 วิกฤตน้ำหลาก: เขื่อนเจ้าพระยาระบายน้ำแตะ 2,500 ลบ.ม./วิ";
      body = `อัตราการระบายปัจจุบัน ${c13Discharge.toLocaleString()} ลบ.ม./วินาที กรุณายกของขึ้นที่สูงและเฝ้าระวังระดับน้ำสูงสุด`;
    } else if (c13Discharge >= 2000) {
      alertTriggered = true;
      title = "⚠️ แจ้งเตือน: เขื่อนเจ้าพระยาเร่งระบายน้ำเกิน 2,000 ลบ.ม./วิ";
      body = `อัตราการระบายปัจจุบัน ${c13Discharge.toLocaleString()} ลบ.ม./วินาที ระดับน้ำท้ายเขื่อนและพื้นที่ริมตลิ่งจะเริ่มสูงขึ้น`;
    }

    if (alertTriggered) {
      const result = await broadcastNotification(
        {
          title,
          body,
          url: "/triggers",
          tag: "c13-critical-discharge",
        },
        (sub) => sub.preferences.c13AlertEnabled !== false,
      );

      return NextResponse.json({
        success: true,
        alertTriggered: true,
        c13Discharge,
        c2Discharge: c2?.dischargeM3s,
        sentCount: result.sent,
        failedCount: result.failed,
      });
    }

    return NextResponse.json({
      success: true,
      alertTriggered: false,
      c13Discharge,
      c2Discharge: c2?.dischargeM3s,
      message: "River levels currently within standard thresholds",
    });
  } catch (error) {
    console.error("[Cron Push] Error executing cron task:", error);
    return NextResponse.json(
      { error: "Failed to run cron job" },
      { status: 500 },
    );
  }
}
