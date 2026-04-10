import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyBookingReminder } from "@/lib/line/notify";

export async function GET(request: Request) {
  // Vercel Cronからの呼び出しを検証
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // 明日の確定済み予約を取得
  const now = new Date();
  const tomorrowStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1
  );
  const tomorrowEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 2
  );

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("status", "confirmed")
    .gte("start_at", tomorrowStart.toISOString())
    .lt("start_at", tomorrowEnd.toISOString());

  let sent = 0;
  for (const booking of bookings || []) {
    try {
      await notifyBookingReminder(booking.id);
      sent++;
    } catch (e) {
      console.error(`Reminder failed for booking ${booking.id}:`, e);
    }
  }

  // 過去のブロック枠を削除
  const { count: deletedBlocks } = await supabase
    .from("blocked_slots")
    .delete({ count: "exact" })
    .lt("end_at", new Date().toISOString());

  return NextResponse.json({ sent, total: bookings?.length || 0, deletedBlocks: deletedBlocks || 0 });
}
