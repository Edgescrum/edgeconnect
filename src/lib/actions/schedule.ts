"use server";

import { createClient } from "@/lib/supabase/server";
import { getProviderId as getProviderData } from "@/lib/auth/provider-session";
import { revalidatePath } from "next/cache";

async function getProviderId() {
  const data = await getProviderData();
  return data.id;
}

// 営業時間 key: "0"(日)~"6"(土), value: {open, close} or null
export type BusinessHours = Record<
  string,
  { open: string; close: string } | null
>;

export async function updateBusinessHours(hours: BusinessHours) {
  const providerId = await getProviderId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("provider_settings")
    .update({ business_hours: hours })
    .eq("provider_id", providerId);

  if (error) throw new Error(error.message);
  revalidatePath("/provider/schedule");
}

export async function updateInterval(
  intervalBeforeMin: number,
  intervalAfterMin: number
) {
  const providerId = await getProviderId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("provider_settings")
    .update({
      interval_before_min: intervalBeforeMin,
      interval_after_min: intervalAfterMin,
    })
    .eq("provider_id", providerId);

  if (error) throw new Error(error.message);
  revalidatePath("/provider/schedule");
}

export async function addBlockedSlot(
  startAt: string,
  endAt: string,
  reason: string | null
) {
  const providerId = await getProviderId();
  const supabase = await createClient();

  // タイムゾーンが付いていない場合はJSTとして扱う
  const startAtJst = startAt.includes("+") || startAt.includes("Z") ? startAt : `${startAt}+09:00`;
  const endAtJst = endAt.includes("+") || endAt.includes("Z") ? endAt : `${endAt}+09:00`;

  const { error } = await supabase.from("blocked_slots").insert({
    provider_id: providerId,
    start_at: startAtJst,
    end_at: endAtJst,
    reason,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/provider/schedule");
}

export async function removeBlockedSlot(slotId: number) {
  const providerId = await getProviderId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("blocked_slots")
    .delete()
    .eq("id", slotId)
    .eq("provider_id", providerId);

  if (error) throw new Error(error.message);
  revalidatePath("/provider/schedule");
}
