import webpush from "web-push";

// Default fallback VAPID keys for development/testing if env vars are not set
const DEFAULT_VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  process.env.VAPID_PUBLIC_KEY ||
  "BIDbYeeDZpOQMcq70P5kXRH6Szv3tZ8pCZie_avdT-FrzsbLRoPuu1V5nqfGcmTfWMHyJ2i85NtSCm9otSg3kd0";

const DEFAULT_VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY || "nqfhAIf_w_lYdldKSeanjFHSRl7XtrRgNY7QrqFuvF4";

const DEFAULT_VAPID_SUBJECT =
  process.env.VAPID_SUBJECT || "mailto:contact@baangutuammai.com";

let isVapidConfigured = false;

export function getVapidKeys() {
  return {
    publicKey: DEFAULT_VAPID_PUBLIC_KEY,
    privateKey: DEFAULT_VAPID_PRIVATE_KEY,
    subject: DEFAULT_VAPID_SUBJECT,
  };
}

export function ensureVapidConfigured(): void {
  if (isVapidConfigured) return;
  const { subject, publicKey, privateKey } = getVapidKeys();
  webpush.setVapidDetails(subject, publicKey, privateKey);
  isVapidConfigured = true;
}
