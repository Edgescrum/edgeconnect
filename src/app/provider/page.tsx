import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth/provider-session";
import { ProviderDashboard } from "./dashboard-content";

export default async function ProviderPage() {
  const user = await resolveUser();
  if (!user) redirect("/");
  if (user.role !== "provider") redirect("/provider/register");

  await requireActiveSubscription(user.id);

  const supabase = await createClient();
  const { data: provider } = await supabase
    .from("providers")
    .select("id, slug, name, icon_url, plan")
    .eq("user_id", user.id)
    .single();

  if (!provider) redirect("/provider/register");

  // 予約統計を並列取得（日本時間基準）
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const jstYear = jstNow.getUTCFullYear();
  const jstMonth = jstNow.getUTCMonth();
  const jstDate = jstNow.getUTCDate();
  // JST 00:00 を UTC に変換（-9時間）
  const todayStart = new Date(Date.UTC(jstYear, jstMonth, jstDate) - 9 * 60 * 60 * 1000).toISOString();
  const tomorrowStart = new Date(Date.UTC(jstYear, jstMonth, jstDate + 1) - 9 * 60 * 60 * 1000).toISOString();
  const weekEnd = new Date(Date.UTC(jstYear, jstMonth, jstDate + 7) - 9 * 60 * 60 * 1000).toISOString();

  const isStandard = provider.plan !== "basic";

  const [
    { count: todayCount },
    { count: weekCount },
    { count: serviceCount },
    { data: settings },
    monthlyStatsResult,
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("provider_id", provider.id)
      .eq("status", "confirmed")
      .gte("start_at", todayStart)
      .lt("start_at", tomorrowStart),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("provider_id", provider.id)
      .eq("status", "confirmed")
      .gte("start_at", todayStart)
      .lt("start_at", weekEnd),
    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("provider_id", provider.id),
    supabase
      .from("provider_settings")
      .select("business_hours, profile_completed, schedule_completed, qrcode_viewed")
      .eq("provider_id", provider.id)
      .single(),
    isStandard
      ? supabase.rpc("get_monthly_stats", {
          p_provider_id: provider.id,
          p_months: 2,
        })
      : Promise.resolve(null),
  ]);

  const onboarding = {
    hasService: (serviceCount || 0) > 0,
    hasProfile: settings?.profile_completed ?? false,
    hasSchedule: settings?.schedule_completed ?? false,
    hasQrcode: settings?.qrcode_viewed ?? false,
  };

  // ダッシュボードサマリーの計算
  let dashboardSummary = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statsData = (monthlyStatsResult as any)?.data;
  if (isStandard && statsData && statsData.length > 0) {
    const thisMonth = statsData[statsData.length - 1];
    const lastMonth = statsData.length > 1 ? statsData[statsData.length - 2] : null;
    dashboardSummary = {
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

  return (
    <ProviderDashboard
      provider={provider}
      todayCount={todayCount || 0}
      weekCount={weekCount || 0}
      onboarding={onboarding}
      dashboardSummary={dashboardSummary}
    />
  );
}
