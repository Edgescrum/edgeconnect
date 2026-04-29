import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { log, logError } from "@/lib/log";

export async function POST() {
  try {
    const user = await resolveUser();
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const supabase = await createClient();
    const { data: provider } = await supabase
      .from("providers")
      .select("id, stripe_subscription_id")
      .eq("user_id", user.id)
      .single();

    if (!provider) {
      return NextResponse.json(
        { error: "事業主情報が見つかりません" },
        { status: 404 }
      );
    }

    if (!provider.stripe_subscription_id) {
      return NextResponse.json(
        { error: "サブスクリプションが見つかりません" },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // 期間末でキャンセル（即時ではない）
    const updatedSub = await stripe.subscriptions.update(
      provider.stripe_subscription_id,
      { cancel_at_period_end: true }
    );

    // Webhook が到達しない場合に備え、cancel_at を即座に DB へ反映する
    const cancelAt = updatedSub.cancel_at
      ? new Date(updatedSub.cancel_at * 1000).toISOString()
      : updatedSub.items?.data?.[0]?.current_period_end
        ? new Date(updatedSub.items.data[0].current_period_end * 1000).toISOString()
        : null;

    if (cancelAt) {
      const { error: dbErr } = await supabase
        .from("providers")
        .update({ cancel_at: cancelAt })
        .eq("id", provider.id);

      if (dbErr) {
        logError("stripe/cancel", "Failed to update cancel_at in DB", dbErr);
      } else {
        log("stripe/cancel", "cancel_at saved to DB", {
          providerId: provider.id,
          cancelAt,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "現在の請求期間末でプランが解約されます",
    });
  } catch (error) {
    logError("stripe/cancel", "Failed to cancel subscription", error);
    return NextResponse.json(
      { error: "解約に失敗しました" },
      { status: 500 }
    );
  }
}
