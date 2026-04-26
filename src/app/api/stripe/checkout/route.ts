import { NextRequest, NextResponse } from "next/server";
import { getStripe, STRIPE_PLANS } from "@/lib/stripe";
import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { logError, log } from "@/lib/log";

export async function POST(request: NextRequest) {
  try {
    const user = await resolveUser();
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // body から context を読む（register: 登録フロー, billing: プラン変更）
    const body = await request.json().catch(() => ({}));
    const context = body.context || "billing";

    const supabase = await createClient();
    const stripe = getStripe();
    const planConfig = STRIPE_PLANS.standard;
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";

    // 事業主情報を取得（存在しない場合もある＝登録フロー）
    const { data: provider } = await supabase
      .from("providers")
      .select("id, name, stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (context === "register") {
      // 登録フロー: provider が未作成でも Checkout セッションを作成できる
      let customerId: string | undefined;

      if (provider?.stripe_customer_id) {
        customerId = provider.stripe_customer_id;
      } else {
        // Stripe Customer を先に作成（user_id ベース）
        const customer = await stripe.customers.create({
          metadata: {
            user_id: String(user.id),
            line_user_id: user.lineUserId,
            ...(provider ? { provider_id: String(provider.id) } : {}),
          },
          name: body.providerName || user.displayName || undefined,
        });
        customerId = customer.id;

        // provider が既に存在する場合は stripe_customer_id を保存
        if (provider) {
          await supabase
            .from("providers")
            .update({ stripe_customer_id: customerId })
            .eq("id", provider.id);
        }
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: planConfig.priceId, quantity: 1 }],
        success_url: `${origin}/provider/register?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/provider/register?checkout=cancelled`,
        metadata: {
          user_id: String(user.id),
          ...(provider ? { provider_id: String(provider.id) } : {}),
          plan: "standard",
          context: "register",
        },
        subscription_data: {
          trial_period_days: planConfig.trialDays,
        },
      });

      log("stripe/checkout", "Registration checkout session created", {
        userId: user.id,
        sessionId: session.id,
      });

      return NextResponse.json({ url: session.url });
    }

    // billing フロー: provider が必須
    if (!provider) {
      return NextResponse.json(
        { error: "事業主情報が見つかりません" },
        { status: 404 }
      );
    }

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

      await supabase
        .from("providers")
        .update({ stripe_customer_id: customerId })
        .eq("id", provider.id);
    }

    // Checkout Session を作成（スタンダードプラン固定・トライアル30日）
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      success_url: `${origin}/provider/billing?checkout=success`,
      cancel_url: `${origin}/provider/billing`,
      metadata: {
        provider_id: String(provider.id),
        plan: "standard",
        context: "billing",
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
