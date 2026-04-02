import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProviderDashboard } from "./dashboard-content";

export default async function ProviderPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "provider") redirect("/provider/register");

  const supabase = await createClient();
  const { data: provider } = await supabase
    .from("providers")
    .select("id, slug, name, icon_url")
    .eq("user_id", user.id)
    .single();

  if (!provider) redirect("/provider/register");

  // 予約統計を並列取得
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
  const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString();

  const [{ count: todayCount }, { count: weekCount }] = await Promise.all([
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
  ]);

  return (
    <ProviderDashboard
      provider={provider}
      todayCount={todayCount || 0}
      weekCount={weekCount || 0}
    />
  );
}
