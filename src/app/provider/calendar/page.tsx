import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CalendarSettings } from "./calendar-settings";

export default async function CalendarPage() {
  const user = await resolveUser();
  if (!user) redirect("/");
  if (user.role !== "provider") redirect("/");

  const supabase = await createClient();
  const { data: provider } = await supabase
    .from("providers")
    .select("slug, calendar_token, calendar_last_synced_at")
    .eq("user_id", user.id)
    .single();

  if (!provider) redirect("/provider/register");

  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "https://edgeconnect.vercel.app";

  const icalUrl = `${baseUrl}/api/calendar/${provider.slug}/${provider.calendar_token}.ics`;
  const webcalUrl = icalUrl.replace("https://", "webcal://");

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-lg">
        <p className="text-sm text-muted">
          カレンダーアプリと連携して予約を自動同期します
        </p>
        <CalendarSettings
          icalUrl={icalUrl}
          webcalUrl={webcalUrl}
          lastSyncedAt={provider.calendar_last_synced_at}
        />
      </div>
    </main>
  );
}
