"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

async function getProviderId() {
  const user = await getCurrentUser();
  if (!user || user.role !== "provider") throw new Error("Not authorized");

  const supabase = await createClient();
  const { data } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!data) throw new Error("Provider not found");
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

  const { error } = await supabase.from("blocked_slots").insert({
    provider_id: providerId,
    start_at: startAt,
    end_at: endAt,
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
