import { NextResponse } from "next/server";
import { removeSubscription } from "@/lib/notifications/storage";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { endpoint } = body;

    if (!endpoint || typeof endpoint !== "string") {
      return NextResponse.json(
        { error: "Endpoint is required" },
        { status: 400 },
      );
    }

    const removed = await removeSubscription(endpoint);
    return NextResponse.json({ success: true, removed });
  } catch (error) {
    console.error("[Unsubscribe API] Error removing subscription:", error);
    return NextResponse.json(
      { error: "Failed to remove subscription" },
      { status: 500 },
    );
  }
}
