import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth/provider-session";
import { AnalyticsClient } from "./analytics-client";

export default async function AnalyticsPage() {
  const user = await resolveUser();
  if (!user) redirect("/");
  if (user.role !== "provider") redirect("/");

  await requireActiveSubscription(user.id);

  const supabase = await createClient();

  const { data: provider } = await supabase
    .from("providers")
    .select("id, plan, category")
    .eq("user_id", user.id)
    .single();

  if (!provider) redirect("/provider/register");

  // プランチェック
  if (provider.plan === "basic") {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-lg sm:max-w-none">
          <div className="hidden sm:mb-6 sm:block">
            <h1 className="text-xl font-bold">予約分析</h1>
          </div>
          <div className="mt-8 rounded-2xl bg-card p-8 text-center ring-1 ring-border">
            <p className="text-4xl">&#x1F4CA;</p>
            <h2 className="mt-4 text-lg font-bold">予約分析はスタンダードプランの機能です</h2>
            <p className="mt-2 text-sm text-muted">
              予約数・売上・顧客分析などのデータを確認できます
            </p>
            <a
              href="/provider/billing"
              className="mt-4 inline-block rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white"
            >
              プランをアップグレード
            </a>
          </div>
        </div>
      </main>
    );
  }

  // 全データを並列取得（get_monthly_stats は24ヶ月分を1回だけ取得し、クライアントでスライス）
  const [
    monthly24Result,
    menusResult,
    heatmapResult,
    avgIntervalResult,
    monthlyAvgIntervalResult,
    ltvResult,
    benchmarkResult,
  ] = await Promise.all([
    supabase.rpc("get_monthly_stats", {
      p_provider_id: provider.id,
      p_months: 24,
    }),
    supabase.rpc("get_popular_menus", {
      p_provider_id: provider.id,
    }),
    supabase.rpc("get_booking_heatmap", {
      p_provider_id: provider.id,
    }),
    supabase.rpc("get_avg_booking_interval", {
      p_provider_id: provider.id,
    }),
    supabase.rpc("get_monthly_avg_interval", {
      p_provider_id: provider.id,
      p_months: 24,
    }),
    supabase.rpc("get_ltv_stats", {
      p_provider_id: provider.id,
    }),
    provider.category
      ? supabase.rpc("get_category_benchmark", {
          p_category: provider.category,
        })
      : Promise.resolve({ data: { available: false, provider_count: 0 } }),
  ]);

  // unique_customers が RPC から返されない場合（マイグレーション未適用時）のフォールバック
  const allMonthlyData = (monthly24Result.data || []).map((row: Record<string, unknown>) => ({
    month: row.month as string,
    booking_count: Number(row.booking_count ?? 0),
    revenue: Number(row.revenue ?? 0),
    cancel_count: Number(row.cancel_count ?? 0),
    cancel_rate: Number(row.cancel_rate ?? 0),
    unique_customers: Number(row.unique_customers ?? 0),
  }));

  // 月別平均予約間隔データ
  const monthlyAvgInterval = (monthlyAvgIntervalResult.data || []).map((row: Record<string, unknown>) => ({
    month: row.month as string,
    avg_interval_days: Number(row.avg_interval_days ?? 0),
  }));

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-lg sm:max-w-5xl">
        <div className="hidden sm:mb-6 sm:block">
          <h1 className="text-xl font-bold">予約分析</h1>
          <p className="mt-1 text-sm text-muted">予約データから傾向を把握できます</p>
        </div>
        <AnalyticsClient
          allMonthlyData={allMonthlyData}
          monthlyAvgInterval={monthlyAvgInterval}
          popularMenus={menusResult.data || []}
          heatmapData={heatmapResult.data || []}
          avgBookingInterval={avgIntervalResult.data || { avg_interval_days: 0, total_customers: 0, customers_with_interval: 0 }}
          ltvStats={ltvResult.data || { avg_ltv: 0, segments: { excellent: 0, normal: 0, dormant: 0, at_risk: 0 } }}
          benchmark={benchmarkResult.data || { available: false, provider_count: 0 }}
        />
      </div>
    </main>
  );
}
