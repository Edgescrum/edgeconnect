import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ProviderBookingsPage() {
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

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      id, start_at, end_at, status, cancelled_by, created_at, customer_name,
      services:service_id ( name, duration_min, price ),
      users:customer_user_id ( display_name )
    `)
    .eq("provider_id", provider.id)
    .order("start_at", { ascending: true });

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const allBookings = (bookings || []).map((b) => {
    const service = Array.isArray(b.services) ? b.services[0] : b.services;
    const customer = Array.isArray(b.users) ? b.users[0] : b.users;
    return { ...b, service, customer };
  });

  const todayBookings = allBookings.filter(
    (b) =>
      b.status === "confirmed" &&
      new Date(b.start_at) >= today &&
      new Date(b.start_at) < new Date(today.getTime() + 86400000)
  );

  const weekBookings = allBookings.filter(
    (b) =>
      b.status === "confirmed" &&
      new Date(b.start_at) >= today &&
      new Date(b.start_at) < weekEnd
  );

  const upcomingConfirmed = allBookings.filter(
    (b) => b.status === "confirmed" && new Date(b.start_at) >= now
  );

  const pastOrCancelled = allBookings.filter(
    (b) => new Date(b.start_at) < now || b.status === "cancelled"
  ).reverse();

  const days = ["日", "月", "火", "水", "木", "金", "土"];

  function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}（${days[d.getDay()]}）`;
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  interface BookingItem {
    id: string;
    start_at: string;
    end_at: string;
    status: string;
    cancelled_by: string | null;
    customer_name: string | null;
    service: { name: string; price: number } | null;
    customer: { display_name: string | null } | null;
  }

  function BookingCard({ booking }: { booking: BookingItem }) {
    const isCancelled = booking.status === "cancelled";
    return (
      <a
        href={`/provider/bookings/${booking.id}`}
        className={`block rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border active:scale-[0.99] ${
          isCancelled ? "opacity-60" : ""
        }`}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted">
              {booking.customer_name || booking.customer?.display_name || "お客さま"}
            </p>
            <p className="mt-0.5 font-semibold">
              {booking.service?.name}
            </p>
            <p className="mt-1 text-sm">
              {formatDate(booking.start_at)} {formatTime(booking.start_at)}〜
              {formatTime(booking.end_at)}
            </p>
          </div>
          <div className="text-right">
            {isCancelled ? (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-muted">
                キャンセル
              </span>
            ) : (
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                確定
              </span>
            )}
            {booking.service && (
              <p className="mt-1 text-sm font-bold">
                ¥{booking.service.price.toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </a>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-lg">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
            <p className="text-2xl font-bold">{todayBookings.length}</p>
            <p className="text-xs text-muted">今日の予約</p>
          </div>
          <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
            <p className="text-2xl font-bold">{weekBookings.length}</p>
            <p className="text-xs text-muted">今週の予約</p>
          </div>
        </div>

        {allBookings.length === 0 ? (
          <div className="mt-12 flex flex-col items-center text-center">
            <div className="text-5xl">📋</div>
            <p className="mt-4 font-semibold">予約はまだありません</p>
            <p className="mt-1 text-sm text-muted">
              お客さまが予約するとここに表示されます
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {upcomingConfirmed.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  予定の予約
                </h2>
                <div className="space-y-2">
                  {upcomingConfirmed.map((b) => (
                    <BookingCard key={b.id} booking={b as BookingItem} />
                  ))}
                </div>
              </section>
            )}

            {pastOrCancelled.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  過去・キャンセル
                </h2>
                <div className="space-y-2">
                  {pastOrCancelled.map((b) => (
                    <BookingCard key={b.id} booking={b as BookingItem} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
