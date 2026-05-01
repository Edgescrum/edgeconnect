"use server";

import { createClient } from "@/lib/supabase/server";
import { getProviderId as getProviderData } from "@/lib/auth/provider-session";

async function getProvider() {
  return await getProviderData();
}

/** プランチェック: standard 以上が必要 */
async function requireStandardPlan() {
  const supabase = await createClient();
  const provider = await getProvider();
  const { data } = await supabase
    .from("providers")
    .select("plan, category")
    .eq("id", provider.id)
    .single();

  if (!data || data.plan === "basic") {
    throw new Error("この機能はスタンダードプラン以上でご利用いただけます");
  }
  return { ...provider, plan: data.plan, category: data.category };
}

/** 業界ベンチマーク（フィルター適用後の自分データ vs 業界平均） */
export async function getCategoryBenchmark(
  segment: SegmentKey = "all",
  dateRange: DateRangeKey = "all"
) {
  const provider = await requireStandardPlan();
  const supabase = await createClient();

  if (!provider.category) {
    return { available: false, provider_count: 0 };
  }

  const { data, error } = await supabase.rpc("get_category_benchmark", {
    p_category: provider.category,
  });

  if (error) throw new Error(error.message);
  if (!data || !data.available) {
    return data || { available: false, provider_count: 0 };
  }

  // Calculate user's own values with filters applied
  const { startDate, endDate } = computeDateRange(dateRange);
  const segmentParam = segment === "all" ? null : segment;

  let customerIds: number[] | null = null;
  if (segmentParam) {
    const { data: segmentData } = await supabase.rpc("get_segment_customer_ids", {
      p_provider_id: provider.id,
      p_segment: segmentParam,
    });
    customerIds = segmentData
      ? (segmentData as { customer_user_id: number }[]).map((r) => r.customer_user_id)
      : [];
  }

  // Get user's monthly stats (current month for comparison with benchmark)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const filterStart = startDate || monthStart;
  const filterEnd = endDate || now.toISOString();

  const [monthlyResult, intervalResult] = await Promise.all([
    supabase.rpc("get_monthly_stats_filtered", {
      p_provider_id: provider.id,
      p_months: 120,
      p_customer_ids: customerIds,
    }),
    supabase.rpc("get_avg_booking_interval_filtered", {
      p_provider_id: provider.id,
      p_customer_ids: customerIds,
      p_start_date: filterStart,
      p_end_date: filterEnd,
    }),
  ]);

  // Calculate user's monthly bookings and revenue based on date range filter
  const monthlyData = (monthlyResult.data || []) as Record<string, unknown>[];
  let filteredData = monthlyData;
  if (dateRange === "this_month") {
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    filteredData = monthlyData.filter((d) => (d.month as string) === currentMonth);
  } else if (dateRange === "this_year") {
    const currentYear = now.getFullYear().toString();
    filteredData = monthlyData.filter((d) => (d.month as string).startsWith(currentYear));
  }

  // Calculate monthly averages
  const totalBookings = filteredData.reduce((sum, d) => sum + Number(d.booking_count ?? 0), 0);
  const totalRevenue = filteredData.reduce((sum, d) => sum + Number(d.revenue ?? 0), 0);
  const totalUniqueCustomers = filteredData.reduce((sum, d) => sum + Number(d.unique_customers ?? 0), 0);
  const monthCount = filteredData.length || 1;

  const myMonthlyBookings = Math.round((totalBookings / monthCount) * 10) / 10;
  const myMonthlyRevenue = Math.round(totalRevenue / monthCount);
  const myUnitPrice = totalUniqueCustomers > 0
    ? Math.round(totalRevenue / totalUniqueCustomers)
    : null;

  const intervalData = intervalResult.data as Record<string, unknown> | null;
  const myAvgInterval = intervalData ? Number(intervalData.avg_interval_days ?? 0) : 0;

  return {
    ...data,
    my_monthly_bookings: myMonthlyBookings,
    my_monthly_revenue: myMonthlyRevenue,
    my_avg_interval: myAvgInterval > 0 ? Math.round(myAvgInterval * 10) / 10 : null,
    my_unit_price: myUnitPrice,
  };
}

/** セグメント別フィルタリングデータ型 */
export type SegmentKey = "all" | "excellent" | "normal" | "dormant" | "at_risk";
export type DateRangeKey = "this_month" | "this_year" | "all";

