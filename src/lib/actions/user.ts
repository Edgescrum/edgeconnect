"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveUser } from "@/lib/auth/session";
import { log, logError } from "@/lib/log";

export async function updateUserSettings(name: string, phone: string) {
  const user = await resolveUser();
  if (!user) throw new Error("ログインが必要です");

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({
      customer_name: name.trim() || null,
      customer_phone: phone.trim() || null,
    })
    .eq("id", user.id);

  if (error) {
    logError("updateUserSettings", "failed", error);
    throw new Error("保存に失敗しました");
  }

  log("updateUserSettings", "success", { userId: user.id });
}
