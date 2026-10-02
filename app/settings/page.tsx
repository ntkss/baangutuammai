import { BottomNav } from "@/components/common/BottomNav";
import { Footer } from "@/components/common/Footer";
import { NotificationSettingsCard } from "@/components/notifications/NotificationSettingsCard";
import { NAV_LABELS, UI_TEXT } from "@/lib/i18n/th";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ตั้งค่า — บ้านกูจะน้ำท่วมมั้ย",
  description:
    "ตั้งค่าตำแหน่งบ้าน ระดับพื้นบ้าน และการแจ้งเตือนเตือนภัยน้ำท่วม",
};

export default function SettingsPage() {
  return (
    <>
      <main
        className="page"
        id="main-content"
        style={{ paddingBottom: "110px" }}
      >
        <h1
          style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "16px" }}
        >
          ⚙️ {NAV_LABELS.settings}
        </h1>

        {/* Location section */}
        <div className="card" style={{ marginBottom: "12px" }}>
          <h2
            style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 12px 0" }}
          >
            📍 {UI_TEXT.locationTitle}
          </h2>
          <div className="data-row">
            <span className="data-row__label">{UI_TEXT.myHome}</span>
            <span
              className="data-row__value"
              style={{ color: "var(--color-text-muted)" }}
            >
              ยังไม่ได้ตั้งค่า
            </span>
          </div>
          <div className="data-row">
            <span className="data-row__label">
              {UI_TEXT.estimatedElevation}
            </span>
            <span
              className="data-row__value"
              style={{ color: "var(--color-text-muted)" }}
            >
              —
            </span>
          </div>
          <div className="data-row">
            <span className="data-row__label">{UI_TEXT.floorElevation}</span>
            <span
              className="data-row__value"
              style={{ color: "var(--color-text-muted)" }}
            >
              —
            </span>
          </div>
          <button
            id="set-location-btn"
            className="btn btn--primary"
            style={{ marginTop: "12px", width: "100%" }}
          >
            {UI_TEXT.selectLocation}
          </button>
        </div>

        {/* Web Push Notifications section */}
        <NotificationSettingsCard />

        {/* Data source info */}
        <div className="card">
          <h2
            style={{ fontSize: "1rem", fontWeight: 600, margin: "0 0 8px 0" }}
          >
            📡 {UI_TEXT.dataSource}
          </h2>
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--color-text-muted)",
              margin: 0,
              lineHeight: 1.7,
            }}
          >
            ข้อมูลระดับน้ำ: สถาบันสารสนเทศทรัพยากรน้ำ (HII / ThaiWater)
            <br />
            ข้อมูลฝน: HII / กรมทรัพยากรน้ำ (DWR)
            <br />
            ข้อมูลอ่างเก็บน้ำ: กรมชลประทาน (RID)
            <br />
            ข้อมูลภูมิประเทศ: HII / แหล่งข้อมูลภาครัฐ
          </p>
        </div>

        <Footer showDisclaimer={false} />
      </main>
      <BottomNav />
    </>
  );
}
