import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { log, logError } from "@/lib/log";

/**
 * POST /api/stripe/link-subscription
 *
 * 登録フローで Stripe Checkout 完了後に呼び出し、
 * Checkout Session の customer / subscription を provider に紐づける。
 */
export async function POST(request: NextRequest) {
  try {
    const user = await resolveUser();
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { sessionId } = await request.json().catch(() => ({ sessionId: null }));

    const supabase = await createClient();

    // provider を取得
    const { data: provider } = await supabase
      .from("providers")
      .select("id, stripe_customer_id, stripe_subscription_id")
      .eq("user_id", user.id)
      .single();

    if (!provider) {
      return NextResponse.json(
        { error: "事業主情報が見つかりません" },
        { status: 404 }
      );
    }

    // 既に紐づけ済みの場合はスキップ
    if (provider.stripe_customer_id && provider.stripe_subscription_id) {
      return NextResponse.json({ success: true, alreadyLinked: true });
    }

    const stripe = getStripe();

    if (sessionId) {
      // Checkout Session から情報を取得
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.customer && session.subscription) {
        // トライアルが適用されたかチェック
        let hadTrialInSession = false;
        try {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          hadTrialInSession = sub.trial_start !== null;
        } catch {
          // 取得失敗は無視
        }

        const updates: Record<string, unknown> = {
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          plan: "standard",
        };
        if (hadTrialInSession) {
          updates.had_trial = true;
        }

        await supabase
          .from("providers")
          .update(updates)
          .eq("id", provider.id);

        // Stripe Customer の metadata にも provider_id を追加
        await stripe.customers.update(session.customer as string, {
          metadata: {
            provider_id: String(provider.id),
            user_id: String(user.id),
            line_user_id: user.lineUserId,
          },
        });

        log("stripe/link-subscription", "Linked subscription to provider", {
          providerId: provider.id,
          customerId: session.customer,
          subscriptionId: session.subscription,
        });

        return NextResponse.json({ success: true });
      }
    }

    // sessionId がない場合: Stripe Customer を user_id metadata で検索
    const customers = await stripe.customers.search({
      query: `metadata["user_id"]:"${user.id}"`,
    });

    if (customers.data.length > 0) {
      const customer = customers.data[0];
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: "all",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];
        await supabase
          .from("providers")
          .update({
            stripe_customer_id: customer.id,
            stripe_subscription_id: subscription.id,
            plan: "standard",
          })
          .eq("id", provider.id);

        // Stripe Customer の metadata に provider_id を追加
        await stripe.customers.update(customer.id, {
          metadata: {
            ...customer.metadata,
            provider_id: String(provider.id),
          },
        });

        log("stripe/link-subscription", "Linked via customer search", {
          providerId: provider.id,
          customerId: customer.id,
        });

        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json(
      { error: "Stripe サブスクリプションが見つかりません" },
      { status: 404 }
    );
  } catch (error) {
    logError("stripe/link-subscription", "Failed to link subscription", error);
    return NextResponse.json(
      { error: "サブスクリプションの紐づけに失敗しました" },
      { status: 500 }
    );
  }
}
