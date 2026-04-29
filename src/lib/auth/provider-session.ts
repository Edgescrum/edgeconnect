import { cache } from "react";
import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { log, logError } from "@/lib/log";

/**
 * Server Actions 用: provider の id と slug を取得する。
 * subscription_status が inactive の場合はエラーをスローする。
 * billing 関連の操作では skipSubscriptionCheck: true を指定してスキップ可能。
 */
export const getProviderId = cache(async (options?: { skipSubscriptionCheck?: boolean }) => {
  const user = await resolveUser();
  if (!user || user.role !== "provider") {
    logError("provider-session", "getProviderId: not a provider", { role: user?.role });
    throw new Error("Not authorized");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("providers")
    .select("id, slug, subscription_status")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    logError("provider-session", "getProviderId: provider not found", error);
    throw new Error("Provider not found");
  }

  // subscription_status チェック（SUB-4: Server Actions ガード）
  if (!options?.skipSubscriptionCheck && data.subscription_status === "inactive") {
    logError("provider-session", "getProviderId: subscription inactive", { id: data.id });
    throw new Error("subscription_inactive");
  }

  log("provider-session", "getProviderId: resolved", { id: data.id, slug: data.slug });
  return data;
});

/**
 * page.tsx 用: subscription_status が inactive なら /provider/billing にリダイレクトする。
 * /provider/billing と /provider/register からは呼ばないこと。
 */
export async function requireActiveSubscription(userId: number): Promise<void> {
  const supabase = await createClient();
  const { data: provider } = await supabase
    .from("providers")
    .select("subscription_status")
    .eq("user_id", userId)
    .single();

  if (provider && provider.subscription_status === "inactive") {
    redirect("/provider/billing");
  }
}
