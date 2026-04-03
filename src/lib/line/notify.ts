import { createAdminClient } from "@/lib/supabase/admin";
import { pushFlexMessage } from "./messaging";
import { log, logError } from "@/lib/log";
import {
  bookingConfirmedCustomer,
  bookingConfirmedProvider,
  bookingCancelledCustomer,
  bookingCancelledProvider,
  bookingReminder,
} from "./templates";
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
    .select("name, price")
    .eq("id", booking.service_id)
    .single();

  const { data: provider } = await supabase
    .from("providers")
    .select("name, slug, user_id")
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
  const dateStr = `${startAt.getMonth() + 1}/${startAt.getDate()}（${days[startAt.getDay()]}）`;
  const timeStr = `${startAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}〜${endAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`;

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
      serviceName: service.name,
      dateStr,
      timeStr,
      price: service.price,
      customerName: booking.customer_name || customer.display_name || "お客さま",
      liffId: LIFF_ID,
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

  const { info, customer, providerUser } = details;

  // お客さんに通知
  await pushFlexMessage(
    customer.line_user_id,
    `${info.providerName}：予約が確定しました`,
    bookingConfirmedCustomer(info)
  );

  // 事業主に通知
  await pushFlexMessage(
    providerUser.line_user_id,
    `新しい予約：${info.customerName}さま`,
    bookingConfirmedProvider(info)
  );
}

// キャンセル通知
export async function notifyBookingCancelled(
  bookingId: string,
  cancelledBy: "customer" | "provider"
) {
  log("notify", "bookingCancelled", { bookingId, cancelledBy });
  const details = await getBookingDetails(bookingId);
  if (!details) { logError("notify", "bookingCancelled: details not found", { bookingId }); return; }

  const { info, customer, providerUser } = details;

  if (cancelledBy === "customer") {
    // お客さんがキャンセル → 事業主に通知
    await pushFlexMessage(
      providerUser.line_user_id,
      `予約キャンセル：${info.customerName}さま`,
      bookingCancelledProvider(info)
    );
  } else {
    // 事業主がキャンセル → お客さんに通知
    await pushFlexMessage(
      customer.line_user_id,
      `${info.providerName}：予約がキャンセルされました`,
      bookingCancelledCustomer({ ...info, cancelledBy })
    );
  }
}

// リマインダー通知（前日）
export async function notifyBookingReminder(bookingId: string) {
  log("notify", "bookingReminder", { bookingId });
  const details = await getBookingDetails(bookingId);
  if (!details) { logError("notify", "bookingReminder: details not found", { bookingId }); return; }

  const { info, customer } = details;

  await pushFlexMessage(
    customer.line_user_id,
    `${info.providerName}：明日の予約リマインダー`,
    bookingReminder(info)
  );
}
