import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { requireActiveSubscription } from "@/lib/auth/provider-session";
import { CustomersClient } from "./customers-client";

export default async function CustomersPage() {
  const user = await resolveUser();
  if (!user) redirect("/");
  if (user.role !== "provider") redirect("/");

  await requireActiveSubscription(user.id);

  const supabase = await createClient();

  const { data: provider } = await supabase
    .from("providers")
    .select("id, plan")
    .eq("user_id", user.id)
    .single();

  if (!provider) redirect("/provider/register");

  // プランチェック
  if (provider.plan === "basic") {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-lg sm:max-w-none">
          <div className="hidden sm:mb-6 sm:block">
            <h1 className="text-xl font-bold">顧客管理</h1>
          </div>
          <div className="mt-8 rounded-2xl bg-card p-8 text-center ring-1 ring-border">
            <p className="text-4xl">&#x1F465;</p>
            <h2 className="mt-4 text-lg font-bold">顧客管理はスタンダードプランの機能です</h2>
            <p className="mt-2 text-sm text-muted">
              お客さまの来店履歴やメモを管理できます
            </p>
            <a
              href="/provider/billing"
              className="mt-4 inline-block rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white"
            >
              プランをアップグレード
            </a>
          </div>
        </div>
      </main>
    );
  }

  // 初期データを取得
  const { data: customers } = await supabase.rpc("get_customers", {
    p_provider_id: provider.id,
    p_query: null,
    p_filter: "all",
  });

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-lg sm:max-w-none">
        <div className="hidden sm:mb-6 sm:block">
          <h1 className="text-xl font-bold">顧客管理</h1>
          <p className="mt-1 text-sm text-muted">お客さまの来店状況を管理できます</p>
        </div>
        <CustomersClient initialCustomers={customers || []} />
      </div>
    </main>
  );
}
