import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "../dashboard-client";

export default async function HomePage() {
  const user = await resolveUser();
  if (!user) redirect("/");

  const supabase = await createClient();

  const [providerResult, bookingsResult] = await Promise.all([
    user.role === "provider"
      ? supabase
          .from("providers")
          .select("slug, name, icon_url")
          .eq("user_id", user.id)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from("bookings")
      .select(
        "start_at, providers:provider_id ( name, slug, icon_url ), services:service_id ( name )"
      )
      .eq("customer_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const provider = providerResult.data as {
    slug: string;
    name: string;
    icon_url: string | null;
  } | null;

  const seen = new Set<string>();
  const recentProviders: {
    slug: string;
    name: string;
    icon_url: string | null;
    lastService: string;
    lastDate: string;
  }[] = [];

  for (const b of bookingsResult.data || []) {
    const p = Array.isArray(b.providers) ? b.providers[0] : b.providers;
    const s = Array.isArray(b.services) ? b.services[0] : b.services;
    if (p && !seen.has(p.slug)) {
      seen.add(p.slug);
      recentProviders.push({
        slug: p.slug,
        name: p.name,
        icon_url: p.icon_url || null,
        lastService: s?.name || "",
        lastDate: b.start_at,
      });
      if (recentProviders.length >= 3) break;
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <DashboardClient
        role={user.role}
        provider={provider}
        recentProviders={recentProviders}
      />
    </main>
  );
}
