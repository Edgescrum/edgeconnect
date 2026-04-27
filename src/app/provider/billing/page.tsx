import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { STRIPE_PLANS } from "@/lib/stripe";
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
  const trialDaysLeft = isTrialing && trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const planPeriodEnd = p.plan_period_end ? new Date(p.plan_period_end) : null;

  const currentPlan = STRIPE_PLANS[p.plan as keyof typeof STRIPE_PLANS];
  const planName = currentPlan?.name || p.plan;
  const planPrice = currentPlan?.price || 0;

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
    />
  );
}
