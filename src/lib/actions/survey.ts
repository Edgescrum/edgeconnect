"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
  /** 回答済みの場合のCSATスコア */
  responseCsat?: number;
  /** 回答済みの場合の回答日 */
  respondedAt?: string;
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

  const supabase = createAdminClient();
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

  // 回答済みの情報を取得（CSATスコア・回答日含む）
  const { data: responses } = await supabase
    .from("survey_responses")
    .select("booking_id, csat, created_at")
    .eq("customer_user_id", user.id)
    .in("booking_id", bookingIds);

  const responseMap = new Map(
    (responses || []).map((r) => [r.booking_id as string, { csat: r.csat as number, createdAt: r.created_at as string }])
  );
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
      // 期限切れは非表示にする
      status = "expired";
      continue;
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

    const responseData = responseMap.get(notification.booking_id);

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
      responseCsat: responseData?.csat,
      respondedAt: responseData?.createdAt,
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

/**
 * 未回答のアンケート件数を取得
 */
export async function getPendingSurveyCount(): Promise<number> {
  const user = await resolveUser();
  if (!user) return 0;

  const supabase = createAdminClient();
  const now = new Date();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  const { data: notifications } = await supabase
    .from("pending_survey_notifications")
    .select("booking_id")
    .eq("customer_user_id", user.id)
    .eq("status", "sent");

  if (!notifications || notifications.length === 0) return 0;

  const bookingIds = notifications.map((n) => n.booking_id);

  // 回答済みを除外
  const { data: responses } = await supabase
    .from("survey_responses")
    .select("booking_id")
    .eq("customer_user_id", user.id)
    .in("booking_id", bookingIds);

  const respondedIds = new Set((responses || []).map((r) => r.booking_id));

  // 予約のend_atを取得して期限チェック
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, end_at")
    .in("id", bookingIds);

  if (!bookings) return 0;

  let count = 0;
  for (const b of bookings) {
    if (respondedIds.has(b.id)) continue;
    const endAt = new Date(b.end_at as string);
    const expiresAt = new Date(endAt.getTime() + sevenDaysMs);
    if (now <= expiresAt) count++;
  }

  return count;
}

export interface SurveyResponseData {
  csat: number;
  driverService: number;
  driverQuality: number;
  driverPrice: number;
  comment: string | null;
  reviewText: string | null;
  reviewPublic: boolean;
}

export interface SurveyBookingDetail {
  bookingId: string;
  providerName: string;
  providerIconUrl: string | null;
  providerCategory: string | null;
  providerSubscriptionStatus: string;
  serviceName: string;
  servicePrice: number | null;
  startAt: string;
  endAt: string;
  expiresAt: string;
  isExpired: boolean;
  isResponded: boolean;
  responseData: SurveyResponseData | null;
}

/**
 * アンケート回答ページ用のデータ取得
 */
