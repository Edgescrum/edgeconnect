"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveUser } from "@/lib/auth/session";
import { containsNgWord } from "@/lib/constants/ng-words";
import { revalidatePath } from "next/cache";

export interface SurveyItem {
  bookingId: string;
  providerName: string;
  providerIconUrl: string | null;
  providerSlug: string;
  serviceName: string;
  startAt: string;
  endAt: string;
  expiresAt: string;
  status: "pending" | "completed" | "expired";
}

export interface SurveyGroup {
  providerName: string;
  providerIconUrl: string | null;
  providerSlug: string;
  surveys: SurveyItem[];
}

/**
 * お客さんの全アンケート一覧をポータル用に取得（事業主ごとにグループ化）
 */
export async function getSurveyPortalData(): Promise<SurveyGroup[]> {
  const user = await resolveUser();
  if (!user) return [];

  const supabase = await createClient();
  const now = new Date();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  // アンケート送信済みの通知を取得
  const { data: notifications } = await supabase
    .from("pending_survey_notifications")
    .select("booking_id, provider_id")
    .eq("customer_user_id", user.id)
    .eq("status", "sent");

  if (!notifications || notifications.length === 0) return [];

  const bookingIds = notifications.map((n) => n.booking_id);

  // 予約情報を取得
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id, start_at, end_at, status,
      services:service_id ( name ),
      providers:provider_id ( name, icon_url, slug )
    `)
    .in("id", bookingIds);

  const bookingMap = new Map(
    (bookings || []).map((b) => [b.id as string, b])
  );

  // 回答済みのbooking_idリストを取得
  const { data: responses } = await supabase
    .from("survey_responses")
    .select("booking_id")
    .eq("customer_user_id", user.id)
    .in("booking_id", bookingIds);

  const respondedBookingIds = new Set((responses || []).map((r) => r.booking_id));

  // グループ化
  const groupMap = new Map<string, SurveyGroup>();

  for (const notification of notifications) {
    const booking = bookingMap.get(notification.booking_id);
    if (!booking) continue;

    const service = Array.isArray(booking.services)
      ? booking.services[0]
      : booking.services;
    const provider = Array.isArray(booking.providers)
      ? booking.providers[0]
      : booking.providers;
    if (!provider) continue;

    const endAt = new Date(booking.end_at as string);
    const expiresAt = new Date(endAt.getTime() + sevenDaysMs);
    const isExpired = now > expiresAt;
    const isCompleted = respondedBookingIds.has(notification.booking_id);

    let status: "pending" | "completed" | "expired";
    if (isCompleted) {
      status = "completed";
    } else if (isExpired) {
      status = "expired";
    } else {
      status = "pending";
    }

    const slug = provider.slug as string;
    if (!groupMap.has(slug)) {
      groupMap.set(slug, {
        providerName: (provider.name as string) || "",
        providerIconUrl: provider.icon_url as string | null,
        providerSlug: slug,
        surveys: [],
      });
    }

    groupMap.get(slug)!.surveys.push({
      bookingId: notification.booking_id,
      providerName: (provider.name as string) || "",
      providerIconUrl: provider.icon_url as string | null,
      providerSlug: slug,
      serviceName: (service?.name as string) || "",
      startAt: booking.start_at as string,
      endAt: booking.end_at as string,
      expiresAt: expiresAt.toISOString(),
      status,
    });
  }

  // 未回答を先頭に並べ替え
  const groups = Array.from(groupMap.values());
  for (const group of groups) {
    group.surveys.sort((a, b) => {
      const order = { pending: 0, expired: 1, completed: 2 };
      return order[a.status] - order[b.status];
    });
  }

  return groups;
}

export interface SurveyBookingDetail {
  bookingId: string;
  providerName: string;
  providerIconUrl: string | null;
  providerCategory: string | null;
  providerSubscriptionStatus: string;
  serviceName: string;
  startAt: string;
  endAt: string;
  expiresAt: string;
  isExpired: boolean;
  isResponded: boolean;
}

/**
 * アンケート回答ページ用のデータ取得
 */
export async function getSurveyDetail(bookingId: string): Promise<SurveyBookingDetail | null> {
  const user = await resolveUser();
  if (!user) return null;

  const supabase = await createClient();

  // 予約情報を取得
  const { data: booking } = await supabase
    .from("bookings")
    .select(`
      id, start_at, end_at, status, customer_user_id,
      services:service_id ( name ),
      providers:provider_id ( name, icon_url, category, subscription_status )
    `)
    .eq("id", bookingId)
    .single();

  if (!booking) return null;
  if (booking.customer_user_id !== user.id) return null;

  const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;
  const provider = Array.isArray(booking.providers) ? booking.providers[0] : booking.providers;
  if (!provider) return null;

  const endAt = new Date(booking.end_at);
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(endAt.getTime() + sevenDaysMs);

  // 回答済みチェック
  const { data: existingResponse } = await supabase
    .from("survey_responses")
    .select("id")
    .eq("booking_id", bookingId)
    .single();

  return {
    bookingId: booking.id as string,
    providerName: (provider.name as string) || "",
    providerIconUrl: provider.icon_url as string | null,
    providerCategory: provider.category as string | null,
    providerSubscriptionStatus: (provider.subscription_status as string) || "inactive",
    serviceName: (service?.name as string) || "",
    startAt: booking.start_at as string,
    endAt: booking.end_at as string,
    expiresAt: expiresAt.toISOString(),
    isExpired: new Date() > expiresAt,
    isResponded: !!existingResponse,
  };
}

export interface SubmitSurveyInput {
  bookingId: string;
  csat: number;
  driverService: number;
  driverQuality: number;
  driverPrice: number;
  comment: string;
  reviewText: string;
  reviewPublic: boolean;
}

/**
 * アンケート回答を送信
 */
export async function submitSurvey(input: SubmitSurveyInput): Promise<{ success: boolean; error?: string }> {
  const user = await resolveUser();
  if (!user) return { success: false, error: "ログインが必要です" };

  const supabase = await createClient();

  // 予約情報を取得
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, provider_id, customer_user_id, end_at")
    .eq("id", input.bookingId)
    .single();

  if (!booking) return { success: false, error: "予約が見つかりません" };
  if (booking.customer_user_id !== user.id) return { success: false, error: "この予約のアンケートには回答できません" };

  // 期限チェック
  const endAt = new Date(booking.end_at);
  const expiresAt = new Date(endAt.getTime() + 7 * 24 * 60 * 60 * 1000);
  if (new Date() > expiresAt) return { success: false, error: "回答期限を過ぎています" };

  // 重複チェック
  const { data: existingResponse } = await supabase
    .from("survey_responses")
    .select("id")
    .eq("booking_id", input.bookingId)
    .single();

  if (existingResponse) return { success: false, error: "既に回答済みです" };

  // NGワードフィルタ: NGワード検出時は非公開にする
  let reviewPublic = input.reviewPublic;
  if (reviewPublic && input.reviewText && containsNgWord(input.reviewText)) {
    reviewPublic = false;
  }

  const { error } = await supabase
    .from("survey_responses")
    .insert({
      booking_id: input.bookingId,
      customer_user_id: user.id,
      provider_id: booking.provider_id,
      csat: input.csat,
      driver_service: input.driverService,
      driver_quality: input.driverQuality,
      driver_price: input.driverPrice,
      comment: input.comment || null,
      review_text: input.reviewText || null,
      review_public: reviewPublic,
      review_visible: true,
    });

  if (error) {
    console.error("[survey] submitSurvey error:", error.message);
    return { success: false, error: "回答の保存に失敗しました" };
  }

  revalidatePath("/surveys");
  revalidatePath(`/survey/${input.bookingId}`);

  return { success: true };
}

/**
 * お客さんが自分の口コミを削除
 */
export async function deleteMyReview(surveyResponseId: number): Promise<{ success: boolean; error?: string }> {
  const user = await resolveUser();
  if (!user) return { success: false, error: "ログインが必要です" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("survey_responses")
    .delete()
    .eq("id", surveyResponseId)
    .eq("customer_user_id", user.id);

  if (error) {
    console.error("[survey] deleteMyReview error:", error.message);
    return { success: false, error: "削除に失敗しました" };
  }

  revalidatePath("/bookings");
  return { success: true };
}

/**
 * 事業主が口コミを非表示にする
 */
export async function toggleReviewVisibility(
  surveyResponseId: number,
  visible: boolean
): Promise<{ success: boolean; error?: string }> {
  const user = await resolveUser();
  if (!user || user.role !== "provider") return { success: false, error: "権限がありません" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("survey_responses")
    .update({ review_visible: visible })
    .eq("id", surveyResponseId);

  if (error) {
    console.error("[survey] toggleReviewVisibility error:", error.message);
    return { success: false, error: "更新に失敗しました" };
  }

  revalidatePath("/provider/reviews");
  return { success: true };
}

export interface ProviderReviewItem {
  id: number;
  csat: number;
  reviewText: string | null;
  comment: string | null;
  driverService: number | null;
  driverQuality: number | null;
  driverPrice: number | null;
  reviewPublic: boolean;
  reviewVisible: boolean;
  customerName: string | null;
  serviceName: string | null;
  bookingDate: string | null;
  createdAt: string;
}

/**
 * 事業主向け: 自分の口コミ一覧を取得（管理画面用）
 */
export async function getProviderReviews(): Promise<ProviderReviewItem[]> {
  const user = await resolveUser();
  if (!user || user.role !== "provider") return [];

  const supabase = await createClient();

  // 事業主IDを取得
  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!provider) return [];

  const { data: reviews } = await supabase
    .from("survey_responses")
    .select(`
      id, csat, review_text, comment,
      driver_service, driver_quality, driver_price,
      review_public, review_visible, created_at,
      users:customer_user_id ( display_name ),
      bookings:booking_id (
        start_at,
        services:service_id ( name )
      )
    `)
    .eq("provider_id", provider.id)
    .order("created_at", { ascending: false });

  if (!reviews) return [];

  return reviews.map((r) => {
    const customerUser = Array.isArray(r.users) ? r.users[0] : r.users;
    const booking = Array.isArray(r.bookings) ? r.bookings[0] : r.bookings;
    const service = booking
      ? Array.isArray((booking as Record<string, unknown>).services)
        ? ((booking as Record<string, unknown>).services as Record<string, unknown>[])[0]
        : (booking as Record<string, unknown>).services
      : null;

    return {
      id: r.id as number,
      csat: r.csat as number,
      reviewText: r.review_text as string | null,
      comment: r.comment as string | null,
      driverService: r.driver_service as number | null,
      driverQuality: r.driver_quality as number | null,
      driverPrice: r.driver_price as number | null,
      reviewPublic: r.review_public as boolean,
      reviewVisible: r.review_visible as boolean,
      customerName: (customerUser as Record<string, unknown>)?.display_name as string | null,
      serviceName: (service as Record<string, unknown>)?.name as string | null,
      bookingDate: (booking as Record<string, unknown>)?.start_at as string | null,
      createdAt: r.created_at as string,
    };
  });
}
