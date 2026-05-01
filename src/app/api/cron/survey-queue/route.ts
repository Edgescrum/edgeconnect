import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { log, logError } from "@/lib/log";

/**
 * ステップ1: アンケート送信キュー登録cron
 * - end_at < now() かつ status = 'confirmed' の予約を検出
 * - 配信頻度判定: 初回必須、2回目以降は3回に1回（1,4,7,10...回目）
 * - pending_survey_notifications にレコード登録
 * - scheduled_at は翌日10:00 JST
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();

  try {
    // 既にキュー登録済みのbooking_idを取得
    const { data: existingQueue } = await supabase
      .from("pending_survey_notifications")
      .select("booking_id");

    const existingIds = new Set((existingQueue || []).map((q) => q.booking_id));

    // 終了済みの confirmed 予約を取得
    const { data: allCompleted, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, customer_user_id, provider_id")
      .eq("status", "confirmed")
      .lt("end_at", now.toISOString());

    if (bookingsError) {
      logError("cron-survey-queue", "bookings query failed", bookingsError.message);
      return NextResponse.json({ error: "Failed to query bookings" }, { status: 500 });
    }

    // キュー登録済みを除外
    const newBookings = (allCompleted || []).filter((b) => !existingIds.has(b.id));
    return await processBookings(supabase, newBookings, now);
  } catch (e) {
    logError("cron-survey-queue", "unexpected error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function processBookings(
  supabase: ReturnType<typeof createAdminClient>,
  bookings: { id: string; customer_user_id: number; provider_id: number }[],
  now: Date
) {
  if (bookings.length === 0) {
    log("cron-survey-queue", "No new completed bookings to process");
    return NextResponse.json({ queued: 0, skipped: 0 });
  }

  // 翌日10:00 JST を計算
  const jstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const jstYear = jstNow.getUTCFullYear();
  const jstMonth = jstNow.getUTCMonth();
  const jstDate = jstNow.getUTCDate();
  // 翌日10:00 JST = 翌日01:00 UTC
  const scheduledAt = new Date(Date.UTC(jstYear, jstMonth, jstDate + 1, 1, 0, 0));

  let queued = 0;
  let skipped = 0;

  for (const booking of bookings) {
    try {
      // 訪問回数を取得/更新
      const { data: visitCount } = await supabase
        .from("customer_visit_counts")
        .select("visit_count")
        .eq("customer_user_id", booking.customer_user_id)
        .eq("provider_id", booking.provider_id)
        .single();

      const currentCount = (visitCount?.visit_count || 0) + 1;

      // 訪問回数をupsert
      await supabase
        .from("customer_visit_counts")
        .upsert(
          {
            customer_user_id: booking.customer_user_id,
            provider_id: booking.provider_id,
            visit_count: currentCount,
            updated_at: now.toISOString(),
          },
          { onConflict: "customer_user_id,provider_id" }
        );

      // 配信頻度判定: 初回(1)は必須、2回目以降は3回に1回（1,4,7,10...）
      // つまり (count - 1) % 3 === 0
      const shouldSend = currentCount === 1 || (currentCount - 1) % 3 === 0;

      if (!shouldSend) {
        skipped++;
        continue;
      }

      // キュー登録
      const { error: insertError } = await supabase
        .from("pending_survey_notifications")
        .insert({
          booking_id: booking.id,
          customer_user_id: booking.customer_user_id,
          provider_id: booking.provider_id,
          scheduled_at: scheduledAt.toISOString(),
          status: "pending",
        });

      if (insertError) {
        // ユニーク制約違反は無視（二重キュー登録防止）
        if (insertError.code === "23505") {
          skipped++;
          continue;
        }
        logError("cron-survey-queue", `Failed to queue booking ${booking.id}`, insertError.message);
        continue;
      }

      queued++;
    } catch (e) {
      logError("cron-survey-queue", `Error processing booking ${booking.id}`, e);
    }
  }

  log("cron-survey-queue", `Processed: queued=${queued}, skipped=${skipped}`);
  return NextResponse.json({ queued, skipped });
}
