import { NextResponse } from "next/server";
import { sendTestNotificationToEndpoint } from "@/lib/notifications/pushService";
import { getAllSubscriptions } from "@/lib/notifications/storage";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: "Missing subscription keys or endpoint" },
        { status: 400 },
      );
    }

    // Security: only allow sending test notifications to known subscribers.
    // This prevents this endpoint from being abused as a push-spam proxy.
    const allSubs = await getAllSubscriptions();
    const isKnown = allSubs.some((s) => s.endpoint === endpoint);
    if (!isKnown) {
      return NextResponse.json(
        { error: "Endpoint is not a registered subscriber" },
        { status: 403 },
      );
    }

    const result = await sendTestNotificationToEndpoint(endpoint, keys);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to deliver test notification" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test notification delivered successfully",
    });
  } catch (error) {
    console.error("[Test Notification API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
