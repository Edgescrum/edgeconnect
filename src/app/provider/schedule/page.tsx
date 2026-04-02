import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ScheduleEditor } from "./schedule-editor";

export default async function SchedulePage() {
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

  const { data: settings } = await supabase
    .from("provider_settings")
    .select("*")
    .eq("provider_id", provider.id)
    .single();

  const { data: blockedSlots } = await supabase
    .from("blocked_slots")
    .select("*")
    .eq("provider_id", provider.id)
    .order("start_at", { ascending: true });

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold">スケジュール設定</h1>
        <p className="mt-1 text-sm text-muted">
          営業時間やお休みを設定します
        </p>
        <ScheduleEditor
          settings={settings}
          blockedSlots={blockedSlots || []}
        />
        <div className="mt-6">
          <a
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted"
          >
            ← ダッシュボードに戻る
          </a>
        </div>
      </div>
    </main>
  );
}
