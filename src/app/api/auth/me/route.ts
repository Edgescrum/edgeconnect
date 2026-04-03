import { NextResponse } from "next/server";
import { resolveUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { log } from "@/lib/log";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lineUserId = searchParams.get("lineUserId");

  const user = await resolveUser(lineUserId);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  log("me", "user resolved", { id: user.id, role: user.role });

  const supabase = createAdminClient();

  const [providerResult, bookingsResult] = await Promise.all([
    user.role === "provider"
      ? supabase.from("providers").select("slug, name, icon_url").eq("user_id", user.id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from("bookings")
      .select("start_at, providers:provider_id ( name, slug ), services:service_id ( name )")
      .eq("customer_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const provider = providerResult.data;

  const seen = new Set<string>();
  const recentProviders: { slug: string; name: string; lastService: string; lastDate: string }[] = [];

  for (const b of bookingsResult.data || []) {
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
