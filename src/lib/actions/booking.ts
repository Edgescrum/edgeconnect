"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import { notifyBookingConfirmed, notifyBookingCancelled } from "@/lib/line/notify";
import { log, logError } from "@/lib/log";

export async function getAvailableSlots(
  providerId: number,
  serviceId: number,
  date: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_available_slots", {
    p_provider_id: providerId,
    p_service_id: serviceId,
    p_date: date,
  });

  if (error) throw new Error(error.message);
  return (data || []) as { slot_start: string; slot_end: string }[];
}

export async function createBooking(
  providerId: number,
  serviceId: number,
  startAt: string,
  customerName?: string
) {
  log("createBooking", "start", { providerId, serviceId, startAt });
  const user = await resolveUser();
  if (!user) {
    logError("createBooking", "not authenticated");
    throw new Error("ログインが必要です");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_booking", {
    p_provider_id: providerId,
    p_service_id: serviceId,
    p_customer_line_user_id: user.lineUserId,
    p_start_at: startAt,
    p_customer_name: customerName || null,
  });

  if (error) {
    logError("createBooking", "rpc failed", error);
    if (error.message.includes("not available")) {
      throw new Error("この時間帯は既に予約が入っています");
    }
    if (error.message.includes("blocked")) {
      throw new Error("この時間帯は予約を受け付けていません");
    }
    throw new Error(error.message);
  }

  const bookingId = typeof data === "object" && data !== null ? (data as { id: string }).id : null;
  log("createBooking", "success", { bookingId });

  if (bookingId) {
    notifyBookingConfirmed(bookingId).catch((e) => logError("createBooking", "notify failed", e));
  }

  revalidatePath("/bookings");
  return data;
}

export async function cancelBooking(bookingId: string) {
  log("cancelBooking", "start", { bookingId });
  const user = await resolveUser();
  if (!user) {
    logError("cancelBooking", "not authenticated");
    throw new Error("ログインが必要です");
  }

  const cancelledBy = user.role === "provider" ? "provider" : "customer";

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_booking", {
    p_booking_id: bookingId,
    p_line_user_id: user.lineUserId,
  });

  if (error) {
    if (error.message.includes("deadline")) {
      throw new Error("キャンセル期限を過ぎています");
    }
    throw new Error(error.message);
  }

  // LINE通知（バックグラウンド）
  notifyBookingCancelled(bookingId, cancelledBy).catch(console.error);

  revalidatePath("/bookings");
  revalidatePath(`/bookings/${bookingId}`);
  return data;
}
