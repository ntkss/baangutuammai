import webpush, { WebPushError } from "web-push";
import { ensureVapidConfigured } from "./vapid";
import {
  getAllSubscriptions,
  cleanInvalidSubscriptions,
  removeSubscription,
} from "./storage";
import type { StoredSubscription, NotificationPayload } from "./types";

export async function sendNotificationToSubscription(
  sub: StoredSubscription,
  payload: NotificationPayload,
): Promise<{ success: boolean; shouldDelete?: boolean }> {
  ensureVapidConfigured();

  const pushSubscription = {
    endpoint: sub.endpoint,
    keys: sub.keys,
  };

  const stringPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icon-192.png",
    badge: payload.badge || "/icon-192.png",
    url: payload.url || "/",
    tag: payload.tag || "flood-alert",
    timestamp: payload.timestamp || Date.now(),
  });

  try {
    await webpush.sendNotification(pushSubscription, stringPayload);
    return { success: true };
  } catch (error) {
    if (error instanceof WebPushError) {
      // Status 410 Gone or 404 Not Found indicates subscription has expired or was unsubscribed
      if (error.statusCode === 410 || error.statusCode === 404) {
        return { success: false, shouldDelete: true };
      }
    }
    console.error(
      `[PushService] Failed to send to ${sub.endpoint.slice(0, 30)}...:`,
      error,
    );
    return { success: false, shouldDelete: false };
  }
}

export async function broadcastNotification(
  payload: NotificationPayload,
  filter?: (sub: StoredSubscription) => boolean,
): Promise<{ sent: number; failed: number; total: number }> {
  const all = await getAllSubscriptions();
  const targets = filter ? all.filter(filter) : all;

  let sent = 0;
  let failed = 0;
  const invalidEndpoints: string[] = [];

  const promises = targets.map(async (sub) => {
    const res = await sendNotificationToSubscription(sub, payload);
    if (res.success) {
      sent++;
    } else {
      failed++;
      if (res.shouldDelete) {
        invalidEndpoints.push(sub.endpoint);
      }
    }
  });

  await Promise.all(promises);

  if (invalidEndpoints.length > 0) {
    await cleanInvalidSubscriptions(invalidEndpoints);
  }

  return { sent, failed, total: targets.length };
}

export async function sendTestNotificationToEndpoint(
  endpoint: string,
  keys: { p256dh: string; auth: string },
): Promise<{ success: boolean; error?: string }> {
  ensureVapidConfigured();

  const tempSub: StoredSubscription = {
    id: "test",
    endpoint,
    keys,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    preferences: {},
  };

  const payload: NotificationPayload = {
    title: "🔔 ทดสอบการแจ้งเตือนเตือนภัยน้ำท่วม",
    body: "ระบบพร้อมส่งการแจ้งเตือนเมื่อเขื่อนระบายน้ำเกินเกณฑ์ หรือระดับน้ำวิกฤตแล้ว!",
    url: "/settings",
    tag: "test-alert",
  };

  const res = await sendNotificationToSubscription(tempSub, payload);
  if (!res.success) {
    if (res.shouldDelete) {
      await removeSubscription(endpoint);
    }
    return {
      success: false,
      error: "Push service failed or token was rejected by browser.",
    };
  }

  return { success: true };
}
