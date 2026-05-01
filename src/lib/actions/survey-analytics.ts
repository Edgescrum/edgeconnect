"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getProviderId } from "@/lib/auth/provider-session";
import type { SegmentKey, DateRangeKey } from "@/lib/actions/analytics";

async function getProviderWithPlan() {
  const supabase = await createClient();
  const provider = await getProviderId();
  const { data } = await supabase
    .from("providers")
    .select("plan, category")
    .eq("id", provider.id)
    .single();
  return { ...provider, plan: data?.plan || "basic", category: data?.category || null };
}

// ============================================================
// Types
// ============================================================

export interface SurveyBasicStats {
  avgCsat: number;
  totalResponses: number;
  totalNotifications: number; // 配信数（アンケート対象予約数）= 回答率の分母
  responseRate: number; // 回答率 (%) = 回答数 / 配信数
  csatDistribution: { score: number; count: number }[]; // 1-5点の分布
  // 前月比
  prevMonthAvgCsat: number | null;
  csatDiff: number | null;        // 今月 - 先月
  prevMonthResponseRate: number | null;
  responseRateDiff: number | null; // 今月 - 先月 (ポイント差)
}

export interface MonthlyCsatTrend {
  month: string;
  avgCsat: number;
  responseCount: number;
}

export interface DriverTrend {
  month: string;
  avgService: number;
  avgQuality: number;
  avgPrice: number;
}

export interface MenuCsat {
  serviceName: string;
  serviceId: number;
  avgCsat: number;
  responseCount: number;
}

export interface SegmentCsat {
  segment: string;
  segmentLabel: string;
  avgCsat: number;
  responseCount: number;
}

// Cross-analysis types
export interface UnitPriceCsat {
  tier: string;
  tierLabel: string;
  avgCsat: number;
  count: number;
  avgUnitPrice: number;
}

export interface NewVsRepeaterCsat {
  type: "new" | "repeater";
  label: string;
  avgCsat: number | null;
  count: number;
}

export interface RevenueCorrelation {
  month: string;
  revenue: number;
  avgCsat: number;
}

export interface MenuCsatMatrix {
  serviceName: string;
  serviceId: number;
  avgCsat: number;
  bookingCount: number;
  responseCount: number;
}

export interface DriverRegressionResult {
  driver: "service" | "quality" | "price";
  label: string;
  correlation: number;    // CORR(driver, csat)
  regrSlope: number;      // REGR_SLOPE(csat, driver) — CSATへの影響度
  avgScore: number;       // 現在の平均スコア
  sampleCount: number;
}

export interface RevenueCsatInsight {
  correlation: number;
  message: string;
  strength: "strong_positive" | "weak" | "strong_negative";
}

export interface CsatRetentionItem {
  scoreLabel: string;  // e.g. "5" or "2以下"
  minScore: number;
  maxScore: number;
  totalCount: number;
  returnedCount: number;
  retentionRate: number; // 0-100
}

// 満足度 x 顧客単価
export interface CsatVsUnitPrice {
  scoreLabel: string;  // "不満足" / "普通" / "満足"
  minScore: number;
  maxScore: number;
  avgUnitPrice: number;
  customerCount: number;
}

// 満足度 x LTV
export interface CsatVsLtv {
  scoreLabel: string;
  minScore: number;
  maxScore: number;
  avgLtv: number;
  customerCount: number;
}

export interface SurveyBenchmark {
  available: boolean;
  providerCount: number;
  avgCsat?: number;
  avgResponseRate?: number;
  avgDriverService?: number;
  avgDriverQuality?: number;
  avgDriverPrice?: number;
}

export interface SurveyAdvancedStats {
  csatTrend: MonthlyCsatTrend[];
  driverTrend: DriverTrend[];
  menuCsat: MenuCsat[];
  segmentCsat: SegmentCsat[];
  driverAverages: {
    service: number;
    quality: number;
    price: number;
  };
  // 属性別CSAT
  genderCsat: { gender: string; label: string; avgCsat: number; count: number }[];
  ageCsat: { ageGroup: string; avgCsat: number; count: number }[];
  // Cross-analysis
  unitPriceCsat: UnitPriceCsat[];
  newVsRepeaterCsat: NewVsRepeaterCsat[];
  revenueCorrelation: RevenueCorrelation[];
  revenueCsatInsight: RevenueCsatInsight | null;
  menuCsatMatrix: MenuCsatMatrix[];
  // Driver regression analysis
  driverRegression: DriverRegressionResult[];
  // 満足度x再来店率
  csatRetentionRate: CsatRetentionItem[];
  // 満足度x顧客単価・LTV
  csatVsUnitPrice: CsatVsUnitPrice[];
  csatVsLtv: CsatVsLtv[];
  // ベンチマーク
  surveyBenchmark: SurveyBenchmark;
}

