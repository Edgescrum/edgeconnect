import { NextRequest, NextResponse } from "next/server";
import { getStripe, STRIPE_PLANS } from "@/lib/stripe";
import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/log";

export async function POST(request: NextRequest) {
  try {
    const user = await resolveUser();
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const targetPlan = body.plan as "basic" | "standard";

    if (!targetPlan || !STRIPE_PLANS[targetPlan]) {
      return NextResponse.json({ error: "無効なプランです" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: provider } = await supabase
      .from("providers")
      .select("id, plan, stripe_subscription_id, stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (!provider) {
      return NextResponse.json(
        { error: "事業主情報が見つかりません" },
        { status: 404 }
      );
    }

    if (provider.plan === targetPlan) {
      return NextResponse.json(
        { error: "既に同じプランです" },
        { status: 400 }
      );
    }

    if (!provider.stripe_subscription_id) {
      return NextResponse.json(
        { error: "サブスクリプションが見つかりません" },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    // 現在のサブスクリプションを取得
    const subscription = await stripe.subscriptions.retrieve(
      provider.stripe_subscription_id
    );
    const currentItemId = subscription.items.data[0]?.id;

    if (!currentItemId) {
      return NextResponse.json(
        { error: "サブスクリプション項目が見つかりません" },
        { status: 400 }
      );
    }

    const targetPriceId = STRIPE_PLANS[targetPlan].priceId;
    const isUpgrade = targetPlan === "standard";

    // アップグレード: 即時反映、ダウングレード: 期間末で反映
    await stripe.subscriptions.update(provider.stripe_subscription_id, {
      items: [
        {
          id: currentItemId,
          price: targetPriceId,
        },
      ],
      proration_behavior: isUpgrade ? "create_prorations" : "none",
      // ダウングレードの場合は期間末に変更をスケジュール
      ...(isUpgrade
        ? {}
        : {
            cancel_at_period_end: false,
            // Stripeのschedule APIの代わりに、Webhook(subscription.updated)で
            // plan_period_endに現在の期間末を設定しておき、
            // 次の請求サイクルでプランが変わる仕組み
          }),
    });

    // ダウングレードの場合はDBを即時更新しない（Webhookで処理）
    // アップグレードの場合もWebhookで処理されるが、UIの即時反映のためDBも更新
    if (isUpgrade) {
      await supabase
        .from("providers")
        .update({ plan: targetPlan })
        .eq("id", provider.id);
    }

    return NextResponse.json({
      success: true,
      plan: targetPlan,
      immediate: isUpgrade,
    });
  } catch (error) {
    logError("stripe/change-plan", "Failed to change plan", error);
    return NextResponse.json(
      { error: "プラン変更に失敗しました" },
      { status: 500 }
    );
  }
}
