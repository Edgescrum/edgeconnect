import { createAdminClient } from "@/lib/supabase/admin";
import { generateVCalendar } from "@/lib/calendar/ics";

// Security note: This endpoint is intentionally unauthenticated.
// It is accessed from Flex Message links and calendar apps where auth headers
// are not practical. The booking UUID (v4) is cryptographically random and
// serves as an unguessable capability token. Even if a URL is leaked, only
// a single booking's non-sensitive summary is exposed.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;
  const cleanId = bookingId.replace(/\.ics$/, "");

  const supabase = createAdminClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, start_at, end_at, services:service_id ( name, price ), providers:provider_id ( name )")
    .eq("id", cleanId)
    .single();

  if (!booking) {
    return new Response("Not found", { status: 404 });
  }

  const service = Array.isArray(booking.services) ? booking.services[0] : booking.services;
  const provider = Array.isArray(booking.providers) ? booking.providers[0] : booking.providers;

  const title = `${provider?.name}（${service?.name || "予約"}）`;
  const description = `料金: ¥${(service?.price || 0).toLocaleString()}`;

  const ics = generateVCalendar([
    {
      uid: `${booking.id}@peco`,
      summary: title,
      description,
      dtstart: new Date(booking.start_at),
      dtend: new Date(booking.end_at),
    },
  ]);

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="booking-${cleanId}.ics"`,
    },
  });
}
