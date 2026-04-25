import Stripe from "stripe";

function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(key, {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  });
}

// Lazy initialization to avoid build-time errors
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = getStripeClient();
  }
  return _stripe;
}

// Default export for convenience (lazy)
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const STRIPE_PLANS = {
  basic: {
    name: "ベーシック",
    priceId: process.env.STRIPE_BASIC_PRICE_ID!,
    price: 500,
    description: "基本的な予約管理機能",
  },
  standard: {
    name: "スタンダード",
    priceId: process.env.STRIPE_STANDARD_PRICE_ID!,
    price: 980,
    description: "顧客管理・分析・アンケート",
    trialDays: 30,
  },
} as const;

export type PlanType = "basic" | "standard" | "team";
