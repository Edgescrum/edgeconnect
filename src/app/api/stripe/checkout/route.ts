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

    // plan パラメータは廃止 - スタンダードプラン固定
    // 後方互換性のためbodyは読むが、planは無視する
    await request.json().catch(() => ({}));

    // 事業主情報を取得
    const supabase = await createClient();
    const { data: provider } = await supabase
      .from("providers")
      .select("id, name, stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (!provider) {
      return NextResponse.json(
        { error: "事業主情報が見つかりません" },
        { status: 404 }
      );
    }

    const stripe = getStripe();

    // Stripe Customerを作成（既存の場合は再利用）
    let customerId = provider.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: {
          provider_id: String(provider.id),
          user_id: String(user.id),
          line_user_id: user.lineUserId,
        },
        name: provider.name,
      });
      customerId = customer.id;

      // stripe_customer_idを保存
      await supabase
        .from("providers")
        .update({ stripe_customer_id: customerId })
        .eq("id", provider.id);
    }

    const planConfig = STRIPE_PLANS.standard;
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";

    // Checkout Session を作成（スタンダードプラン固定・トライアル30日）
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price: planConfig.priceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/provider/register?checkout=success`,
      cancel_url: `${origin}/provider/register`,
      metadata: {
        provider_id: String(provider.id),
        plan: "standard",
      },
      subscription_data: {
        trial_period_days: planConfig.trialDays,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logError("stripe/checkout", "Failed to create checkout session", error);
    return NextResponse.json(
      { error: "決済セッションの作成に失敗しました" },
      { status: 500 }
    );
  }
}
