import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-04-22.dahlia",
  typescript: true,
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
