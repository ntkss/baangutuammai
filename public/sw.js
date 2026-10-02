/**
 * BaanGuTuamMai — Service Worker for Web Push Notifications & Offline Caching
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = {
      title: "บ้านกูจะน้ำท่วมมั้ย",
      body: event.data.text(),
    };
  }

  const title = data.title || "⚠️ แจ้งเตือนระดับน้ำ — บ้านกูจะน้ำท่วมมั้ย";
  const options = {
    body: data.body || "มีการอัปเดตสถานการณ์น้ำท่วมล่าสุด",
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    tag: data.tag || "flood-alert",
    renotify: true,
    data: {
      url: data.url || "/",
      timestamp: data.timestamp || Date.now(),
    },
    vibrate: [200, 100, 200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and navigate
      for (const client of clientList) {
        if ("focus" in client) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    }),
  );
});
