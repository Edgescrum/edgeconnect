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

    // Stripe 設定の検証
    if (!process.env.STRIPE_SECRET_KEY) {
      logError("stripe/checkout", "STRIPE_SECRET_KEY is not configured");
      return NextResponse.json(
        { error: "決済サービスが設定されていません。管理者にお問い合わせください。" },
        { status: 503 }
      );
    }

    const planConfig = STRIPE_PLANS.standard;
    if (!planConfig.priceId) {
      logError("stripe/checkout", "STRIPE_STANDARD_PRICE_ID is not configured");
      return NextResponse.json(
        { error: "決済プランが設定されていません。管理者にお問い合わせください。" },
        { status: 503 }
      );
    }

    const stripe = getStripe();
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";

    // 事業主情報を取得（存在しない場合もある＝登録フロー）
    const { data: provider } = await supabase
      .from("providers")
      .select("id, name, stripe_customer_id, had_trial")
      .eq("user_id", user.id)
      .single();

    // トライアル重複防止: 過去にトライアルを利用した場合はトライアルを適用しない
    const hadTrial = provider?.had_trial === true;
    // Stripe Customer でも過去のトライアル利用を確認
    let hadTrialOnStripe = false;

    if (context === "register") {
      // 登録フロー: provider が未作成でも Checkout セッションを作成できる
      let customerId: string | undefined;
      const customerEmail = body.email || undefined;

      if (provider?.stripe_customer_id) {
        customerId = provider.stripe_customer_id;
        // Stripe 側でも過去トライアルを確認
        try {
          const subs = await stripe.subscriptions.list({
            customer: customerId,
            status: "all",
            limit: 10,
          });
          hadTrialOnStripe = subs.data.some(
            (sub) => sub.trial_start !== null
          );
        } catch {
          // 確認失敗は無視（DB 側の had_trial で判定）
        }
      } else {
        // Stripe Customer を先に作成（user_id ベース）
        const customer = await stripe.customers.create({
          metadata: {
            user_id: String(user.id),
            line_user_id: user.lineUserId,
            ...(provider ? { provider_id: String(provider.id) } : {}),
          },
          name: body.providerName || user.displayName || undefined,
          email: customerEmail,
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

      const shouldApplyTrial = !hadTrial && !hadTrialOnStripe;

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
        ...(shouldApplyTrial
          ? {
              subscription_data: {
                trial_period_days: planConfig.trialDays,
              },
            }
          : {}),
      });

      log("stripe/checkout", "Registration checkout session created", {
        userId: user.id,
        sessionId: session.id,
        trialApplied: shouldApplyTrial,
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

    // Stripe 側でも過去トライアルを確認
    if (!hadTrialOnStripe && customerId) {
      try {
        const subs = await stripe.subscriptions.list({
          customer: customerId,
          status: "all",
          limit: 10,
        });
        hadTrialOnStripe = subs.data.some(
          (sub) => sub.trial_start !== null
        );
      } catch {
        // 確認失敗は無視
      }
    }
    const shouldApplyTrialBilling = !hadTrial && !hadTrialOnStripe;

    // Checkout Session を作成（スタンダードプラン固定・トライアルは初回のみ）
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
      ...(shouldApplyTrialBilling
        ? {
            subscription_data: {
              trial_period_days: planConfig.trialDays,
            },
          }
        : {}),
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
