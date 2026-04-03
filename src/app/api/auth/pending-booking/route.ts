import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { log, logError } from "@/lib/log";

export async function POST(request: Request) {
  try {
    const { lineUserId, returnUrl } = await request.json();

    if (!lineUserId || !returnUrl) {
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    }

    log("pending-booking", "save", { lineUserId, returnUrl });

    const supabase = createAdminClient();
    await supabase
      .from("pending_bookings")
      .upsert({
        line_user_id: lineUserId,
        return_url: returnUrl,
        created_at: new Date().toISOString(),
      });

    return NextResponse.json({ status: "ok" });
  } catch (e) {
    logError("pending-booking", "save failed", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
