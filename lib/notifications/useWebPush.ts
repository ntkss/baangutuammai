"use client";

import { useState, useEffect, useCallback } from "react";
import type { NotificationPreferences } from "./types";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function useWebPush() {
  const [isSupported] = useState(() => {
    if (typeof window === "undefined") return false;
    return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  });

  const [isIOS] = useState(() => {
    if (typeof window === "undefined") return false;
    return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  });

  const [isStandalone] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });

  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "default";
    return Notification.permission;
  });

  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(() => isSupported);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Register service worker and inspect existing subscription
  useEffect(() => {
    if (!isSupported) {
      return;
    }

    let ignore = false;
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        return registration.pushManager.getSubscription();
      })
      .then((sub) => {
        if (!ignore) {
          setSubscription(sub);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("[useWebPush] Service Worker registration failed:", err);
        if (!ignore) {
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [isSupported]);

  const subscribe = useCallback(
    async (preferences?: NotificationPreferences) => {
      if (!isSupported) {
        setStatusMessage("เบราว์เซอร์นี้ยังไม่รองรับ Web Push");
        return false;
      }

      setIsLoading(true);
      setStatusMessage(null);

      try {
        // Request user permission
        const perm = await Notification.requestPermission();
        setPermission(perm);

        if (perm !== "granted") {
          setStatusMessage("คุณยังไม่ได้อนุญาตการแจ้งเตือนในเบราว์เซอร์");
          setIsLoading(false);
          return false;
        }

        // Fetch server VAPID public key
        const keyRes = await fetch("/api/notifications/vapid-public-key");
        if (!keyRes.ok) throw new Error("Could not fetch VAPID key");
        const { publicKey } = await keyRes.json();

        // Get Service Worker registration
        const registration = await navigator.serviceWorker.ready;

        // Subscribe to PushManager
        const applicationServerKey = urlBase64ToUint8Array(publicKey);
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey as BufferSource,
        });

        // Send to backend
        const subJson = sub.toJSON();
        const saveRes = await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: {
              endpoint: sub.endpoint,
              keys: {
                p256dh: subJson.keys?.p256dh,
                auth: subJson.keys?.auth,
              },
            },
            preferences,
          }),
        });

        if (!saveRes.ok) throw new Error("Failed to register subscription on server");

        setSubscription(sub);
        setStatusMessage("เปิดการแจ้งเตือนสำเร็จแล้ว!");
        return true;
      } catch (error) {
        console.error("[useWebPush] Subscribe error:", error);
        setStatusMessage("เกิดข้อผิดพลาดในการเปิดการแจ้งเตือน");
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [isSupported],
  );

  const unsubscribe = useCallback(async () => {
    if (!subscription) return true;

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      await fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      });

      setSubscription(null);
      setStatusMessage("ปิดการแจ้งเตือนแล้ว");
      return true;
    } catch (error) {
      console.error("[useWebPush] Unsubscribe error:", error);
      setStatusMessage("เกิดข้อผิดพลาดในการยกเลิก");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [subscription]);

  const sendTestNotification = useCallback(async () => {
    if (!subscription) {
      setStatusMessage("กรุณากดเปิดรับการแจ้งเตือนก่อนทดสอบ");
      return false;
    }

    setIsTesting(true);
    setStatusMessage(null);

    try {
      const subJson = subscription.toJSON();
      const res = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subJson.keys?.p256dh,
            auth: subJson.keys?.auth,
          },
        }),
      });

      if (!res.ok) throw new Error("Test delivery failed");

      setStatusMessage("ส่งการแจ้งเตือนทดสอบแล้ว! ตรวจสอบหน้าจอของคุณ");
      return true;
    } catch (error) {
      console.error("[useWebPush] Test notification error:", error);
      setStatusMessage("ส่งข้อความทดสอบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return false;
    } finally {
      setIsTesting(false);
    }
  }, [subscription]);

  return {
    isSupported,
    isIOS,
    isStandalone,
    permission,
    isSubscribed: Boolean(subscription),
    isLoading,
    isTesting,
    statusMessage,
    subscribe,
    unsubscribe,
    sendTestNotification,
  };
}
