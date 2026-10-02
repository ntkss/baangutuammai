import { NextResponse } from "next/server";
import { getVapidKeys } from "@/lib/notifications/vapid";

export async function GET() {
  const { publicKey } = getVapidKeys();
  return NextResponse.json({ publicKey });
}
