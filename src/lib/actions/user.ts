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

export async function updateUserAttributes(
  gender: string | null,
  birthDate: string | null
) {
  const user = await resolveUser();
  if (!user) throw new Error("ログインが必要です");

  // gender バリデーション
  const validGenders = ["male", "female", "other", "prefer_not_to_say"];
  if (gender && !validGenders.includes(gender)) {
    throw new Error("無効な性別が指定されました");
  }

  // birthDate バリデーション
  if (birthDate) {
    const d = new Date(birthDate);
    if (isNaN(d.getTime())) {
      throw new Error("無効な日付が指定されました");
    }
    // 未来の日付を拒否
    if (d > new Date()) {
      throw new Error("未来の日付は指定できません");
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("users")
    .update({
      gender: gender || null,
      birth_date: birthDate || null,
    })
    .eq("id", user.id);

  if (error) {
    logError("updateUserAttributes", "failed", error);
    throw new Error("保存に失敗しました");
  }

  log("updateUserAttributes", "success", { userId: user.id });
}
