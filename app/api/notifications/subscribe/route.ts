import { NextResponse } from "next/server";
import { saveSubscription } from "@/lib/notifications/storage";
import type { StoredSubscription, PushSubscriptionPayload, NotificationPreferences } from "@/lib/notifications/types";

interface SubscribeRequestBody {
  subscription: PushSubscriptionPayload;
  preferences?: NotificationPreferences;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubscribeRequestBody;
    const { subscription, preferences } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
    }

    const storedSub: StoredSubscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preferences: {
        latitude: preferences?.latitude,
        longitude: preferences?.longitude,
        floorElevationM: preferences?.floorElevationM,
        c13AlertEnabled: preferences?.c13AlertEnabled ?? true,
        waterLevelAlertEnabled: preferences?.waterLevelAlertEnabled ?? true,
      },
    };

    await saveSubscription(storedSub);

    return NextResponse.json({ success: true, id: storedSub.id });
  } catch (error) {
    console.error("[Subscribe API] Error saving subscription:", error);
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}
