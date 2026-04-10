import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ScheduleEditor } from "./schedule-editor";

export default async function SchedulePage() {
  const user = await resolveUser();
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
    .gte("end_at", new Date().toISOString())
    .order("start_at", { ascending: true });

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-lg">
        <p className="text-sm text-muted">
          営業時間やお休みを設定します
        </p>
        <ScheduleEditor
          settings={settings}
          blockedSlots={blockedSlots || []}
        />
      </div>
    </main>
  );
}
