import { cache } from "react";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// 同一リクエスト内でキャッシュ（複数のServer Actionから呼ばれても1回だけDB問い合わせ）
export const getProviderId = cache(async () => {
  const user = await getCurrentUser();
  if (!user || user.role !== "provider") throw new Error("Not authorized");

  const supabase = await createClient();
  const { data } = await supabase
    .from("providers")
    .select("id, slug")
    .eq("user_id", user.id)
    .single();

  if (!data) throw new Error("Provider not found");
  return data;
});
