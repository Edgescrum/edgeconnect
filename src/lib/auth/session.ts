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

  if (!authUser) {
    return null;
  }

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

// cookie → DB（高速パス）を最初に試行
export const resolveUser = cache(async (lineUserId?: string | null): Promise<CurrentUser | null> => {
  // 1. cookieからlineUserId取得（最速パス）
  if (!lineUserId) {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      lineUserId = cookieStore.get("line_user_id")?.value || null;
    } catch { /* ignore */ }
  }

  // 2. lineUserIdがあればDB直接検索（Supabase Authスキップ）
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

  // 3. フォールバック: Supabase Authセッション
  const authUser = await getCurrentUser();
  if (authUser) return authUser;

  log("auth", "resolveUser: no user found");
  return null;
});
