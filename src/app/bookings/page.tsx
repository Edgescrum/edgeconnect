import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CustomerBookingList } from "./customer-booking-list";
import { PublicFooter } from "@/components/PublicFooter";
import { LineFriendBanner } from "@/components/LineFriendBanner";

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const user = await resolveUser();
  if (!user) redirect("/");

  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id, start_at, end_at, status, cancelled_by,
      services:service_id ( name, duration_min, price ),
      providers:provider_id ( name, slug )
    `)
    .eq("customer_user_id", user.id)
    .order("start_at", { ascending: true })
    .limit(100);

  const allBookings = (bookings || []).map((b) => {
    const service = Array.isArray(b.services) ? b.services[0] : b.services;
    const provider = Array.isArray(b.providers) ? b.providers[0] : b.providers;
    return {
      id: b.id as string,
      start_at: b.start_at as string,
      end_at: b.end_at as string,
      status: b.status as string,
      cancelled_by: b.cancelled_by as string | null,
      service: service as { name: string; price: number } | null,
      provider: provider as { name: string; slug: string } | null,
    };
  });

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex items-center gap-3 px-4 py-3">
          <Link href="/home" className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-accent-bg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-base font-semibold">予約一覧</h1>
        </div>
      </header>

      <div className="w-full flex-1 px-2 py-4 sm:px-4 sm:py-6">
        <div className="mb-4">
          <LineFriendBanner isLineFriend={user.isLineFriend ?? false} />
        </div>
        <CustomerBookingList bookings={allBookings} />
      </div>

      <PublicFooter />
    </main>
  );
}
