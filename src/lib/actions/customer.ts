"use server";

import { createClient } from "@/lib/supabase/server";
import { getProviderId as getProviderData } from "@/lib/auth/provider-session";
import { revalidatePath } from "next/cache";

async function getProvider() {
  return await getProviderData();
}

/** プランチェック: standard 以上が必要 */
async function requireStandardPlan() {
  const supabase = await createClient();
  const provider = await getProvider();
  const { data } = await supabase
    .from("providers")
    .select("plan")
    .eq("id", provider.id)
    .single();

  if (!data || data.plan === "basic") {
    throw new Error("この機能はスタンダードプラン以上でご利用いただけます");
  }
  return provider;
}

/** 顧客一覧を取得 */
export async function getCustomers(query?: string, filter?: string) {
  const provider = await requireStandardPlan();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_customers", {
    p_provider_id: provider.id,
    p_query: query || null,
    p_filter: filter || "all",
  });

  if (error) throw new Error(error.message);
  return data || [];
}

/** 顧客詳細を取得 */
export async function getCustomerDetail(customerUserId: number) {
  const provider = await requireStandardPlan();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_customer_detail", {
    p_provider_id: provider.id,
    p_customer_user_id: customerUserId,
  });

  if (error) throw new Error(error.message);
  return data;
}

/** 月別来店数を取得 */
export async function getCustomerMonthlyVisits(customerUserId: number) {
  const provider = await requireStandardPlan();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_customer_monthly_visits", {
    p_provider_id: provider.id,
    p_customer_user_id: customerUserId,
  });

  if (error) throw new Error(error.message);
  return data || [];
}

/** 顧客の予約履歴を取得 */
export async function getCustomerBookings(customerUserId: number) {
  const provider = await requireStandardPlan();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select("id, start_at, end_at, status, cancelled_by, services(name, price)")
    .eq("provider_id", provider.id)
    .eq("customer_user_id", customerUserId)
    .order("start_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return data || [];
}

/** 顧客メモ・カスタム項目を取得 */
export async function getCustomerNotes(customerUserId: number) {
  const provider = await requireStandardPlan();
  const supabase = await createClient();

  const { data } = await supabase
    .from("customer_notes")
    .select("memo, custom_fields")
    .eq("provider_id", provider.id)
    .eq("customer_user_id", customerUserId)
    .maybeSingle();

  return data || { memo: null, custom_fields: {} };
}

/** 顧客メモ・カスタム項目を保存（upsert） */
export async function saveCustomerNotes(
  customerUserId: number,
  memo: string | null,
  customFields: Record<string, string>
) {
  const provider = await requireStandardPlan();
  const supabase = await createClient();

  const { error } = await supabase
    .from("customer_notes")
    .upsert(
      {
        provider_id: provider.id,
        customer_user_id: customerUserId,
        memo,
        custom_fields: customFields,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "provider_id,customer_user_id" }
    );

  if (error) throw new Error(error.message);
  revalidatePath(`/provider/customers/${customerUserId}`);
}

/** カスタム項目ラベルを取得 */
export async function getCustomerCustomLabels() {
  const provider = await getProvider();
  const supabase = await createClient();

  const { data } = await supabase
    .from("provider_settings")
    .select("customer_custom_labels")
    .eq("provider_id", provider.id)
    .single();

  return (data?.customer_custom_labels as string[]) || [];
}

/** カスタム項目ラベルを保存 */
export async function saveCustomerCustomLabels(labels: string[]) {
  const provider = await requireStandardPlan();
  const supabase = await createClient();

  // 最大3つまで
  const trimmed = labels.slice(0, 3).map((l) => l.trim()).filter(Boolean);

  const { error } = await supabase
    .from("provider_settings")
    .update({ customer_custom_labels: trimmed })
    .eq("provider_id", provider.id);

  if (error) throw new Error(error.message);
  revalidatePath("/provider/customers");
  revalidatePath("/provider/schedule");
}
