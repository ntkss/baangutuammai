import { BottomNav } from "@/components/common/BottomNav";
import { NAV_LABELS } from "@/lib/i18n/th";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ประวัติ — บ้านกู้ท่วมไหม",
  description:
    "ประวัติระดับน้ำและเหตุการณ์น้ำท่วมที่ผ่านมา เปรียบเทียบกับปี 2554",
};

export default function HistoryPage() {
  return (
    <>
      <main className="page" id="main-content">
        <h1
          style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "12px" }}
        >
          📊 {NAV_LABELS.history}
        </h1>
        <div
          className="card"
          style={{
            minHeight: "320px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: "12px",
            color: "var(--color-text-muted)",
          }}
        >
          <span style={{ fontSize: "3rem" }}>📊</span>
          <p style={{ fontSize: "0.9rem", margin: 0, textAlign: "center" }}>
            ประวัติระดับน้ำ
          </p>
          <p style={{ fontSize: "0.78rem", margin: 0, textAlign: "center" }}>
            กราฟแนวโน้มระดับน้ำและเปรียบเทียบกับเหตุการณ์สำคัญในอดีต กำลังพัฒนา
          </p>
        </div>
      </main>
      <BottomNav />
    </>
  );
}
