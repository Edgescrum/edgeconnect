import { resolveUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireActiveSubscription } from "@/lib/auth/provider-session";
import { getTemplateQuestions, getProviderSurveySettings } from "@/lib/actions/survey-settings";
import { SurveySettingsClient } from "./survey-settings-client";

export default async function SurveySettingsPage() {
  const user = await resolveUser();
  if (!user) redirect("/");
  if (user.role !== "provider") redirect("/");

  await requireActiveSubscription(user.id);

  const supabase = await createClient();
  const { data: provider } = await supabase
    .from("providers")
    .select("id, plan, category")
    .eq("user_id", user.id)
    .single();

  if (!provider) redirect("/provider/register");

  // ベーシックプランはアクセス不可
  if (provider.plan === "basic") {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-lg sm:max-w-none">
          <div className="hidden sm:mb-6 sm:block">
            <h1 className="text-xl font-bold">アンケート設問管理</h1>
          </div>
          <div className="mt-8 rounded-2xl bg-card p-8 text-center ring-1 ring-border">
            <p className="text-4xl">&#x1F4CB;</p>
            <h2 className="mt-4 text-lg font-bold">アンケート設問管理はスタンダードプランの機能です</h2>
            <p className="mt-2 text-sm text-muted">
              業界に合ったテンプレート設問を選択・カスタマイズできます
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

  const category = provider.category || "other";
  const templateQuestions = await getTemplateQuestions(category);
  const currentSettings = await getProviderSurveySettings();

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-lg sm:max-w-2xl">
        <div className="hidden sm:mb-6 sm:block">
          <h1 className="text-xl font-bold">アンケート設問管理</h1>
          <p className="mt-1 text-sm text-muted">
            お客さまに聞きたい追加設問を選択・カスタマイズできます（最大3つ）
          </p>
        </div>
        <SurveySettingsClient
          templateQuestions={templateQuestions}
          currentSettings={currentSettings}
          category={category}
        />
      </div>
    </main>
  );
}
