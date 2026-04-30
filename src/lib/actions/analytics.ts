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
