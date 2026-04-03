import { resolveUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ServiceList } from "./service-list";

export default async function ServicesPage() {
  const user = await resolveUser();
  if (!user) redirect("/");
  if (user.role !== "provider") redirect("/");

  const supabase = createAdminClient();
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
          <Link
            href="/provider/services/new"
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 active:scale-[0.98]"
          >
            + 追加
          </Link>
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
            <Link
              href="/provider/services/new"
              className="mt-6 inline-block rounded-xl bg-accent px-6 py-3 font-semibold text-white shadow-lg shadow-accent/25 active:scale-[0.98]"
            >
              最初のメニューを作成
            </Link>
          </div>
        )}

      </div>
    </main>
  );
}