// ============================================================
// Basic Stats (available for all plans)
// ============================================================

export async function getSurveyBasicStats(
  segment: SegmentKey = "all",
  dateRange: DateRangeKey = "all"
): Promise<SurveyBasicStats> {
  const provider = await getProviderWithPlan();
  const supabase = createAdminClient();
  const { startDate, endDate } = computeDateRange(dateRange);

  // Get segment customer IDs if needed
  let segmentCustomerIds: number[] | null = null;
  if (segment !== "all") {
    const { data: segData } = await supabase.rpc("get_segment_customer_ids", {
      p_provider_id: provider.id,
      p_segment: segment,
    });
    segmentCustomerIds = segData
      ? (segData as { customer_user_id: number }[]).map((r) => r.customer_user_id)
      : [];
  }

  // 分母: アンケート対象の予約数（end_at < now() の confirmed 予約）
  // 分子: survey_responses の件数（回答数）
  const now = new Date().toISOString();

  let bookingCountQuery = supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", provider.id)
    .eq("status", "confirmed")
    .lt("end_at", now);

  let responseQuery = supabase
    .from("survey_responses")
    .select("csat, created_at, customer_user_id")
    .eq("provider_id", provider.id);

  if (startDate) {
    bookingCountQuery = bookingCountQuery.gte("end_at", startDate);
    responseQuery = responseQuery.gte("created_at", startDate);
  }
  if (endDate) {
    bookingCountQuery = bookingCountQuery.lte("end_at", endDate);
    responseQuery = responseQuery.lte("created_at", endDate);
  }
  if (segmentCustomerIds && segmentCustomerIds.length > 0) {
    bookingCountQuery = bookingCountQuery.in("customer_user_id", segmentCustomerIds);
    responseQuery = responseQuery.in("customer_user_id", segmentCustomerIds);
  } else if (segmentCustomerIds && segmentCustomerIds.length === 0) {
    return emptySurveyBasicStats();
  }

  const [{ count: bookingCount }, { data: avgData }] = await Promise.all([
    bookingCountQuery,
    responseQuery,
  ]);

  const totalResponses = avgData?.length || 0;
  const totalNotifications = bookingCount || 0; // 分母 = アンケート対象予約数
  // 回答率: 件数単位（回答数 / 対象予約数）
  const responseRate = totalNotifications > 0
    ? Math.min(100, Math.round((totalResponses / totalNotifications) * 1000) / 10)
    : 0;

  const avgCsat = (avgData && avgData.length > 0)
    ? avgData.reduce((sum, r) => sum + (r.csat as number), 0) / avgData.length
    : 0;

  // 1-5点の分布を計算
  const distributionMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (avgData) {
    for (const r of avgData) {
      const score = Math.round(r.csat as number);
      if (score >= 1 && score <= 5) distributionMap[score]++;
    }
  }
  const csatDistribution = [1, 2, 3, 4, 5].map((score) => ({
    score,
    count: distributionMap[score],
  }));

  // 前月比の計算
  const nowDate = new Date();
  const thisMonthStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(nowDate.getFullYear(), nowDate.getMonth(), 0, 23, 59, 59).toISOString();

  let prevBookingQuery = supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", provider.id)
    .eq("status", "confirmed")
    .gte("end_at", lastMonthStart)
    .lte("end_at", lastMonthEnd)
    .lt("end_at", now);

  let prevResponseQuery = supabase
    .from("survey_responses")
    .select("csat")
    .eq("provider_id", provider.id)
    .gte("created_at", lastMonthStart)
    .lte("created_at", lastMonthEnd);

  let currResponseQuery = supabase
    .from("survey_responses")
    .select("csat")
    .eq("provider_id", provider.id)
    .gte("created_at", thisMonthStart);

  let currBookingQuery = supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", provider.id)
    .eq("status", "confirmed")
    .gte("end_at", thisMonthStart)
    .lt("end_at", now);

  if (segmentCustomerIds && segmentCustomerIds.length > 0) {
    prevBookingQuery = prevBookingQuery.in("customer_user_id", segmentCustomerIds);
    prevResponseQuery = prevResponseQuery.in("customer_user_id", segmentCustomerIds);
    currResponseQuery = currResponseQuery.in("customer_user_id", segmentCustomerIds);
    currBookingQuery = currBookingQuery.in("customer_user_id", segmentCustomerIds);
  }

  const [
    { count: prevBookingCount },
    { data: prevResponseData },
    { data: currResponseData },
    { count: currBookingCount },
  ] = await Promise.all([
    prevBookingQuery,
    prevResponseQuery,
    currResponseQuery,
    currBookingQuery,
  ]);

  let prevMonthAvgCsat: number | null = null;
  let csatDiff: number | null = null;
  let prevMonthResponseRate: number | null = null;
  let responseRateDiff: number | null = null;

  if (prevResponseData && prevResponseData.length > 0) {
    prevMonthAvgCsat = Number(
      (prevResponseData.reduce((s, r) => s + (r.csat as number), 0) / prevResponseData.length).toFixed(1)
    );
    const currAvgCsat = currResponseData && currResponseData.length > 0
      ? Number((currResponseData.reduce((s, r) => s + (r.csat as number), 0) / currResponseData.length).toFixed(1))
      : null;
    if (currAvgCsat !== null) {
      csatDiff = Number((currAvgCsat - prevMonthAvgCsat).toFixed(1));
    }
  }

  const prevBookings = prevBookingCount || 0;
  const prevResponses = prevResponseData?.length || 0;
  if (prevBookings > 0) {
    prevMonthResponseRate = Math.min(100, Math.round((prevResponses / prevBookings) * 1000) / 10);
    const currBookings = currBookingCount || 0;
    const currResponses = currResponseData?.length || 0;
    if (currBookings > 0) {
      const currRate = Math.min(100, Math.round((currResponses / currBookings) * 1000) / 10);
      responseRateDiff = Number((currRate - prevMonthResponseRate).toFixed(1));
    }
  }

  return {
    avgCsat: Number(avgCsat.toFixed(1)),
    totalResponses,
    totalNotifications,
    responseRate,
    csatDistribution,
    prevMonthAvgCsat,
    csatDiff,
    prevMonthResponseRate,
    responseRateDiff,
  };
}

