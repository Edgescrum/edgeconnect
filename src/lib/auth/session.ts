import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { log, logError } from "@/lib/log";
import { verifyCookieValue } from "@/lib/auth/cookie";

export interface CurrentUser {
  id: number;
  lineUserId: string;
  displayName: string | null;
  role: "provider" | "customer";
  authUid: string;
  isLineFriend: boolean;
  customerName: string | null;
  customerPhone: string | null;
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data, error } = await supabase
    .from("users")
    .select("id, line_user_id, display_name, role, auth_uid, is_line_friend, customer_name, customer_phone")
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
    isLineFriend: data.is_line_friend ?? false,
    customerName: data.customer_name ?? null,
    customerPhone: data.customer_phone ?? null,
  };
});

// Supabase Auth優先 → cookie fallback でユーザーを解決（RLS対応）
export const resolveUser = cache(async (): Promise<CurrentUser | null> => {
  // 1. Supabase Authセッション（RLSが効くメインパス）
  const authUser = await getCurrentUser();
  if (authUser) return authUser;

  // 2. フォールバック: httpOnly cookieからlineUserId取得（署名検証付き）
  let lineUserId: string | null = null;
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const rawCookie = cookieStore.get("line_user_id")?.value || null;
    if (rawCookie) {
      lineUserId = verifyCookieValue(rawCookie);
    }
  } catch { /* ignore */ }

  if (lineUserId) {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("users")
      .select("id, line_user_id, display_name, role, auth_uid, is_line_friend, customer_name, customer_phone")
      .eq("line_user_id", lineUserId)
      .single();

    if (data) {
      return {
        id: data.id,
        lineUserId: data.line_user_id,
        displayName: data.display_name,
        role: data.role,
        authUid: data.auth_uid || "",
        isLineFriend: data.is_line_friend ?? false,
        customerName: data.customer_name ?? null,
        customerPhone: data.customer_phone ?? null,
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
        isLineFriend: false,
        customerName: null,
        customerPhone: null,
      };
    }
  }

  log("auth", "resolveUser: no user found");
  return null;
});
