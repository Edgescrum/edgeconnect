import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ServiceList } from "./service-list";

export default async function ServicesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "provider") redirect("/");

  const supabase = await createClient();
  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!provider) redirect("/provider/register");

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("provider_id", provider.id)
    .order("id", { ascending: true });

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">
            {services?.length || 0}件のメニュー
          </p>
          <a
            href="/provider/services/new"
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 active:scale-[0.98]"
          >
            + 追加
          </a>
        </div>

        {services && services.length > 0 ? (
          <ServiceList services={services} />
        ) : (
          <div className="mt-12 text-center">
            <p className="text-4xl">📋</p>
            <p className="mt-4 font-semibold">メニューがまだありません</p>
            <p className="mt-1 text-sm text-muted">
              サービスメニューを追加して予約を受け付けましょう
            </p>
            <a
              href="/provider/services/new"
              className="mt-6 inline-block rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-lg shadow-accent/25 active:scale-[0.98]"
            >
              最初のメニューを作成
            </a>
          </div>
        )}

      </div>
    </main>
  );
}
