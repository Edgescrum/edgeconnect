import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BookingList } from "./booking-list";

export default async function ProviderBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const user = await resolveUser();
  if (!user) redirect("/");
  if (user.role !== "provider") redirect("/");

  const { filter } = await searchParams;

  const supabase = await createClient();
  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!provider) redirect("/provider/register");

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id, start_at, end_at, status, cancelled_by, created_at, customer_name,
      services:service_id ( name, duration_min, price ),
      users:customer_user_id ( display_name )
    `)
    .eq("provider_id", provider.id)
    .order("start_at", { ascending: true })
    .limit(100);

  const allBookings = (bookings || []).map((b) => {
    const service = Array.isArray(b.services) ? b.services[0] : b.services;
    const customer = Array.isArray(b.users) ? b.users[0] : b.users;
    return {
      id: b.id as string,
      start_at: b.start_at as string,
      end_at: b.end_at as string,
      status: b.status as string,
      cancelled_by: b.cancelled_by as string | null,
      customer_name: b.customer_name as string | null,
      service: service as { name: string; price: number } | null,
      customer: customer as { display_name: string | null } | null,
    };
  });

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-lg">
        <BookingList bookings={allBookings} initialFilter={filter || "all"} />
      </div>
    </main>
  );
}