function emptySurveyBasicStats(): SurveyBasicStats {
  return {
    avgCsat: 0,
    totalResponses: 0,
    totalNotifications: 0,
    responseRate: 0,
    csatDistribution: [1, 2, 3, 4, 5].map((score) => ({ score, count: 0 })),
    prevMonthAvgCsat: null,
    csatDiff: null,
    prevMonthResponseRate: null,
    responseRateDiff: null,
  };
}

// ============================================================
// Date range helper
// ============================================================

function computeDateRange(dateRange: DateRangeKey): { startDate: string | null; endDate: string | null } {
  if (dateRange === "all") return { startDate: null, endDate: null };
  const now = new Date();
  if (dateRange === "this_month") {
    return { startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), endDate: now.toISOString() };
  }
  return { startDate: new Date(now.getFullYear(), 0, 1).toISOString(), endDate: now.toISOString() };
}

// ============================================================
// Correlation helper (Pearson)
// ============================================================

function pearsonCorrelation(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 3) return 0;
  const meanX = xs.reduce((s, v) => s + v, 0) / n;
  const meanY = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const den = Math.sqrt(denX * denY);
  return den === 0 ? 0 : num / den;
}

function regressionSlope(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 3) return 0;
  const meanX = xs.reduce((s, v) => s + v, 0) / n;
  const meanY = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    num += dx * (ys[i] - meanY);
    den += dx * dx;
  }
  return den === 0 ? 0 : num / den;
}

// ============================================================
// Advanced Stats (standard plan only, with segment/date filters)
// ============================================================

