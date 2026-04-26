import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/log";

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
    await stripe.subscriptions.update(provider.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

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
