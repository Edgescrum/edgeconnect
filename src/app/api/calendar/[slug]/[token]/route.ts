import { createAdminClient } from "@/lib/supabase/admin";
import { generateVCalendar } from "@/lib/calendar/ics";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; token: string }> }
) {
  const { slug, token } = await params;
  // .ics拡張子を除去
  const cleanToken = token.replace(/\.ics$/, "");

  const supabase = createAdminClient();

  // トークン検証 + 事業主取得
  const { data: provider } = await supabase
    .from("providers")
    .select("id, name, calendar_token")
    .eq("slug", slug)
    .single();

  if (!provider || provider.calendar_token !== cleanToken) {
    return new Response("Not found", { status: 404 });
  }

  // 確定済み予約を取得
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, start_at, end_at, customer_name, services:service_id ( name ), users:customer_user_id ( display_name )")
    .eq("provider_id", provider.id)
    .eq("status", "confirmed")
    .gte("start_at", new Date(Date.now() - 30 * 86400000).toISOString()) // 過去30日〜
    .order("start_at", { ascending: true });

  const events = (bookings || []).map((b) => {
    const service = Array.isArray(b.services) ? b.services[0] : b.services;
    const customer = Array.isArray(b.users) ? b.users[0] : b.users;
    const customerName = b.customer_name || customer?.display_name || "お客さま";
    return {
      uid: `${b.id}@peco`,
      summary: `${customerName} - ${service?.name || "予約"}`,
      description: `お客さま: ${customerName}`,
      dtstart: new Date(b.start_at),
      dtend: new Date(b.end_at),
    };
  });

  const ics = generateVCalendar(events);

  // 最終同期日時を更新
  await supabase
    .from("providers")
    .update({ calendar_last_synced_at: new Date().toISOString() })
    .eq("id", provider.id);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
