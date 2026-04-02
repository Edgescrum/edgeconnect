import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const supabase = await createClient();

  let provider = null;
  if (user.role === "provider") {
    const { data } = await supabase
      .from("providers")
      .select("slug, name, icon_url")
      .eq("user_id", user.id)
      .single();
    provider = data;
  }

  // 最近予約した事業主を取得（重複排除、直近3件）
  const { data: recentBookings } = await supabase
    .from("bookings")
    .select("start_at, providers:provider_id ( name, slug ), services:service_id ( name )")
    .eq("customer_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const seen = new Set<string>();
  const recentProviders: { slug: string; name: string; lastService: string; lastDate: string }[] = [];

  for (const b of recentBookings || []) {
    const p = Array.isArray(b.providers) ? b.providers[0] : b.providers;
    const s = Array.isArray(b.services) ? b.services[0] : b.services;
    if (p && !seen.has(p.slug)) {
      seen.add(p.slug);
      recentProviders.push({
        slug: p.slug,
        name: p.name,
        lastService: s?.name || "",
        lastDate: b.start_at,
      });
      if (recentProviders.length >= 3) break;
    }
  }

  return NextResponse.json({
    user: {
      id: user.id,
      displayName: user.displayName,
      role: user.role,
    },
    provider,
    recentProviders,
  });
}
