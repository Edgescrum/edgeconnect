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
    .select("id, slug, name, icon_url")
    .eq("user_id", user.id)
    .single();

  if (!provider) redirect("/provider/register");

  // icon_url が未設定の場合、LINE プロフィール画像をフォールバック表示
  if (!provider.icon_url) {
    const { data: userData } = await supabase
      .from("users")
      .select("picture_url")
      .eq("id", user.id)
      .single();
    if (userData?.picture_url) {
      provider.icon_url = userData.picture_url;
    }
  }

  // 予約統計を並列取得（日本時間基準）
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const jstYear = jstNow.getUTCFullYear();
  const jstMonth = jstNow.getUTCMonth();
  const jstDate = jstNow.getUTCDate();
  // JST 00:00 を UTC に変換（-9時間）
  const todayStart = new Date(Date.UTC(jstYear, jstMonth, jstDate) - 9 * 60 * 60 * 1000).toISOString();
  const tomorrowStart = new Date(Date.UTC(jstYear, jstMonth, jstDate + 1) - 9 * 60 * 60 * 1000).toISOString();
  const weekEnd = new Date(Date.UTC(jstYear, jstMonth, jstDate + 7) - 9 * 60 * 60 * 1000).toISOString();

  const [
    { count: todayCount },
    { count: weekCount },
    { count: serviceCount },
    { data: settings },
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
  ]);

  const onboarding = {
    hasService: (serviceCount || 0) > 0,
    hasProfile: settings?.profile_completed ?? false,
    hasSchedule: settings?.schedule_completed ?? false,
    hasQrcode: settings?.qrcode_viewed ?? false,
  };

  return (
    <ProviderDashboard
      provider={provider}
      todayCount={todayCount || 0}
      weekCount={weekCount || 0}
      onboarding={onboarding}
    />
  );
}
