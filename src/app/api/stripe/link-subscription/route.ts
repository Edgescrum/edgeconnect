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
      .select("id, stripe_customer_id, stripe_subscription_id, trial_ends_at, plan_period_end")
      .eq("user_id", user.id)
      .single();

    if (!provider) {
      return NextResponse.json(
        { error: "事業主情報が見つかりません" },
        { status: 404 }
      );
    }

    // 既に紐づけ済みで、かつ trial/period 情報も揃っている場合のみスキップ
    const isFullyLinked = provider.stripe_customer_id
      && provider.stripe_subscription_id
      && (provider.trial_ends_at || provider.plan_period_end);
    if (isFullyLinked) {
      return NextResponse.json({ success: true, alreadyLinked: true });
    }

    const stripe = getStripe();

    log("stripe/link-subscription", "Starting link process", {
      providerId: provider.id,
      hasSessionId: !!sessionId,
      existingCustomerId: provider.stripe_customer_id,
      existingSubscriptionId: provider.stripe_subscription_id,
      existingTrialEndsAt: provider.trial_ends_at,
      existingPlanPeriodEnd: provider.plan_period_end,
    });

    if (sessionId) {
      // Checkout Session から情報を取得
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      log("stripe/link-subscription", "Session retrieved", {
        sessionId,
        customer: session.customer,
        subscription: session.subscription,
        status: session.status,
      });

      if (session.customer && session.subscription) {
        // トライアルが適用されたかチェック + 期間情報を取得
        let hadTrialInSession = false;
        let trialEnd: number | null = null;
        let currentPeriodEnd: number | undefined;
        try {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          hadTrialInSession = sub.trial_start !== null;
          trialEnd = sub.trial_end;
          currentPeriodEnd = sub.items?.data?.[0]?.current_period_end;

          log("stripe/link-subscription", "Subscription details", {
            subscriptionId: sub.id,
            status: sub.status,
            trialStart: sub.trial_start,
            trialEnd: sub.trial_end,
            currentPeriodEnd,
            itemsCount: sub.items?.data?.length,
          });
        } catch (subErr) {
          logError("stripe/link-subscription", "Failed to retrieve subscription", subErr);
        }

        const updates: Record<string, unknown> = {
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          plan: "standard",
        };
        if (hadTrialInSession) {
          updates.had_trial = true;
        }
        if (trialEnd) {
          updates.trial_ends_at = new Date(trialEnd * 1000).toISOString();
        }
        if (currentPeriodEnd) {
          updates.plan_period_end = new Date(currentPeriodEnd * 1000).toISOString();
        }

        log("stripe/link-subscription", "Updating provider", {
          providerId: provider.id,
          updates,
        });

        const { error: updateError } = await supabase
          .from("providers")
          .update(updates)
          .eq("id", provider.id);

        if (updateError) {
          logError("stripe/link-subscription", "Failed to update provider", updateError);
        }

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
          trialEndsAt: updates.trial_ends_at,
          planPeriodEnd: updates.plan_period_end,
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
        const fallbackUpdates: Record<string, unknown> = {
          stripe_customer_id: customer.id,
          stripe_subscription_id: subscription.id,
          plan: "standard",
        };

        // trial/period 情報も取得
        if (subscription.trial_end) {
          fallbackUpdates.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString();
        }
        if (subscription.trial_start !== null) {
          fallbackUpdates.had_trial = true;
        }
        const fallbackPeriodEnd = subscription.items?.data?.[0]?.current_period_end;
        if (fallbackPeriodEnd) {
          fallbackUpdates.plan_period_end = new Date(fallbackPeriodEnd * 1000).toISOString();
        }

        await supabase
          .from("providers")
          .update(fallbackUpdates)
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
          updates: fallbackUpdates,
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