export interface SegmentFilteredData {
  allMonthlyData: {
    month: string;
    booking_count: number;
    revenue: number;
    cancel_count: number;
    cancel_rate: number;
    unique_customers: number;
  }[];
  monthlyAvgInterval: {
    month: string;
    avg_interval_days: number;
  }[];
  avgBookingInterval: {
    avg_interval_days: number;
    total_customers: number;
    customers_with_interval: number;
  };
  popularMenus: {
    service_id: number;
    service_name: string;
    booking_count: number;
  }[];
  heatmapData: {
    day_of_week: number;
    hour_of_day: number;
    booking_count: number;
  }[];
  ltvStats: {
    avg_ltv: number;
    segments: {
      excellent: number;
      normal: number;
      dormant: number;
      at_risk: number;
    };
  };
}

/** 期間フィルターからRPC用の日付範囲を算出 */
function computeDateRange(dateRange: DateRangeKey): { startDate: string | null; endDate: string | null } {
  if (dateRange === "all") {
    return { startDate: null, endDate: null };
  }
  const now = new Date();
  if (dateRange === "this_month") {
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    return { startDate, endDate: now.toISOString() };
  }
  // this_year
  const startDate = new Date(now.getFullYear(), 0, 1).toISOString();
  return { startDate, endDate: now.toISOString() };
}

