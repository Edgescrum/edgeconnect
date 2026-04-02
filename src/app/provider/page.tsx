import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProviderDashboard } from "./dashboard-content";

export default async function ProviderPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "provider") redirect("/provider/register");

  const supabase = await createClient();
  const { data: provider } = await supabase
    .from("providers")
    .select("slug, name, icon_url")
    .eq("user_id", user.id)
    .single();

  if (!provider) redirect("/provider/register");

  return <ProviderDashboard provider={provider} />;
}
