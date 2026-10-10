import webpush from "web-push";

// VAPID keys must be set via environment variables — no hardcoded fallbacks.
// Run: npx web-push generate-vapid-keys  to create a new key pair.
const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;

const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:contact@baangutuammai.com";

let isVapidConfigured = false;

export function getVapidKeys() {
  if (!VAPID_PUBLIC_KEY) {
    throw new Error(
      "[VAPID] VAPID_PUBLIC_KEY / NEXT_PUBLIC_VAPID_PUBLIC_KEY env var is not set.",
    );
  }
  return {
    publicKey: VAPID_PUBLIC_KEY,
    privateKey: VAPID_PRIVATE_KEY ?? "",
    subject: VAPID_SUBJECT,
  };
}

export function ensureVapidConfigured(): void {
  if (isVapidConfigured) return;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error(
      "[VAPID] VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars must be set. " +
        "Run: npx web-push generate-vapid-keys",
    );
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  isVapidConfigured = true;
}
