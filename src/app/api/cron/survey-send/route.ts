import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pushFlexMessage } from "@/lib/line/messaging";
import { surveyNotification } from "@/lib/line/templates";
import { log, logError } from "@/lib/log";
import { brand } from "@/lib/brand";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID!;

/**
 * ステップ2: アンケート送信実行cron
 * - 毎日10:00 JST に実行
 * - pending_survey_notifications から pending かつ scheduled_at <= now() を取得
 * - LINE Flex Message を送信
 * - 送信成功: status = sent, sent_at を更新
 * - 送信失敗: status = failed
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
    // pending かつ scheduled_at <= now のレコードを取得
    const { data: notifications, error: queryError } = await supabase
      .from("pending_survey_notifications")
      .select(`
        id, booking_id, customer_user_id, provider_id,
        bookings:booking_id (
          start_at, end_at,
          services:service_id ( name )
        )
      `)
      .eq("status", "pending")
      .lte("scheduled_at", now.toISOString());

    if (queryError) {
      logError("cron-survey-send", "query error", queryError.message);
      return NextResponse.json({ error: "Failed to query notifications" }, { status: 500 });
    }

    if (!notifications || notifications.length === 0) {
      log("cron-survey-send", "No pending notifications to send");
      return NextResponse.json({ sent: 0, failed: 0 });
    }

    // 事業主情報を一括取得
    const providerIds = [...new Set(notifications.map((n) => n.provider_id))];
    const { data: providers } = await supabase
      .from("providers")
      .select("id, name, icon_url, brand_color")
      .in("id", providerIds);

    const providerMap = new Map(
      (providers || []).map((p) => [p.id, p])
    );

    // お客さんのLINE user IDを一括取得
    const customerIds = [...new Set(notifications.map((n) => n.customer_user_id))];
    const { data: customers } = await supabase
      .from("users")
      .select("id, line_user_id")
      .in("id", customerIds);

    const customerMap = new Map(
      (customers || []).map((c) => [c.id, c.line_user_id])
    );

    let sent = 0;
    let failed = 0;

    for (const notification of notifications) {
      try {
        const lineUserId = customerMap.get(notification.customer_user_id);
        if (!lineUserId) {
          logError("cron-survey-send", `Customer ${notification.customer_user_id} not found`);
          await supabase
            .from("pending_survey_notifications")
            .update({ status: "failed" })
            .eq("id", notification.id);
          failed++;
          continue;
        }

        const provider = providerMap.get(notification.provider_id);
        const booking = Array.isArray(notification.bookings)
          ? notification.bookings[0]
          : notification.bookings;
        const service = booking
          ? Array.isArray((booking as Record<string, unknown>).services)
            ? ((booking as Record<string, unknown>).services as Record<string, unknown>[])[0]
            : (booking as Record<string, unknown>).services
          : null;

        const startAt = booking ? new Date((booking as Record<string, unknown>).start_at as string) : new Date();
        const days = ["日", "月", "火", "水", "木", "金", "土"];
        const dateStr = `${startAt.getMonth() + 1}月${startAt.getDate()}日(${days[startAt.getDay()]})`;

        const flexContent = surveyNotification({
          providerName: (provider?.name as string) || "",
          serviceName: (service as Record<string, unknown>)?.name as string || "",
          dateStr,
          liffId: LIFF_ID,
          brandColor: (provider?.brand_color as string) || brand.primary,
        });

        await pushFlexMessage(
          lineUserId,
          `${provider?.name || "PeCo"}：サービスのご感想をお聞かせください`,
          flexContent,
          provider ? { name: (provider.name as string) || "PeCo", iconUrl: provider.icon_url as string | null } : undefined
        );

        // 送信成功
        await supabase
          .from("pending_survey_notifications")
          .update({ status: "sent", sent_at: now.toISOString() })
          .eq("id", notification.id);
        sent++;
      } catch (e) {
        logError("cron-survey-send", `Failed to send notification ${notification.id}`, e);
        await supabase
          .from("pending_survey_notifications")
          .update({ status: "failed" })
          .eq("id", notification.id);
        failed++;
      }
    }

    log("cron-survey-send", `Completed: sent=${sent}, failed=${failed}`);
    return NextResponse.json({ sent, failed });
  } catch (e) {
    logError("cron-survey-send", "unexpected error", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
