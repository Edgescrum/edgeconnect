import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function BookingsPage() {
  const user = await getCurrentUser();
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
    .order("start_at", { ascending: false });

  const now = new Date();
  const upcoming = (bookings || []).filter(
    (b) => new Date(b.start_at) >= now && b.status === "confirmed"
  );
  const past = (bookings || []).filter(
    (b) => new Date(b.start_at) < now || b.status === "cancelled"
  );

  function formatBookingDate(dateStr: string) {
    const d = new Date(dateStr);
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    return `${d.getMonth() + 1}/${d.getDate()}（${days[d.getDay()]}）`;
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  type RawBooking = NonNullable<typeof bookings>[number];

  interface Booking {
    id: string;
    start_at: string;
    end_at: string;
    status: string;
    cancelled_by: string | null;
    services: { name: string; duration_min: number; price: number } | null;
    providers: { name: string; slug: string } | null;
  }

  function toBooking(raw: RawBooking): Booking {
    return {
      ...raw,
      services: Array.isArray(raw.services) ? raw.services[0] || null : raw.services,
      providers: Array.isArray(raw.providers) ? raw.providers[0] || null : raw.providers,
    } as Booking;
  }

  function BookingCard({ booking }: { booking: Booking }) {
    const service = booking.services;
    const provider = booking.providers;
    const isCancelled = booking.status === "cancelled";

    return (
      <div
        className={`rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border ${
          isCancelled ? "opacity-60" : ""
        }`}
      >
        <a href={`/bookings/${booking.id}`} className="block active:opacity-70">
          <div className="flex items-start justify-between">
            <div>
              <p className="mt-0.5 font-semibold">{service?.name}</p>
              <p className="mt-1 text-sm">
                {formatBookingDate(booking.start_at)} {formatTime(booking.start_at)}〜{formatTime(booking.end_at)}
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
              {service && (
                <p className="mt-1 text-sm font-bold">
                  ¥{service.price.toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </a>
        {provider && (
          <a
            href={`/p/${provider.slug}`}
            className="mt-2 flex items-center gap-1.5 border-t border-border pt-2 text-xs text-accent active:opacity-70"
          >
            <span>{provider.name}</span>
            <span>→ 予約ページ</span>
          </a>
        )}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <a href="/" className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-accent-bg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </a>
          <h1 className="text-base font-semibold">予約一覧</h1>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-6">
        {bookings && bookings.length === 0 ? (
          <div className="flex flex-col items-center pt-12 text-center">
            <div className="text-5xl">📅</div>
            <p className="mt-4 font-semibold">予約はまだありません</p>
            <p className="mt-1 text-sm text-muted">
              事業主のページからサービスを予約してみましょう
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {upcoming.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  予定の予約
                </h2>
                <div className="space-y-2">
                  {upcoming.map((b) => (
                    <BookingCard key={b.id} booking={toBooking(b)} />
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
                  過去の予約
                </h2>
                <div className="space-y-2">
                  {past.map((b) => (
                    <BookingCard key={b.id} booking={toBooking(b)} />
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
