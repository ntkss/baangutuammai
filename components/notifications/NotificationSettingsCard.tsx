"use client";

import { useState } from "react";
import { Bell, BellOff, BellRing, Check, AlertTriangle, Smartphone, Loader2 } from "lucide-react";
import { useWebPush } from "@/lib/notifications/useWebPush";
import { useUserPrefs } from "@/lib/store/userPrefs";

export function NotificationSettingsCard() {
  const { homeLocation } = useUserPrefs();
  const {
    isSupported,
    isIOS,
    isStandalone,
    permission,
    isSubscribed,
    isLoading,
    isTesting,
    statusMessage,
    subscribe,
    unsubscribe,
    sendTestNotification,
  } = useWebPush();

  const [c13Alert, setC13Alert] = useState(true);
  const [waterLevelAlert, setWaterLevelAlert] = useState(true);

  const handleToggle = async () => {
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe({
        latitude: homeLocation?.latitude,
        longitude: homeLocation?.longitude,
        floorElevationM: homeLocation?.floorElevationM,
        c13AlertEnabled: c13Alert,
        waterLevelAlertEnabled: waterLevelAlert,
      });
    }
  };

  return (
    <div className="card" style={{ marginBottom: "12px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: isSubscribed ? "rgba(37, 99, 235, 0.1)" : "var(--color-surface-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isSubscribed ? "var(--color-accent)" : "var(--color-text-muted)",
            }}
          >
            {isSubscribed ? <BellRing size={18} /> : <Bell size={18} />}
          </span>
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, margin: 0 }}>
              การแจ้งเตือนเตือนภัยน้ำท่วม (Web Push)
            </h2>
            <p style={{ fontSize: "0.76rem", color: "var(--color-text-muted)", margin: "2px 0 0 0" }}>
              แจ้งเตือนอัตโนมัติเมื่อเขื่อนระบายน้ำเกินเกณฑ์ หรือระดับน้ำวิกฤต
            </p>
          </div>
        </div>
      </div>

      {/* iOS Standalone Warning */}
      {isIOS && !isStandalone && (
        <div
          style={{
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "10px",
            padding: "10px 12px",
            marginTop: "10px",
            marginBottom: "12px",
            fontSize: "0.78rem",
            color: "#1e40af",
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            lineHeight: 1.5,
          }}
        >
          <Smartphone size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong>คำแนะนำสำหรับ iPhone (iOS 16.4+):</strong>
            <br />
            กรุณากดปุ่ม <strong>แชร์ ⬆️</strong> ใน Safari แล้วเลือก <strong>&quot;เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)&quot;</strong> ก่อน จึงจะสามารถเปิดรับการแจ้งเตือนแบบพุชได้
          </div>
        </div>
      )}

      {/* Permission Denied Warning */}
      {permission === "denied" && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "10px",
            padding: "10px 12px",
            marginTop: "10px",
            marginBottom: "12px",
            fontSize: "0.78rem",
            color: "#dc2626",
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <strong>การแจ้งเตือนถูกบล็อก:</strong>
            <br />
            คุณได้ปิดการอนุญาตแจ้งเตือนไว้ กรุณาเข้าไปเปิดสิทธิ์ในการตั้งค่าของเบราว์เซอร์
          </div>
        </div>
      )}

      {/* Master Toggle Button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 0",
          borderTop: "1px solid var(--color-border-subtle)",
          borderBottom: isSubscribed ? "1px solid var(--color-border-subtle)" : "none",
          marginTop: "8px",
        }}
      >
        <div>
          <div style={{ fontSize: "0.88rem", fontWeight: 600 }}>
            {isSubscribed ? "เปิดรับการแจ้งเตือนแล้ว" : "เปิดรับการแจ้งเตือน"}
          </div>
          <div style={{ fontSize: "0.74rem", color: "var(--color-text-muted)" }}>
            {isSubscribed ? "ระบบจะแจ้งเตือนเมื่อเกิดสถานการณ์วิกฤต" : "รับข้อความเตือนภัยแม้ปิดแอป"}
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          disabled={isLoading || !isSupported || (isIOS && !isStandalone)}
          style={{
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "0.82rem",
            fontWeight: 600,
            border: "none",
            cursor: isLoading || !isSupported || (isIOS && !isStandalone) ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: isSubscribed ? "rgba(220, 38, 38, 0.1)" : "var(--color-accent)",
            color: isSubscribed ? "var(--color-severe)" : "#ffffff",
            transition: "all 0.2s ease",
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={14} className="spin" />
              <span>กำลังประมวลผล...</span>
            </>
          ) : isSubscribed ? (
            <>
              <BellOff size={14} />
              <span>ปิดการแจ้งเตือน</span>
            </>
          ) : (
            <>
              <Bell size={14} />
              <span>เปิดใช้งาน</span>
            </>
          )}
        </button>
      </div>

      {/* Detailed Alert Conditions (visible when subscribed) */}
      {isSubscribed && (
        <div style={{ paddingTop: "12px", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--color-text-secondary)" }}>
            เงื่อนไขที่ต้องการรับแจ้งเตือน:
          </div>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.8rem",
              color: "var(--color-text-primary)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={c13Alert}
              onChange={(e) => setC13Alert(e.target.checked)}
              style={{ accentColor: "var(--color-accent)", width: "16px", height: "16px" }}
            />
            <span>⚡ เขื่อนเจ้าพระยา (C.13) ระบายน้ำเกิน 2,000 ลบ.ม./วิ</span>
          </label>

          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.8rem",
              color: "var(--color-text-primary)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={waterLevelAlert}
              onChange={(e) => setWaterLevelAlert(e.target.checked)}
              style={{ accentColor: "var(--color-accent)", width: "16px", height: "16px" }}
            />
            <span>🌊 ระดับผิวน้ำใกล้ระดับพื้นบ้าน (Freeboard ต่ำกว่า 0.50 ม.)</span>
          </label>

          {/* Test Push Button */}
          <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              onClick={sendTestNotification}
              disabled={isTesting}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "0.78rem",
                fontWeight: 600,
                border: "1px solid var(--color-border)",
                background: "var(--color-surface-2)",
                color: "var(--color-text-primary)",
                cursor: isTesting ? "wait" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.15s ease",
              }}
            >
              {isTesting ? <Loader2 size={13} className="spin" /> : <BellRing size={13} />}
              <span>{isTesting ? "กำลังส่งข้อความ..." : "ทดสอบส่งการแจ้งเตือนทันที"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Status Message */}
      {statusMessage && (
        <div
          style={{
            marginTop: "12px",
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "0.76rem",
            background: statusMessage.includes("สำเร็จ") ? "#f0fdf4" : "#fef2f2",
            color: statusMessage.includes("สำเร็จ") ? "#15803d" : "#b91c1c",
            border: `1px solid ${statusMessage.includes("สำเร็จ") ? "#bbf7d0" : "#fecaca"}`,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {statusMessage.includes("สำเร็จ") ? <Check size={14} /> : <AlertTriangle size={14} />}
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}
