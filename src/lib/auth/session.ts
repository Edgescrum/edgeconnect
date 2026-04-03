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
    log("auth", "getCurrentUser: no auth session");
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

  log("auth", "getCurrentUser: resolved", { id: data.id, role: data.role });
  return {
    id: data.id,
    lineUserId: data.line_user_id,
    displayName: data.display_name,
    role: data.role,
    authUid: data.auth_uid,
  };
});

export async function resolveUser(lineUserId?: string | null): Promise<CurrentUser | null> {
  // 1. Supabase Authセッション
  const authUser = await getCurrentUser();
  if (authUser) return authUser;

  if (!lineUserId) {
    log("auth", "resolveUser: no auth session and no lineUserId");
    return null;
  }

  // 2. lineUserIdでDB検索
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("users")
    .select("id, line_user_id, display_name, role, auth_uid")
    .eq("line_user_id", lineUserId)
    .single();

  if (data) {
    log("auth", "resolveUser: found by lineUserId", { id: data.id });
    return {
      id: data.id,
      lineUserId: data.line_user_id,
      displayName: data.display_name,
      role: data.role,
      authUid: data.auth_uid || "",
    };
  }

  // 3. 自動作成
  log("auth", "resolveUser: creating user", lineUserId);
  const { data: created, error } = await supabase.rpc("upsert_user_from_line", {
    p_line_user_id: lineUserId,
    p_display_name: null,
    p_role: "customer",
    p_auth_uid: null,
  });

  if (error) {
    logError("auth", "resolveUser: create failed", error);
    return null;
  }

  if (created) {
    log("auth", "resolveUser: user created", created);
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
