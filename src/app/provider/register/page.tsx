import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { RegisterWizard } from "./register-wizard";

export default async function RegisterPage() {
  const user = await resolveUser();
  if (!user) redirect("/");

  // 事業主登録済みならダッシュボードへ
  const supabase = await createClient();
  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (provider) redirect("/provider");

  return <RegisterWizard />;
}