export async function getSurveyDetail(bookingId: string): Promise<SurveyBookingDetail | null> {
  const user = await resolveUser();
  if (!user) return null;

  const supabase = createAdminClient();

  // 予約情報を取得
  const { data: booking } = await supabase
    .from("bookings")
    .select(`
      id, start_at, end_at, status, customer_user_id,
      services:service_id ( name, price ),
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

  // 回答済みチェック + 回答データ取得
  const { data: existingResponse } = await supabase
    .from("survey_responses")
    .select("id, csat, driver_service, driver_quality, driver_price, comment, review_text, review_public")
    .eq("booking_id", bookingId)
    .single();

  let responseData: SurveyResponseData | null = null;
  if (existingResponse) {
    responseData = {
      csat: existingResponse.csat as number,
      driverService: existingResponse.driver_service as number,
      driverQuality: existingResponse.driver_quality as number,
      driverPrice: existingResponse.driver_price as number,
      comment: existingResponse.comment as string | null,
      reviewText: existingResponse.review_text as string | null,
      reviewPublic: existingResponse.review_public as boolean,
    };
  }

  return {
    bookingId: booking.id as string,
    providerName: (provider.name as string) || "",
    providerIconUrl: provider.icon_url as string | null,
    providerCategory: provider.category as string | null,
    providerSubscriptionStatus: (provider.subscription_status as string) || "inactive",
    serviceName: (service?.name as string) || "",
    servicePrice: (service?.price as number) ?? null,
    startAt: booking.start_at as string,
    endAt: booking.end_at as string,
    expiresAt: expiresAt.toISOString(),
    isExpired: new Date() > expiresAt,
    isResponded: !!existingResponse,
    responseData,
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

  const supabase = createAdminClient();

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

  const supabase = createAdminClient();

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

  const supabase = createAdminClient();

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
export async function getProviderReviews(segment?: string): Promise<ProviderReviewItem[]> {
  const user = await resolveUser();
  if (!user || user.role !== "provider") return [];

  const supabase = createAdminClient();

  // 事業主IDを取得
  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!provider) return [];

  // セグメントフィルター用の顧客ID取得
  let segmentCustomerIds: number[] | null = null;
  if (segment && segment !== "all") {
    const { data: segData } = await supabase.rpc("get_segment_customer_ids", {
      p_provider_id: provider.id,
      p_segment: segment,
    });
    segmentCustomerIds = segData
      ? (segData as { customer_user_id: number }[]).map((r) => r.customer_user_id)
      : [];
    if (segmentCustomerIds.length === 0) return [];
  }

  let query = supabase
    .from("survey_responses")
    .select(`
      id, csat, review_text, comment,
      driver_service, driver_quality, driver_price,
      review_public, review_visible, created_at,
      customer_user_id,
      users:customer_user_id ( display_name ),
      bookings:booking_id (
        start_at,
        services:service_id ( name )
      )
    `)
    .eq("provider_id", provider.id)
    .order("created_at", { ascending: false });

  if (segmentCustomerIds) {
    query = query.in("customer_user_id", segmentCustomerIds);
  }

  const { data: reviews } = await query;

  if (!reviews) return [];

  // customer_notes から customer_name を一括取得
  const customerUserIds = [...new Set(reviews.map((r) => r.customer_user_id as number))];
  const { data: customerNotes } = await supabase
    .from("customer_notes")
    .select("customer_user_id, customer_name")
    .eq("provider_id", provider.id)
    .in("customer_user_id", customerUserIds);

  const customerNameMap = new Map<number, string | null>(
    (customerNotes || []).map((n) => [n.customer_user_id as number, n.customer_name as string | null])
  );

  return reviews.map((r) => {
    const customerUser = Array.isArray(r.users) ? r.users[0] : r.users;
    const booking = Array.isArray(r.bookings) ? r.bookings[0] : r.bookings;
    const service = booking
      ? Array.isArray((booking as Record<string, unknown>).services)
        ? ((booking as Record<string, unknown>).services as Record<string, unknown>[])[0]
        : (booking as Record<string, unknown>).services
      : null;

    const displayName = (customerUser as Record<string, unknown>)?.display_name as string | null;
    const customerName = customerNameMap.get(r.customer_user_id as number) || null;

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
      customerName: customerName || displayName,
      serviceName: (service as Record<string, unknown>)?.name as string | null,
      bookingDate: (booking as Record<string, unknown>)?.start_at as string | null,
      createdAt: r.created_at as string,
    };
  });
}

export interface CustomerSurveyResponse {
  id: number;
  csat: number;
  driverService: number | null;
  driverQuality: number | null;
  driverPrice: number | null;
  comment: string | null;
  reviewText: string | null;
  reviewPublic: boolean;
  serviceName: string | null;
  bookingDate: string | null;
  createdAt: string;
}

export interface CustomerSurveyKpi {
  avgCsat: number;
  avgDriverService: number | null;
  avgDriverQuality: number | null;
  avgDriverPrice: number | null;
  totalResponses: number;
}

/**
 * 顧客詳細ページ用: 特定顧客のアンケート回答一覧 + KPI を取得
 */
export async function getCustomerSurveyData(
  providerId: number,
  customerUserId: number
): Promise<{ responses: CustomerSurveyResponse[]; kpi: CustomerSurveyKpi | null }> {
  const supabase = createAdminClient();

  const { data: responses } = await supabase
    .from("survey_responses")
    .select(`
      id, csat, driver_service, driver_quality, driver_price,
      comment, review_text, review_public, created_at,
      bookings:booking_id (
        start_at,
        services:service_id ( name )
      )
    `)
    .eq("provider_id", providerId)
    .eq("customer_user_id", customerUserId)
    .order("created_at", { ascending: false });

  if (!responses || responses.length === 0) {
    return { responses: [], kpi: null };
  }

  const mapped: CustomerSurveyResponse[] = responses.map((r) => {
    const booking = Array.isArray(r.bookings) ? r.bookings[0] : r.bookings;
    const service = booking
      ? Array.isArray((booking as Record<string, unknown>).services)
        ? ((booking as Record<string, unknown>).services as Record<string, unknown>[])[0]
        : (booking as Record<string, unknown>).services
      : null;

    return {
      id: r.id as number,
      csat: r.csat as number,
      driverService: r.driver_service as number | null,
      driverQuality: r.driver_quality as number | null,
      driverPrice: r.driver_price as number | null,
      comment: r.comment as string | null,
      reviewText: r.review_text as string | null,
      reviewPublic: r.review_public as boolean,
      serviceName: (service as Record<string, unknown>)?.name as string | null,
      bookingDate: (booking as Record<string, unknown>)?.start_at as string | null,
      createdAt: r.created_at as string,
    };
  });

  // KPI 計算
  const totalResponses = mapped.length;
  const avgCsat = mapped.reduce((sum, r) => sum + r.csat, 0) / totalResponses;

  const serviceScores = mapped.filter((r) => r.driverService != null);
  const qualityScores = mapped.filter((r) => r.driverQuality != null);
  const priceScores = mapped.filter((r) => r.driverPrice != null);

  const kpi: CustomerSurveyKpi = {
    avgCsat: Number(avgCsat.toFixed(1)),
    avgDriverService: serviceScores.length > 0
      ? Number((serviceScores.reduce((sum, r) => sum + (r.driverService || 0), 0) / serviceScores.length).toFixed(1))
      : null,
    avgDriverQuality: qualityScores.length > 0
      ? Number((qualityScores.reduce((sum, r) => sum + (r.driverQuality || 0), 0) / qualityScores.length).toFixed(1))
      : null,
    avgDriverPrice: priceScores.length > 0
      ? Number((priceScores.reduce((sum, r) => sum + (r.driverPrice || 0), 0) / priceScores.length).toFixed(1))
      : null,
    totalResponses,
  };

  return { responses: mapped, kpi };
}
