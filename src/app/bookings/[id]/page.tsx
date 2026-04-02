import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { CancelButton } from "./cancel-button";
import { generateGoogleCalendarUrl } from "@/lib/calendar/ics";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  const { id } = await params;
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select(`
      id, start_at, end_at, status, cancelled_by, created_at,
      services:service_id ( name, duration_min, price, cancel_deadline_hours, cancel_policy_note ),
      providers:provider_id ( name, slug, line_contact_url, contact_email )
    `)
    .eq("id", id)
    .single();

  if (!booking) notFound();

  const rawService = booking.services;
  const service = (Array.isArray(rawService) ? rawService[0] : rawService) as {
    name: string;
    duration_min: number;
    price: number;
    cancel_deadline_hours: number;
    cancel_policy_note: string | null;
  } | null;
  const rawProvider = booking.providers;
  const provider = (Array.isArray(rawProvider) ? rawProvider[0] : rawProvider) as {
    name: string;
    slug: string;
    line_contact_url: string | null;
    contact_email: string | null;
  } | null;

  const isCancelled = booking.status === "cancelled";
  const startAt = new Date(booking.start_at);
  const now = new Date();
  const deadlineMs = (service?.cancel_deadline_hours || 24) * 60 * 60 * 1000;
  const canCancel = !isCancelled && startAt.getTime() - now.getTime() > deadlineMs;

  const days = ["日", "月", "火", "水", "木", "金", "土"];
  const dateStr = `${startAt.getFullYear()}/${startAt.getMonth() + 1}/${startAt.getDate()}（${days[startAt.getDay()]}）`;
  const timeStr = `${startAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}〜${new Date(booking.end_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
          <a href="/bookings" className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-accent-bg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </a>
          <h1 className="text-base font-semibold">予約詳細</h1>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 py-6">
        {/* Status */}
        <div className="mb-4 flex justify-center">
          {isCancelled ? (
            <span className="rounded-full bg-gray-100 px-4 py-1 text-sm font-medium text-muted">
              キャンセル済み
              {booking.cancelled_by === "provider" && "（事業主によるキャンセル）"}
            </span>
          ) : (
            <span className="rounded-full bg-green-50 px-4 py-1 text-sm font-medium text-green-700">
              確定
            </span>
          )}
        </div>

        {/* Details */}
        <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted">事業主</p>
                <p className="mt-0.5 font-semibold">{provider?.name}</p>
              </div>
              {provider?.slug && (
                <a
                  href={`/p/${provider.slug}`}
                  className="rounded-lg bg-accent-bg px-3 py-1.5 text-xs font-medium text-accent active:opacity-70"
                >
                  予約ページ
                </a>
              )}
            </div>
            <div>
              <p className="text-xs text-muted">メニュー</p>
              <p className="mt-0.5 font-semibold">{service?.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted">日時</p>
              <p className="mt-0.5 font-semibold">{dateStr} {timeStr}</p>
            </div>
            <div className="flex justify-between border-t border-border pt-4">
              <span className="text-sm text-muted">料金</span>
              <span className="text-lg font-bold">
                ¥{(service?.price || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Cancel policy */}
        {!isCancelled && service && (
          <div className="mt-4 rounded-xl bg-accent-bg p-3">
            <p className="text-xs text-accent">
              キャンセル期限: 予約の{service.cancel_deadline_hours}時間前まで
              {service.cancel_policy_note && (
                <span className="block mt-1">{service.cancel_policy_note}</span>
              )}
            </p>
          </div>
        )}

        {/* カレンダー追加 */}
        {!isCancelled && (
          <div className="mt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              カレンダーに追加
            </h3>
            <div className="flex gap-2">
              <a
                href={generateGoogleCalendarUrl(
                  `${provider?.name}（${service?.name}）`,
                  startAt,
                  new Date(booking.end_at),
                  `料金: ¥${(service?.price || 0).toLocaleString()}`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-xl bg-card py-2.5 text-center text-xs font-medium ring-1 ring-border active:scale-[0.98]"
              >
                Google
              </a>
              <a
                href={`/api/calendar/event/${booking.id}.ics`}
                className="flex-1 rounded-xl bg-card py-2.5 text-center text-xs font-medium ring-1 ring-border active:scale-[0.98]"
              >
                Apple
              </a>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 space-y-2.5">
          {canCancel && <CancelButton bookingId={booking.id} />}

          {provider?.line_contact_url && (
            <a
              href={provider.line_contact_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl bg-success py-3.5 font-semibold text-white active:scale-[0.98]"
            >
              事業主にLINEで連絡
            </a>
          )}

          {provider?.contact_email && (
            <a
              href={`mailto:${provider.contact_email}`}
              className="flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl border border-border py-3.5 font-semibold active:scale-[0.98]"
            >
              事業主にメールで連絡
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
