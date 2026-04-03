import { resolveUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { ProviderCancelButton } from "./provider-cancel-button";

export default async function ProviderBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await resolveUser();
  if (!user) redirect("/");
  if (user.role !== "provider") redirect("/");

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: provider } = await supabase
    .from("providers")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!provider) redirect("/provider/register");

  const { data: booking } = await supabase
    .from("bookings")
    .select(`
      id, start_at, end_at, status, cancelled_by, created_at, customer_name,
      services:service_id ( name, duration_min, price ),
      users:customer_user_id ( display_name, line_user_id )
    `)
    .eq("id", id)
    .eq("provider_id", provider.id)
    .single();

  if (!booking) notFound();

  const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;
  const customer = Array.isArray(booking.users) ? booking.users[0] : booking.users;

  const isCancelled = booking.status === "cancelled";
  const startAt = new Date(booking.start_at);
  const endAt = new Date(booking.end_at);
  const createdAt = new Date(booking.created_at);
  const days = ["日", "月", "火", "水", "木", "金", "土"];

  const dateStr = `${startAt.getFullYear()}/${startAt.getMonth() + 1}/${startAt.getDate()}（${days[startAt.getDay()]}）`;
  const timeStr = `${startAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}〜${endAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`;
  const createdStr = `${createdAt.getMonth() + 1}/${createdAt.getDate()} ${createdAt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-lg">
        {/* Status */}
        <div className="mb-4 flex justify-center">
          {isCancelled ? (
            <span className="rounded-full bg-gray-100 px-4 py-1 text-sm font-medium text-muted">
              キャンセル済み
              {booking.cancelled_by === "customer" && "（お客さまによるキャンセル）"}
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
            <div>
              <p className="text-xs text-muted">お客さま</p>
              <p className="mt-0.5 font-semibold">
                {booking.customer_name || customer?.display_name || "お客さま"}
              </p>
              {booking.customer_name && customer?.display_name && (
                <p className="text-xs text-muted">
                  LINE: {customer.display_name}
                </p>
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
            <div className="border-t border-border pt-3">
              <p className="text-xs text-muted">予約日時: {createdStr}</p>
            </div>
          </div>
        </div>

        {/* Cancel */}
        {!isCancelled && (
          <div className="mt-6">
            <ProviderCancelButton bookingId={booking.id} />
          </div>
        )}
      </div>
    </main>
  );
}
