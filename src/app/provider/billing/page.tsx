import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { STRIPE_PLANS, getStripe } from "@/lib/stripe";
import { BillingClient } from "./billing-client";

interface ProviderBilling {
  id: number;
  plan: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan_period_end: string | null;
  trial_ends_at: string | null;
  had_trial: boolean;
}

export default async function BillingPage() {
  const user = await resolveUser();
  if (!user || user.role !== "provider") redirect("/");

  const supabase = await createClient();
  const { data: provider } = await supabase
    .from("providers")
    .select(
      "id, plan, stripe_customer_id, stripe_subscription_id, plan_period_end, trial_ends_at, had_trial"
    )
    .eq("user_id", user.id)
    .single();

  if (!provider) redirect("/provider/register");

  const p = provider as ProviderBilling;

  const now = new Date();
  const trialEndsAt = p.trial_ends_at ? new Date(p.trial_ends_at) : null;
  const isTrialing = trialEndsAt ? trialEndsAt > now : false;
  const trialDaysLeft =
    isTrialing && trialEndsAt
      ? Math.max(
          0,
          Math.ceil(
            (trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          )
        )
      : 0;

  const planPeriodEnd = p.plan_period_end
    ? new Date(p.plan_period_end)
    : null;

  const currentPlan = STRIPE_PLANS[p.plan as keyof typeof STRIPE_PLANS];
  const planName = currentPlan?.name || p.plan;
  const planPrice = currentPlan?.price || 0;

  // Fetch subscription cancel status from Stripe
  let cancelAtPeriodEnd = false;
  let cancelAt: string | null = null;
  let paymentMethodBrand: string | null = null;
  let paymentMethodLast4: string | null = null;

  if (p.stripe_subscription_id) {
    try {
      const stripe = getStripe();
      const sub = await stripe.subscriptions.retrieve(
        p.stripe_subscription_id,
        { expand: ["default_payment_method"] }
      );
      cancelAtPeriodEnd = sub.cancel_at_period_end;
      if (sub.cancel_at) {
        cancelAt = new Date(sub.cancel_at * 1000).toISOString();
      } else if (cancelAtPeriodEnd && sub.items?.data?.[0]?.current_period_end) {
        cancelAt = new Date(
          sub.items.data[0].current_period_end * 1000
        ).toISOString();
      }

      // Extract payment method info
      const pm = sub.default_payment_method;
      if (pm && typeof pm === "object" && "card" in pm && pm.card) {
        paymentMethodBrand = pm.card.brand || null;
        paymentMethodLast4 = pm.card.last4 || null;
      }
    } catch {
      // If fetch fails, continue without cancel status
    }
  }

  return (
    <BillingClient
      plan={p.plan}
      planName={planName}
      planPrice={planPrice}
      isTrialing={isTrialing}
      trialDaysLeft={trialDaysLeft}
      planPeriodEnd={planPeriodEnd?.toISOString() || null}
      hasSubscription={!!p.stripe_subscription_id}
      hasCustomer={!!p.stripe_customer_id}
      cancelAtPeriodEnd={cancelAtPeriodEnd}
      cancelAt={cancelAt}
      paymentMethodBrand={paymentMethodBrand}
      paymentMethodLast4={paymentMethodLast4}
    />
  );
}