/** セグメント + 期間でフィルタリングされた分析データを取得 */
export async function getAnalyticsBySegment(
  segment: SegmentKey,
  dateRange: DateRangeKey = "all"
): Promise<SegmentFilteredData> {
  const provider = await requireStandardPlan();
  const supabase = await createClient();

  const segmentParam = segment === "all" ? null : segment;
  const { startDate, endDate } = computeDateRange(dateRange);

  // セグメントの顧客IDリストを1回だけ取得し、各RPCに渡す
  let customerIds: number[] | null = null;
  if (segmentParam) {
    const { data: segmentData, error: segmentError } = await supabase.rpc(
      "get_segment_customer_ids",
      {
        p_provider_id: provider.id,
        p_segment: segmentParam,
      }
    );
    if (segmentError) {
      console.error("[getAnalyticsBySegment] get_segment_customer_ids error:", segmentError);
    }
    customerIds = segmentData
      ? (segmentData as { customer_user_id: number }[]).map(
          (r) => r.customer_user_id
        )
      : [];
  }

  const [
    monthly24Result,
    monthlyAvgIntervalResult,
    avgIntervalResult,
    menusResult,
    heatmapResult,
    ltvResult,
  ] = await Promise.all([
    supabase.rpc("get_monthly_stats_filtered", {
      p_provider_id: provider.id,
      p_months: 120,
      p_customer_ids: customerIds,
    }),
    supabase.rpc("get_monthly_avg_interval_filtered", {
      p_provider_id: provider.id,
      p_months: 120,
      p_customer_ids: customerIds,
    }),
    supabase.rpc("get_avg_booking_interval_filtered", {
      p_provider_id: provider.id,
      p_customer_ids: customerIds,
      p_start_date: startDate,
      p_end_date: endDate,
    }),
    supabase.rpc("get_popular_menus_filtered", {
      p_provider_id: provider.id,
      p_customer_ids: customerIds,
      p_start_date: startDate,
      p_end_date: endDate,
    }),
    supabase.rpc("get_booking_heatmap_filtered", {
      p_provider_id: provider.id,
      p_customer_ids: customerIds,
      p_start_date: startDate,
      p_end_date: endDate,
    }),
    supabase.rpc("get_ltv_stats_filtered", {
      p_provider_id: provider.id,
      p_customer_ids: customerIds,
      p_start_date: startDate,
      p_end_date: endDate,
    }),
  ]);

  // エラーログ出力（デバッグ用）
  if (monthly24Result.error) {
    console.error("[getAnalyticsBySegment] get_monthly_stats error:", monthly24Result.error);
  }
  if (monthlyAvgIntervalResult.error) {
    console.error("[getAnalyticsBySegment] get_monthly_avg_interval error:", monthlyAvgIntervalResult.error);
  }
  if (avgIntervalResult.error) {
    console.error("[getAnalyticsBySegment] get_avg_booking_interval error:", avgIntervalResult.error);
  }
  if (menusResult.error) {
    console.error("[getAnalyticsBySegment] get_popular_menus error:", menusResult.error);
  }
  if (heatmapResult.error) {
    console.error("[getAnalyticsBySegment] get_booking_heatmap error:", heatmapResult.error);
  }
  if (ltvResult.error) {
    console.error("[getAnalyticsBySegment] get_ltv_stats_filtered error:", ltvResult.error);
  }

  const allMonthlyData = (monthly24Result.data || []).map(
    (row: Record<string, unknown>) => ({
      month: row.month as string,
      booking_count: Number(row.booking_count ?? 0),
      revenue: Number(row.revenue ?? 0),
      cancel_count: Number(row.cancel_count ?? 0),
      cancel_rate: Number(row.cancel_rate ?? 0),
      unique_customers: Number(row.unique_customers ?? 0),
    })
  );

  const monthlyAvgInterval = (monthlyAvgIntervalResult.data || []).map(
    (row: Record<string, unknown>) => ({
      month: row.month as string,
      avg_interval_days: Number(row.avg_interval_days ?? 0),
    })
  );

  const popularMenus = (menusResult.data || []).map(
    (row: Record<string, unknown>) => ({
      service_id: Number(row.service_id ?? 0),
      service_name: String(row.service_name ?? ""),
      booking_count: Number(row.booking_count ?? 0),
    })
  );

  const heatmapData = (heatmapResult.data || []).map(
    (row: Record<string, unknown>) => ({
      day_of_week: Number(row.day_of_week ?? 0),
      hour_of_day: Number(row.hour_of_day ?? 0),
      booking_count: Number(row.booking_count ?? 0),
    })
  );

  // avgBookingInterval は JSON を返す RPC なので data がオブジェクト
  const avgData = avgIntervalResult.data as Record<string, unknown> | null;

  // ltvStats は JSON を返す RPC
  const ltvData = ltvResult.data as Record<string, unknown> | null;
  const ltvSegments = (ltvData?.segments ?? {}) as Record<string, unknown>;

  return {
    allMonthlyData,
    monthlyAvgInterval,
    avgBookingInterval: avgData
      ? {
          avg_interval_days: Number(avgData.avg_interval_days ?? 0),
          total_customers: Number(avgData.total_customers ?? 0),
          customers_with_interval: Number(avgData.customers_with_interval ?? 0),
        }
      : {
          avg_interval_days: 0,
          total_customers: 0,
          customers_with_interval: 0,
        },
    popularMenus,
    heatmapData,
    ltvStats: ltvData
      ? {
          avg_ltv: Number(ltvData.avg_ltv ?? 0),
          segments: {
            excellent: Number(ltvSegments.excellent ?? 0),
            normal: Number(ltvSegments.normal ?? 0),
            dormant: Number(ltvSegments.dormant ?? 0),
            at_risk: Number(ltvSegments.at_risk ?? 0),
          },
        }
      : { avg_ltv: 0, segments: { excellent: 0, normal: 0, dormant: 0, at_risk: 0 } },
  };
}

/** ダッシュボードサマリー（今月の予約数・売上見込み＋前月比） */
export async function getDashboardSummary() {
  const provider = await getProvider();
  const supabase = await createClient();

  // プランチェック
  const { data: providerData } = await supabase
    .from("providers")
    .select("plan")
    .eq("id", provider.id)
    .single();

  if (!providerData || providerData.plan === "basic") {
    return null; // ベーシックプランは非表示
  }

  const { data, error } = await supabase.rpc("get_monthly_stats_filtered", {
    p_provider_id: provider.id,
    p_months: 2,
    p_customer_ids: null,
  });

  if (error || !data || data.length === 0) return null;

  const thisMonth = data[data.length - 1];
  const lastMonth = data.length > 1 ? data[data.length - 2] : null;

  return {
    bookingCount: thisMonth.booking_count || 0,
    revenue: thisMonth.revenue || 0,
    bookingCountDiff: lastMonth
      ? (thisMonth.booking_count || 0) - (lastMonth.booking_count || 0)
      : null,
    revenueDiff: lastMonth
      ? (thisMonth.revenue || 0) - (lastMonth.revenue || 0)
      : null,
  };
}
