import { createClient } from "@/lib/supabase/server";

export interface CurrentUser {
  id: number;
  lineUserId: string;
  displayName: string | null;
  role: "provider" | "customer";
  authUid: string;
}

// Server Component / Server Action で現在のユーザーを取得する
export async function getCurrentUser(): Promise<CurrentUser | null> {
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
}
