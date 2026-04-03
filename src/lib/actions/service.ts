"use server";

import { createClient } from "@/lib/supabase/server";
import { getProviderId } from "@/lib/auth/provider-session";
import { revalidatePath } from "next/cache";

export async function createService(formData: FormData) {
  const provider = await getProviderId();
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const durationMin = parseInt(formData.get("duration_min") as string, 10);
  const price = parseInt(formData.get("price") as string, 10);
  const cancelDeadlineHours = parseInt(
    (formData.get("cancel_deadline_hours") as string) || "24",
    10
  );
  const cancelPolicyNote =
    (formData.get("cancel_policy_note") as string) || null;

  if (!name || isNaN(durationMin) || isNaN(price)) {
    throw new Error("必須項目を入力してください");
  }
  if (durationMin <= 0) throw new Error("所要時間は1分以上にしてください");
  if (price < 0) throw new Error("料金は0以上にしてください");

  const { error } = await supabase.from("services").insert({
    provider_id: provider.id,
    name,
    description,
    duration_min: durationMin,
    price,
    is_published: true,
    cancel_deadline_hours: cancelDeadlineHours,
    cancel_policy_note: cancelPolicyNote,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/provider/services");
  revalidatePath(`/p/${provider.slug}`);
}

export async function updateService(serviceId: number, formData: FormData) {
  const provider = await getProviderId();
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const durationMin = parseInt(formData.get("duration_min") as string, 10);
  const price = parseInt(formData.get("price") as string, 10);
  const cancelDeadlineHours = parseInt(
    (formData.get("cancel_deadline_hours") as string) || "24",
    10
  );
  const cancelPolicyNote =
    (formData.get("cancel_policy_note") as string) || null;

  if (!name || isNaN(durationMin) || isNaN(price)) {
    throw new Error("必須項目を入力してください");
  }

  const { error } = await supabase
    .from("services")
    .update({
      name,
      description,
      duration_min: durationMin,
      price,
      cancel_deadline_hours: cancelDeadlineHours,
      cancel_policy_note: cancelPolicyNote,
    })
    .eq("id", serviceId)
    .eq("provider_id", provider.id);

  if (error) throw new Error(error.message);

  revalidatePath("/provider/services");
  revalidatePath(`/p/${provider.slug}`);
}

export async function toggleServicePublished(
  serviceId: number,
  isPublished: boolean
) {
  const provider = await getProviderId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("services")
    .update({ is_published: isPublished })
    .eq("id", serviceId)
    .eq("provider_id", provider.id);

  if (error) throw new Error(error.message);

  revalidatePath("/provider/services");
  revalidatePath(`/p/${provider.slug}`);
}

export async function deleteService(serviceId: number) {
  const provider = await getProviderId();
  const supabase = await createClient();

  // 予約がある場合は非公開にするだけ
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id")
    .eq("service_id", serviceId)
    .eq("status", "confirmed")
    .limit(1);

  if (bookings && bookings.length > 0) {
    throw new Error(
      "確定済みの予約があるため削除できません。非公開に切り替えてください。"
    );
  }

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId)
    .eq("provider_id", provider.id);

  if (error) throw new Error(error.message);

  revalidatePath("/provider/services");
  revalidatePath(`/p/${provider.slug}`);
}
