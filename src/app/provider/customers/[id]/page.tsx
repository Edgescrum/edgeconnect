import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth/provider-session";
import { CustomerDetailClient } from "./customer-detail-client";
import { getCustomerSurveyData } from "@/lib/actions/survey";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customerUserId = parseInt(id, 10);
  if (isNaN(customerUserId)) redirect("/provider/customers");

  const user = await resolveUser();
  if (!user) redirect("/");
  if (user.role !== "provider") redirect("/");

  await requireActiveSubscription(user.id);

  const supabase = await createClient();

  const { data: provider } = await supabase
    .from("providers")
    .select("id, plan")
    .eq("user_id", user.id)
    .single();

  if (!provider) redirect("/provider/register");
  if (provider.plan === "basic") redirect("/provider/customers");

  // 並列でデータ取得
  const [detailResult, monthlyResult, bookingsResult, notesResult, settingsResult, avgResult, menuBreakdownResult, surveyData] = await Promise.all([
    supabase.rpc("get_customer_detail", {
      p_provider_id: provider.id,
      p_customer_user_id: customerUserId,
    }),
    supabase.rpc("get_customer_monthly_visits", {
      p_provider_id: provider.id,
      p_customer_user_id: customerUserId,
    }),
    supabase
      .from("bookings")
      .select("id, start_at, end_at, status, cancelled_by, services(name, price)")
      .eq("provider_id", provider.id)
      .eq("customer_user_id", customerUserId)
      .order("start_at", { ascending: false }),
    supabase
      .from("customer_notes")
      .select("memo, custom_fields")
      .eq("provider_id", provider.id)
      .eq("customer_user_id", customerUserId)
      .maybeSingle(),
    supabase
      .from("provider_settings")
      .select("customer_custom_labels")
      .eq("provider_id", provider.id)
      .single(),
    supabase.rpc("get_customer_averages", {
      p_provider_id: provider.id,
    }),
    supabase.rpc("get_customer_menu_breakdown", {
      p_provider_id: provider.id,
      p_customer_user_id: customerUserId,
    }),
    getCustomerSurveyData(provider.id, customerUserId),
  ]);

  if (!detailResult.data) redirect("/provider/customers");

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-lg sm:max-w-3xl">
        <CustomerDetailClient
          detail={detailResult.data}
          monthlyVisits={monthlyResult.data || []}
          bookings={bookingsResult.data || []}
          notes={notesResult.data || { memo: null, custom_fields: {} }}
          customLabels={(settingsResult.data?.customer_custom_labels as string[]) || []}
          customerUserId={customerUserId}
          customerAverages={avgResult.data || null}
          menuBreakdown={menuBreakdownResult.data || []}
          surveyResponses={surveyData.responses}
          surveyKpi={surveyData.kpi}
        />
      </div>
    </main>
  );
}
