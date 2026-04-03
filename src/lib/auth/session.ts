import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { log, logError } from "@/lib/log";

export interface CurrentUser {
  id: number;
  lineUserId: string;
  displayName: string | null;
  role: "provider" | "customer";
  authUid: string;
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, line_user_id, display_name, role, auth_uid")
    .eq("auth_uid", authUser.id)
    .single();

  if (error || !data) {
    logError("auth", "getCurrentUser: user not found in DB", error);
    return null;
  }

  return {
    id: data.id,
    lineUserId: data.line_user_id,
    displayName: data.display_name,
    role: data.role,
    authUid: data.auth_uid,
  };
});

// Supabase Auth優先 → cookie fallback でユーザーを解決（RLS対応）
export const resolveUser = cache(async (): Promise<CurrentUser | null> => {
  // 1. Supabase Authセッション（RLSが効くメインパス）
  const authUser = await getCurrentUser();
  if (authUser) return authUser;

  // 2. フォールバック: httpOnly cookieからlineUserId取得
  let lineUserId: string | null = null;
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    lineUserId = cookieStore.get("line_user_id")?.value || null;
  } catch { /* ignore */ }

  if (lineUserId) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("users")
      .select("id, line_user_id, display_name, role, auth_uid")
      .eq("line_user_id", lineUserId)
      .single();

    if (data) {
      return {
        id: data.id,
        lineUserId: data.line_user_id,
        displayName: data.display_name,
        role: data.role,
        authUid: data.auth_uid || "",
      };
    }

    // ユーザーが存在しない場合は自動作成
    log("auth", "resolveUser: creating user", lineUserId);
    const { data: created, error } = await supabase.rpc("upsert_user_from_line", {
      p_line_user_id: lineUserId,
      p_display_name: null,
      p_role: "customer",
      p_auth_uid: null,
    });

    if (error) {
      logError("auth", "resolveUser: create failed", error);
    } else if (created) {
      return {
        id: (created as { id: number }).id,
        lineUserId,
        displayName: null,
        role: "customer",
        authUid: "",
      };
    }
  }

  log("auth", "resolveUser: no user found");
  return null;
});
