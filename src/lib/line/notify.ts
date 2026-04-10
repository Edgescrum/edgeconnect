import { createAdminClient } from "@/lib/supabase/admin";
import { pushFlexMessage } from "./messaging";
import { log, logError } from "@/lib/log";
import {
  bookingConfirmedCustomer,
  bookingCancelledCustomer,
  bookingCancelledProvider,
  bookingReminder,
  dailySummaryProvider,
} from "./templates";
import type { DailySummaryBooking } from "./templates";
import { generateGoogleCalendarUrl } from "@/lib/calendar/ics";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID!;

interface BookingWithDetails {
  id: string;
  start_at: string;
  end_at: string;
  customer_name: string | null;
  customer_user_id: number;
  provider_id: number;
  service_id: number;
}

async function getBookingDetails(bookingId: string) {
  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, start_at, end_at, customer_name, customer_user_id, provider_id, service_id")
    .eq("id", bookingId)
    .single();

  if (!booking) return null;

  const { data: service } = await supabase
    .from("services")
    .select("name, price, duration_min, cancel_deadline_hours")
    .eq("id", booking.service_id)
    .single();

  const { data: provider } = await supabase
    .from("providers")
    .select("name, slug, user_id, icon_url, brand_color")
    .eq("id", booking.provider_id)
    .single();

  const { data: customer } = await supabase
    .from("users")
    .select("line_user_id, display_name")
    .eq("id", booking.customer_user_id)
    .single();

  const { data: providerUser } = await supabase
    .from("users")
    .select("line_user_id")
    .eq("id", provider?.user_id)
    .single();

  if (!service || !provider || !customer || !providerUser) return null;

  const startAt = new Date(booking.start_at);
  const endAt = new Date(booking.end_at);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const dateStr = `${startAt.getMonth() + 1}月${startAt.getDate()}日（${days[startAt.getDay()]}）`;
  const timeStr = `${startAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`;

  // キャンセル期限の表示文字列を生成
  let cancelDeadlineStr: string | undefined;
  if (service.cancel_deadline_hours > 0) {
    const deadlineAt = new Date(startAt.getTime() - service.cancel_deadline_hours * 60 * 60 * 1000);
    cancelDeadlineStr = `${deadlineAt.getMonth() + 1}月${deadlineAt.getDate()}日 ${deadlineAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}まで`;
  }

  return {
    booking: booking as BookingWithDetails,
    service,
    provider,
    providerUser,
    customer,
    dateStr,
    timeStr,
    info: {
      bookingId: booking.id,
      providerName: provider.name || "",
      providerSlug: provider.slug,
      providerIconUrl: provider.icon_url || undefined,
      brandColor: provider.brand_color || "#6366f1",
      serviceName: service.name,
      durationMin: service.duration_min,
      dateStr,
      timeStr,
      price: service.price,
      customerName: booking.customer_name || customer.display_name || "お客さま",
      liffId: LIFF_ID,
      cancelDeadlineStr,
      googleCalendarUrl: generateGoogleCalendarUrl(
        `${provider.name}（${service.name}）`,
        startAt,
        endAt,
        `料金: ¥${service.price.toLocaleString()}`
      ),
      appleCalendarUrl: `${process.env.NEXT_PUBLIC_VERCEL_URL ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}` : "https://edgeconnect.vercel.app"}/api/calendar/event/${booking.id}.ics`,
    },
  };
}

// 予約確定通知（お客さん + 事業主）
export async function notifyBookingConfirmed(bookingId: string) {
  log("notify", "bookingConfirmed", { bookingId });
  const details = await getBookingDetails(bookingId);
  if (!details) { logError("notify", "bookingConfirmed: details not found", { bookingId }); return; }

  const { info, customer, providerUser, provider } = details;

  // お客さんに通知（事業主アイコン・名前で送信）
  await pushFlexMessage(
    customer.line_user_id,
    `${info.providerName}：予約が確定しました`,
    bookingConfirmedCustomer(info),
    { name: info.providerName, iconUrl: provider.icon_url }
  );
  // 事業主への即時通知は廃止（毎朝のサマリー通知に集約）
}

// キャンセル通知
export async function notifyBookingCancelled(
  bookingId: string,
  cancelledBy: "customer" | "provider"
) {
  log("notify", "bookingCancelled", { bookingId, cancelledBy });
  const details = await getBookingDetails(bookingId);
  if (!details) { logError("notify", "bookingCancelled: details not found", { bookingId }); return; }

  const { info, customer, providerUser, provider } = details;

  if (cancelledBy === "customer") {
    // お客さんがキャンセル → 事業主に通知
    await pushFlexMessage(
      providerUser.line_user_id,
      `予約キャンセル：${info.customerName}さま`,
      bookingCancelledProvider(info)
    );
  } else {
    // 事業主がキャンセル → お客さんに通知（事業主アイコンで送信）
    await pushFlexMessage(
      customer.line_user_id,
      `${info.providerName}：予約がキャンセルされました`,
      bookingCancelledCustomer({ ...info, cancelledBy }),
      { name: info.providerName, iconUrl: provider.icon_url }
    );
  }
}

// リマインダー通知（前日）
export async function notifyBookingReminder(bookingId: string) {
  log("notify", "bookingReminder", { bookingId });
  const details = await getBookingDetails(bookingId);
  if (!details) { logError("notify", "bookingReminder: details not found", { bookingId }); return; }

  const { info, customer, provider } = details;

  // 事業主アイコン・名前で送信
  await pushFlexMessage(
    customer.line_user_id,
    `${info.providerName}：明日の予約リマインダー`,
    bookingReminder(info),
    { name: info.providerName, iconUrl: provider.icon_url }
  );
}

// 毎朝サマリー通知（全事業主に一括送信）
export async function notifyDailySummary() {
  const supabase = createAdminClient();

  // JST今日の範囲を計算
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const jstYear = jstNow.getUTCFullYear();
  const jstMonth = jstNow.getUTCMonth();
  const jstDate = jstNow.getUTCDate();
  const todayStartUtc = new Date(Date.UTC(jstYear, jstMonth, jstDate) - 9 * 60 * 60 * 1000);
  const tomorrowStartUtc = new Date(todayStartUtc.getTime() + 86400000);

  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const dateStr = `${jstMonth + 1}月${jstDate}日（${days[jstNow.getUTCDay()]}）`;

  // アクティブな事業主を取得
  const { data: providers } = await supabase
    .from("providers")
    .select("id, name, icon_url, user_id")
    .eq("is_active", true);

  if (!providers || providers.length === 0) return;

  const LIFF_ID_VAL = LIFF_ID;
  let sent = 0;

  for (const provider of providers) {
    // 今日の予約を取得
    const { data: bookings } = await supabase
      .from("bookings")
      .select("start_at, customer_name, customer_user_id, services:service_id ( name, duration_min )")
      .eq("provider_id", provider.id)
      .eq("status", "confirmed")
      .gte("start_at", todayStartUtc.toISOString())
      .lt("start_at", tomorrowStartUtc.toISOString())
      .order("start_at", { ascending: true });

    if (!bookings || bookings.length === 0) continue;

    // 顧客名を解決
    const summaryBookings: DailySummaryBooking[] = [];
    for (const b of bookings) {
      const service = Array.isArray(b.services) ? b.services[0] : b.services;
      let name = b.customer_name;
      if (!name) {
        const { data: customer } = await supabase
          .from("users")
          .select("display_name")
          .eq("id", b.customer_user_id)
          .single();
        name = customer?.display_name || "お客さま";
      }
      const startAt = new Date(b.start_at);
      summaryBookings.push({
        time: startAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo" }),
        customerName: name,
        serviceName: service?.name || "",
        durationMin: service?.duration_min || 0,
      });
    }

    // 事業主のLINE userIdを取得
    const { data: providerUser } = await supabase
      .from("users")
      .select("line_user_id")
      .eq("id", provider.user_id)
      .single();

    if (!providerUser) continue;

    const summaryInfo = {
      providerName: provider.name || "",
      dateStr,
      totalCount: bookings.length,
      bookings: summaryBookings,
      liffId: LIFF_ID_VAL,
    };

    await pushFlexMessage(
      providerUser.line_user_id,
      `${dateStr} ${provider.name}：今日は${bookings.length}件の予約`,
      dailySummaryProvider(summaryInfo)
    );
    sent++;
  }

  log("notify", "dailySummary", { sent, total: providers.length });
}
