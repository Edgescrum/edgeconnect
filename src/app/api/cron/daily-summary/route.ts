import { NextResponse } from "next/server";
import { notifyDailySummary } from "@/lib/line/notify";

export async function GET(request: Request) {
  // Vercel Cronからの呼び出しを検証
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await notifyDailySummary();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Daily summary failed:", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
