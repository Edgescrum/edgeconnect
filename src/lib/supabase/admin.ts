import { createClient } from "@supabase/supabase-js";

// Supabase Auth の admin 操作専用クライアント
// ログインAPI route でのみ使用すること
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