export async function getSurveyAdvancedStats(
  segment: SegmentKey = "all",
  dateRange: DateRangeKey = "all"
): Promise<SurveyAdvancedStats> {
  const provider = await getProviderWithPlan();
  if (provider.plan === "basic") {
    throw new Error("この機能はスタンダードプラン以上でご利用いただけます");
  }

  const supabase = createAdminClient();
  const { startDate, endDate } = computeDateRange(dateRange);

  // Get customer IDs for segment filter
  let segmentCustomerIds: number[] | null = null;
  if (segment !== "all") {
    const { data: segData } = await supabase.rpc("get_segment_customer_ids", {
      p_provider_id: provider.id,
      p_segment: segment,
    });
    segmentCustomerIds = segData
      ? (segData as { customer_user_id: number }[]).map((r) => r.customer_user_id)
      : [];
  }

  // Build query for survey responses
  let query = supabase
    .from("survey_responses")
    .select(`
      id, csat, driver_service, driver_quality, driver_price,
      comment, review_text,
      created_at, customer_user_id,
      bookings:booking_id (
        start_at,
        service_id,
        services:service_id ( id, name, price )
      )
    `)
    .eq("provider_id", provider.id)
    .order("created_at", { ascending: true });

  if (startDate) query = query.gte("created_at", startDate);
  if (endDate) query = query.lte("created_at", endDate);
  if (segmentCustomerIds && segmentCustomerIds.length > 0) {
    query = query.in("customer_user_id", segmentCustomerIds);
  } else if (segmentCustomerIds && segmentCustomerIds.length === 0) {
    // No customers in segment, return empty
    return emptyAdvancedStats();
  }

  const { data: allResponses } = await query;
  const responses = allResponses || [];

  if (responses.length === 0) return emptyAdvancedStats();

  // -- CSAT monthly trend --
  const monthlyMap = new Map<string, { csatSum: number; count: number; serviceSum: number; qualitySum: number; priceSum: number; serviceCount: number; qualityCount: number; priceCount: number }>();
  for (const r of responses) {
    const month = (r.created_at as string).slice(0, 7);
    const entry = monthlyMap.get(month) || { csatSum: 0, count: 0, serviceSum: 0, qualitySum: 0, priceSum: 0, serviceCount: 0, qualityCount: 0, priceCount: 0 };
    entry.csatSum += r.csat as number;
    entry.count++;
    if (r.driver_service != null) { entry.serviceSum += r.driver_service as number; entry.serviceCount++; }
    if (r.driver_quality != null) { entry.qualitySum += r.driver_quality as number; entry.qualityCount++; }
    if (r.driver_price != null) { entry.priceSum += r.driver_price as number; entry.priceCount++; }
    monthlyMap.set(month, entry);
  }

  const csatTrend: MonthlyCsatTrend[] = [];
  const driverTrend: DriverTrend[] = [];
  for (const [month, entry] of monthlyMap) {
    csatTrend.push({
      month,
      avgCsat: Number((entry.csatSum / entry.count).toFixed(1)),
      responseCount: entry.count,
    });
    driverTrend.push({
      month,
      avgService: entry.serviceCount > 0 ? Number((entry.serviceSum / entry.serviceCount).toFixed(1)) : 0,
      avgQuality: entry.qualityCount > 0 ? Number((entry.qualitySum / entry.qualityCount).toFixed(1)) : 0,
      avgPrice: entry.priceCount > 0 ? Number((entry.priceSum / entry.priceCount).toFixed(1)) : 0,
    });
  }

  // -- Driver averages --
  const driverServiceAll = responses.filter((r) => r.driver_service != null);
  const driverQualityAll = responses.filter((r) => r.driver_quality != null);
  const driverPriceAll = responses.filter((r) => r.driver_price != null);

  const driverAverages = {
    service: driverServiceAll.length > 0
      ? Number((driverServiceAll.reduce((s, r) => s + (r.driver_service as number), 0) / driverServiceAll.length).toFixed(1))
      : 0,
    quality: driverQualityAll.length > 0
      ? Number((driverQualityAll.reduce((s, r) => s + (r.driver_quality as number), 0) / driverQualityAll.length).toFixed(1))
      : 0,
    price: driverPriceAll.length > 0
      ? Number((driverPriceAll.reduce((s, r) => s + (r.driver_price as number), 0) / driverPriceAll.length).toFixed(1))
      : 0,
  };

  // -- Menu CSAT --
  const menuMap = new Map<number, { name: string; csatSum: number; count: number }>();
  for (const r of responses) {
    const booking = Array.isArray(r.bookings) ? r.bookings[0] : r.bookings;
    if (!booking) continue;
    const service = Array.isArray((booking as Record<string, unknown>).services)
      ? ((booking as Record<string, unknown>).services as Record<string, unknown>[])[0]
      : (booking as Record<string, unknown>).services;
    if (!service) continue;
    const serviceId = (service as Record<string, unknown>).id as number;
    const serviceName = (service as Record<string, unknown>).name as string;
    const entry = menuMap.get(serviceId) || { name: serviceName, csatSum: 0, count: 0 };
    entry.csatSum += r.csat as number;
    entry.count++;
    menuMap.set(serviceId, entry);
  }
  const menuCsat: MenuCsat[] = Array.from(menuMap.entries())
    .map(([serviceId, entry]) => ({
      serviceId,
      serviceName: entry.name,
      avgCsat: Number((entry.csatSum / entry.count).toFixed(1)),
      responseCount: entry.count,
    }))
    .sort((a, b) => b.avgCsat - a.avgCsat);

  // -- Segment CSAT --
  const customerIds = [...new Set(responses.map((r) => r.customer_user_id as number))];
  let segmentCsat: SegmentCsat[] = [];

  // Build segment map for cross-analysis
  const segmentMapAll = new Map<number, string>();
  if (customerIds.length > 0) {
    const segmentNames = ["excellent", "normal", "dormant", "at_risk"];
    const segmentResults = await Promise.all(
      segmentNames.map((seg) =>
        supabase.rpc("get_segment_customer_ids", {
          p_provider_id: provider.id,
          p_segment: seg,
        }).then(({ data }) => ({ seg, data }))
      )
    );
    for (const { seg, data: segIds } of segmentResults) {
      if (segIds) {
        for (const row of segIds as { customer_user_id: number }[]) {
          segmentMapAll.set(row.customer_user_id, seg);
        }
      }
    }

    const segCsatMap = new Map<string, { csatSum: number; count: number }>();
    for (const r of responses) {
      const seg = segmentMapAll.get(r.customer_user_id as number) || "unknown";
      const entry = segCsatMap.get(seg) || { csatSum: 0, count: 0 };
      entry.csatSum += r.csat as number;
      entry.count++;
      segCsatMap.set(seg, entry);
    }

    const segmentLabels: Record<string, string> = {
      excellent: "優良",
      normal: "通常",
      dormant: "休眠",
      at_risk: "離脱リスク",
    };

    // Always include all segments (even if count is 0) so UI shows full picture
    const allSegmentKeys = ["excellent", "normal", "dormant", "at_risk"];
    segmentCsat = allSegmentKeys.map((seg) => {
      const entry = segCsatMap.get(seg);
      return {
        segment: seg,
        segmentLabel: segmentLabels[seg] || seg,
        avgCsat: entry ? Number((entry.csatSum / entry.count).toFixed(1)) : 0,
        responseCount: entry?.count || 0,
      };
    });
  }

  // -- Gender/Age CSAT --
  let genderCsat: { gender: string; label: string; avgCsat: number; count: number }[] = [];
  let ageCsat: { ageGroup: string; avgCsat: number; count: number }[] = [];

  if (customerIds.length > 0) {
    const { data: users } = await supabase
      .from("users")
      .select("id, gender, birth_date")
      .in("id", customerIds);

    if (users) {
      const userMap = new Map(users.map((u) => [u.id as number, u]));

      const genderMap = new Map<string, { csatSum: number; count: number }>();
      for (const r of responses) {
        const u = userMap.get(r.customer_user_id as number);
        const g = (u?.gender as string) || "unknown";
        const entry = genderMap.get(g) || { csatSum: 0, count: 0 };
        entry.csatSum += r.csat as number;
        entry.count++;
        genderMap.set(g, entry);
      }

      const genderLabels: Record<string, string> = {
        male: "男性", female: "女性", other: "その他",
        prefer_not_to_say: "未回答", unknown: "未設定",
      };

      genderCsat = Array.from(genderMap.entries())
        .filter(([g]) => g !== "unknown")
        .map(([g, entry]) => ({
          gender: g,
          label: genderLabels[g] || g,
          avgCsat: Number((entry.csatSum / entry.count).toFixed(1)),
          count: entry.count,
        }));

      const ageGroupMap = new Map<string, { csatSum: number; count: number }>();
      const now = new Date();
      for (const r of responses) {
        const u = userMap.get(r.customer_user_id as number);
        if (!u?.birth_date) continue;
        const bd = new Date(u.birth_date as string);
        let age = now.getFullYear() - bd.getFullYear();
        const m = now.getMonth() - bd.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < bd.getDate())) age--;
        const ageGroup = `${Math.floor(age / 10) * 10}代`;
        const entry = ageGroupMap.get(ageGroup) || { csatSum: 0, count: 0 };
        entry.csatSum += r.csat as number;
        entry.count++;
        ageGroupMap.set(ageGroup, entry);
      }

      ageCsat = Array.from(ageGroupMap.entries())
        .map(([ageGroup, entry]) => ({
          ageGroup,
          avgCsat: Number((entry.csatSum / entry.count).toFixed(1)),
          count: entry.count,
        }))
        .sort((a, b) => parseInt(a.ageGroup) - parseInt(b.ageGroup));
    }
  }

  // ============================================================
  // Cross-analysis: booking data x survey data
  // ============================================================

  // Get all bookings for this provider in the date range for cross-analysis
  let bookingQuery = supabase
    .from("bookings")
    .select("id, customer_user_id, service_id, start_at, status, services:service_id ( id, name, price )")
    .eq("provider_id", provider.id)
    .eq("status", "confirmed");

  if (startDate) bookingQuery = bookingQuery.gte("start_at", startDate);
  if (endDate) bookingQuery = bookingQuery.lte("start_at", endDate);
  if (segmentCustomerIds && segmentCustomerIds.length > 0) {
    bookingQuery = bookingQuery.in("customer_user_id", segmentCustomerIds);
  }

  const { data: allBookings } = await bookingQuery;
  const bookings = allBookings || [];

  // -- a. Unit Price x CSAT --
  // Calculate per-customer unit price, then cross with their avg CSAT
  const customerSpend = new Map<number, { totalRevenue: number; bookingCount: number }>();
  for (const b of bookings) {
    const custId = b.customer_user_id as number;
    const service = Array.isArray(b.services) ? b.services[0] : b.services;
    const price = service ? Number((service as Record<string, unknown>).price ?? 0) : 0;
    const entry = customerSpend.get(custId) || { totalRevenue: 0, bookingCount: 0 };
    entry.totalRevenue += price;
    entry.bookingCount++;
    customerSpend.set(custId, entry);
  }

  const customerCsat = new Map<number, { csatSum: number; count: number }>();
  for (const r of responses) {
    const custId = r.customer_user_id as number;
    const entry = customerCsat.get(custId) || { csatSum: 0, count: 0 };
    entry.csatSum += r.csat as number;
    entry.count++;
    customerCsat.set(custId, entry);
  }

  // Classify customers into unit price tiers
  const customerUnitPrices: { custId: number; unitPrice: number; avgCsat: number }[] = [];
  for (const [custId, spend] of customerSpend) {
    const csat = customerCsat.get(custId);
    if (!csat) continue;
    customerUnitPrices.push({
      custId,
      unitPrice: Math.round(spend.totalRevenue / spend.bookingCount),
      avgCsat: Number((csat.csatSum / csat.count).toFixed(1)),
    });
  }

  let unitPriceCsat: UnitPriceCsat[] = [];
  if (customerUnitPrices.length > 0) {
    const allPrices = customerUnitPrices.map((c) => c.unitPrice).sort((a, b) => a - b);
    const p33 = allPrices[Math.floor(allPrices.length / 3)] || 0;
    const p66 = allPrices[Math.floor((allPrices.length * 2) / 3)] || 0;

    const tiers: { tier: string; tierLabel: string; customers: typeof customerUnitPrices }[] = [
      { tier: "low", tierLabel: "低単価", customers: customerUnitPrices.filter((c) => c.unitPrice <= p33) },
      { tier: "mid", tierLabel: "中単価", customers: customerUnitPrices.filter((c) => c.unitPrice > p33 && c.unitPrice <= p66) },
      { tier: "high", tierLabel: "高単価", customers: customerUnitPrices.filter((c) => c.unitPrice > p66) },
    ];

    unitPriceCsat = tiers
      .filter((t) => t.customers.length > 0)
      .map((t) => ({
        tier: t.tier,
        tierLabel: t.tierLabel,
        avgCsat: Number((t.customers.reduce((s, c) => s + c.avgCsat, 0) / t.customers.length).toFixed(1)),
        count: t.customers.length,
        avgUnitPrice: Math.round(t.customers.reduce((s, c) => s + c.unitPrice, 0) / t.customers.length),
      }));
  }

  // -- b. New vs Repeater x CSAT --
  // Count bookings per customer to determine new vs repeater
  const customerBookingCounts = new Map<number, number>();
  for (const b of bookings) {
    const custId = b.customer_user_id as number;
    customerBookingCounts.set(custId, (customerBookingCounts.get(custId) || 0) + 1);
  }

  const newCsatList: number[] = [];
  const repeaterCsatList: number[] = [];
  for (const r of responses) {
    const custId = r.customer_user_id as number;
    const count = customerBookingCounts.get(custId) || 0;
    if (count <= 1) {
      newCsatList.push(r.csat as number);
    } else {
      repeaterCsatList.push(r.csat as number);
    }
  }

  // Always include both "new" and "repeater" so the UI shows both cards
  const newVsRepeaterCsat: NewVsRepeaterCsat[] = [
    {
      type: "new",
      label: "新規",
      avgCsat: newCsatList.length > 0
        ? Number((newCsatList.reduce((s, c) => s + c, 0) / newCsatList.length).toFixed(1))
        : null,
      count: newCsatList.length,
    },
    {
      type: "repeater",
      label: "リピーター",
      avgCsat: repeaterCsatList.length > 0
        ? Number((repeaterCsatList.reduce((s, c) => s + c, 0) / repeaterCsatList.length).toFixed(1))
        : null,
      count: repeaterCsatList.length,
    },
  ];

  // -- c. Revenue x CSAT correlation (monthly) --
  const monthlyRevenue = new Map<string, number>();
  for (const b of bookings) {
    const month = (b.start_at as string).slice(0, 7);
    const service = Array.isArray(b.services) ? b.services[0] : b.services;
    const price = service ? Number((service as Record<string, unknown>).price ?? 0) : 0;
    monthlyRevenue.set(month, (monthlyRevenue.get(month) || 0) + price);
  }

  const revenueCorrelation: RevenueCorrelation[] = [];
  for (const [month, entry] of monthlyMap) {
    const revenue = monthlyRevenue.get(month) || 0;
    if (revenue > 0) {
      revenueCorrelation.push({
        month,
        revenue,
        avgCsat: Number((entry.csatSum / entry.count).toFixed(1)),
      });
    }
  }

  // -- d. Menu CSAT x booking count matrix --
  const menuBookingCounts = new Map<number, number>();
  for (const b of bookings) {
    const service = Array.isArray(b.services) ? b.services[0] : b.services;
    if (!service) continue;
    const sid = (service as Record<string, unknown>).id as number;
    menuBookingCounts.set(sid, (menuBookingCounts.get(sid) || 0) + 1);
  }

  const menuCsatMatrix: MenuCsatMatrix[] = menuCsat.map((m) => ({
    serviceName: m.serviceName,
    serviceId: m.serviceId,
    avgCsat: m.avgCsat,
    bookingCount: menuBookingCounts.get(m.serviceId) || 0,
    responseCount: m.responseCount,
  }));

  // -- e. Driver regression analysis --
  // 各ドライバーがCSATにどの程度影響しているかを計算
  const driverLabels: Record<string, string> = {
    service: "接客・対応",
    quality: "品質・仕上がり",
    price: "価格",
  };
  const driverKeys: Array<"service" | "quality" | "price"> = ["service", "quality", "price"];
  const driverFields: Record<string, "driver_service" | "driver_quality" | "driver_price"> = {
    service: "driver_service",
    quality: "driver_quality",
    price: "driver_price",
  };

  const driverRegression: DriverRegressionResult[] = [];
  for (const key of driverKeys) {
    const field = driverFields[key];
    const validPairs = responses.filter((r) => r[field] != null);
    if (validPairs.length < 3) {
      driverRegression.push({
        driver: key,
        label: driverLabels[key],
        correlation: 0,
        regrSlope: 0,
        avgScore: driverAverages[key],
        sampleCount: validPairs.length,
      });
      continue;
    }
    const driverValues = validPairs.map((r) => r[field] as number);
    const csatForDriver = validPairs.map((r) => r.csat as number);
    const corr = pearsonCorrelation(driverValues, csatForDriver);
    const slope = regressionSlope(driverValues, csatForDriver);
    driverRegression.push({
      driver: key,
      label: driverLabels[key],
      correlation: Number(corr.toFixed(3)),
      regrSlope: Number(slope.toFixed(3)),
      avgScore: driverAverages[key],
      sampleCount: validPairs.length,
    });
  }
  // Sort by absolute correlation (most impactful first)
  driverRegression.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  // -- f. Revenue x CSAT insight (correlation + message) --
  let revenueCsatInsight: RevenueCsatInsight | null = null;
  if (revenueCorrelation.length >= 3) {
    const revenues = revenueCorrelation.map((r) => r.revenue);
    const csats = revenueCorrelation.map((r) => r.avgCsat);
    const corr = pearsonCorrelation(revenues, csats);
    let message: string;
    let strength: RevenueCsatInsight["strength"];
    if (corr >= 0.5) {
      strength = "strong_positive";
      message = "満足度が高い月は売上も高い傾向があります。顧客満足度の向上が売上増加につながる可能性があります";
    } else if (corr <= -0.5) {
      strength = "strong_negative";
      message = "売上が高い月は満足度が下がる傾向があります。繁忙期のサービス品質に注意が必要です";
    } else {
      strength = "weak";
      message = "売上と満足度に明確な関連は見られません。売上は満足度以外の要因（集客数、季節変動等）に影響されている可能性があります";
    }
    revenueCsatInsight = {
      correlation: Number(corr.toFixed(3)),
      message,
      strength,
    };
  }

  // -- g. CSAT x Retention Rate --
  // 各回答者の CSAT スコア別に、回答日以降に再来店(confirmed予約)があるかチェック
  const csatRetentionRate: CsatRetentionItem[] = [];
  if (responses.length > 0) {
    // Get ALL confirmed bookings for this provider (no date filter) to check future bookings
    const { data: allProviderBookings } = await supabase
      .from("bookings")
      .select("customer_user_id, start_at")
      .eq("provider_id", provider.id)
      .eq("status", "confirmed");

    const providerBookings = allProviderBookings || [];

    // For each response, check if the customer has a confirmed booking AFTER the response date
    const scoreBuckets: { label: string; min: number; max: number; total: number; returned: number }[] = [
      { label: "満足（4, 5）", min: 4, max: 5, total: 0, returned: 0 },
      { label: "普通（3）", min: 3, max: 3, total: 0, returned: 0 },
      { label: "不満足（1, 2）", min: 1, max: 2, total: 0, returned: 0 },
    ];

    for (const r of responses) {
      const csat = r.csat as number;
      const responseDate = r.created_at as string;
      const custId = r.customer_user_id as number;

      const bucket = scoreBuckets.find((b) => csat >= b.min && csat <= b.max);
      if (!bucket) continue;

      bucket.total++;

      // Check if this customer has a confirmed booking after response date
      const hasReturn = providerBookings.some(
        (b) => (b.customer_user_id as number) === custId && (b.start_at as string) > responseDate
      );
      if (hasReturn) bucket.returned++;
    }

    for (const bucket of scoreBuckets) {
      if (bucket.total > 0) {
        csatRetentionRate.push({
          scoreLabel: bucket.label,
          minScore: bucket.min,
          maxScore: bucket.max,
          totalCount: bucket.total,
          returnedCount: bucket.returned,
          retentionRate: Math.round((bucket.returned / bucket.total) * 100),
        });
      }
    }
  }

  // -- g2. CSAT x Unit Price (満足度スコア別の平均顧客単価) --
  const csatVsUnitPrice: CsatVsUnitPrice[] = [];
  const csatVsLtv: CsatVsLtv[] = [];

  if (customerCsat.size > 0 && customerSpend.size > 0) {
    // Build per-customer: avgCsat, unitPrice, totalLtv
    const customerAnalysis: { custId: number; avgCsat: number; unitPrice: number; ltv: number }[] = [];
    for (const [custId, csatEntry] of customerCsat) {
      const spend = customerSpend.get(custId);
      if (!spend || spend.bookingCount === 0) continue;
      customerAnalysis.push({
        custId,
        avgCsat: csatEntry.csatSum / csatEntry.count,
        unitPrice: Math.round(spend.totalRevenue / spend.bookingCount),
        ltv: spend.totalRevenue,
      });
    }

    // Score buckets: 満足(4-5) / 普通(3) / 不満足(1-2)
    const scoreBucketsForRevenue = [
      { label: "満足（4, 5）", min: 3.5, max: 5 },
      { label: "普通（3）", min: 2.5, max: 3.4 },
      { label: "不満足（1, 2）", min: 1, max: 2.4 },
    ];

    for (const bucket of scoreBucketsForRevenue) {
      const customers = customerAnalysis.filter(
        (c) => c.avgCsat >= bucket.min && c.avgCsat <= bucket.max
      );
      if (customers.length > 0) {
        csatVsUnitPrice.push({
          scoreLabel: bucket.label,
          minScore: bucket.min,
          maxScore: bucket.max,
          avgUnitPrice: Math.round(customers.reduce((s, c) => s + c.unitPrice, 0) / customers.length),
          customerCount: customers.length,
        });
        csatVsLtv.push({
          scoreLabel: bucket.label,
          minScore: bucket.min,
          maxScore: bucket.max,
          avgLtv: Math.round(customers.reduce((s, c) => s + c.ltv, 0) / customers.length),
          customerCount: customers.length,
        });
      }
    }
  }

  // -- h. Survey Benchmark (同カテゴリ��平均満足度・回答率・ドライバー) --
  let surveyBenchmark: SurveyBenchmark = { available: false, providerCount: 0 };
  if (provider.category) {
    const { data: benchmarkData, error: benchmarkError } = await supabase.rpc(
      "get_category_survey_benchmark",
      { p_category: provider.category }
    );

    if (!benchmarkError && benchmarkData) {
      const bd = benchmarkData as Record<string, unknown>;
      if (bd.available) {
        surveyBenchmark = {
          available: true,
          providerCount: Number(bd.provider_count ?? 0),
          avgCsat: Number(bd.avg_csat ?? 0),
          avgResponseRate: Number(bd.avg_response_rate ?? 0),
          avgDriverService: Number(bd.avg_driver_service ?? 0),
          avgDriverQuality: Number(bd.avg_driver_quality ?? 0),
          avgDriverPrice: Number(bd.avg_driver_price ?? 0),
        };
      } else {
        surveyBenchmark = { available: false, providerCount: Number(bd.provider_count ?? 0) };
      }
    }
  }

  return {
    csatTrend,
    driverTrend,
    menuCsat,
    segmentCsat,
    driverAverages,
    genderCsat,
    ageCsat,
    unitPriceCsat,
    newVsRepeaterCsat,
    revenueCorrelation,
    revenueCsatInsight,
    menuCsatMatrix,
    driverRegression,
    csatRetentionRate,
    csatVsUnitPrice,
    csatVsLtv,
    surveyBenchmark,
  };
}

function emptyAdvancedStats(): SurveyAdvancedStats {
  return {
    csatTrend: [], driverTrend: [], menuCsat: [], segmentCsat: [],
    driverAverages: { service: 0, quality: 0, price: 0 },
    genderCsat: [], ageCsat: [],
    unitPriceCsat: [], newVsRepeaterCsat: [], revenueCorrelation: [],
    revenueCsatInsight: null,
    menuCsatMatrix: [], driverRegression: [],
    csatRetentionRate: [],
    csatVsUnitPrice: [], csatVsLtv: [],
    surveyBenchmark: { available: false, providerCount: 0 },
  };
}
