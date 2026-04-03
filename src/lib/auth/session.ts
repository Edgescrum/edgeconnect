import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export interface CurrentUser {
  id: number;
  lineUserId: string;
  displayName: string | null;
  role: "provider" | "customer";
  authUid: string;
}

// cache() で同一リクエスト内の複数呼び出しをメモ化
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data } = await supabase
    .from("users")
    .select("id, line_user_id, display_name, role, auth_uid")
    .eq("auth_uid", authUser.id)
    .single();

  if (!data) return null;

  return {
    id: data.id,
    lineUserId: data.line_user_id,
    displayName: data.display_name,
    role: data.role,
    authUid: data.auth_uid,
  };
});

// Supabase Auth → lineUserIdフォールバック → 自動作成
// sessionStorageキャッシュ残りでSupabase Authセッションがない場合でも動作する
export async function resolveUser(lineUserId?: string | null): Promise<CurrentUser | null> {
  // 1. Supabase Authセッションを試行
  const authUser = await getCurrentUser();
  if (authUser) return authUser;

  // 2. lineUserIdでDB検索
  if (!lineUserId) return null;

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

  // 3. ユーザーが存在しない場合は自動作成
  console.log("[resolveUser] creating user:", lineUserId);
  const { data: created } = await supabase.rpc("upsert_user_from_line", {
    p_line_user_id: lineUserId,
    p_display_name: null,
    p_role: "customer",
    p_auth_uid: null,
  });

  if (created) {
    return {
      id: (created as { id: number }).id,
      lineUserId,
      displayName: null,
      role: "customer",
      authUid: "",
    };
  }

  return null;
}
