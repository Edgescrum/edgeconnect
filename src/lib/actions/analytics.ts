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

/** 月間統計（予約数・売上・キャンセル率） */
export async function getMonthlyStats(months: number = 6) {
  const provider = await requireStandardPlan();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_monthly_stats", {
    p_provider_id: provider.id,
    p_months: months,
  });

  if (error) throw new Error(error.message);
  return data || [];
}

/** 人気メニューランキング */
export async function getPopularMenus() {
  const provider = await requireStandardPlan();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_popular_menus", {
    p_provider_id: provider.id,
  });

  if (error) throw new Error(error.message);
  return data || [];
}

/** 曜日x時間帯別予約傾向（ヒートマップ） */
export async function getBookingHeatmap() {
  const provider = await requireStandardPlan();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_booking_heatmap", {
    p_provider_id: provider.id,
  });

  if (error) throw new Error(error.message);
  return data || [];
}

/** リピート率 */
export async function getRepeatRate() {
  const provider = await requireStandardPlan();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_repeat_rate", {
    p_provider_id: provider.id,
  });

  if (error) throw new Error(error.message);
  return data || { total_customers: 0, repeat_customers: 0, repeat_rate: 0 };
}

/** LTV統計・顧客セグメント */
export async function getLtvStats() {
  const provider = await requireStandardPlan();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_ltv_stats", {
    p_provider_id: provider.id,
  });

  if (error) throw new Error(error.message);
  return data || { avg_ltv: 0, segments: { excellent: 0, normal: 0, dormant: 0, at_risk: 0 } };
}

/** 業界ベンチマーク */
export async function getCategoryBenchmark() {
  const provider = await requireStandardPlan();
  const supabase = await createClient();

  if (!provider.category) {
    return { available: false, provider_count: 0 };
  }

  const { data, error } = await supabase.rpc("get_category_benchmark", {
    p_category: provider.category,
  });

  if (error) throw new Error(error.message);
  return data || { available: false, provider_count: 0 };
}

/** セグメント別フィルタリングデータ型 */
export type SegmentKey = "all" | "excellent" | "normal" | "dormant" | "at_risk";

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
}

/** セグメントでフィルタリングされた分析データを取得 */
export async function getAnalyticsBySegment(
  segment: SegmentKey
): Promise<SegmentFilteredData> {
  const provider = await requireStandardPlan();
  const supabase = await createClient();

  const segmentParam = segment === "all" ? null : segment;

  // Critical 2: セグメントの顧客IDリストを1回だけ取得し、各RPCに渡す
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
  ] = await Promise.all([
    supabase.rpc("get_monthly_stats_filtered", {
      p_provider_id: provider.id,
      p_months: 24,
      p_customer_ids: customerIds,
    }),
    supabase.rpc("get_monthly_avg_interval_filtered", {
      p_provider_id: provider.id,
      p_months: 24,
      p_customer_ids: customerIds,
    }),
    supabase.rpc("get_avg_booking_interval_filtered", {
      p_provider_id: provider.id,
      p_customer_ids: customerIds,
    }),
    supabase.rpc("get_popular_menus_filtered", {
      p_provider_id: provider.id,
      p_customer_ids: customerIds,
    }),
    supabase.rpc("get_booking_heatmap_filtered", {
      p_provider_id: provider.id,
      p_customer_ids: customerIds,
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

  const { data, error } = await supabase.rpc("get_monthly_stats", {
    p_provider_id: provider.id,
    p_months: 2,
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
