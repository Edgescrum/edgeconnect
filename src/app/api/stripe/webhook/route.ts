import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { pushFlexMessage } from "@/lib/line/messaging";
import { log, logError } from "@/lib/log";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    logError("stripe/webhook", "Signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  log("stripe/webhook", "Event received", { type: event.type, id: event.id });

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const providerId = session.metadata?.provider_id;
        const plan = session.metadata?.plan;

        if (providerId && plan) {
          await supabase
            .from("providers")
            .update({
              plan,
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
            })
            .eq("id", Number(providerId));

          log("stripe/webhook", "checkout.session.completed", {
            providerId,
            plan,
            customerId: session.customer,
          });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (customerId) {
          const periodEnd = invoice.lines?.data?.[0]?.period?.end;
          if (periodEnd) {
            await supabase
              .from("providers")
              .update({
                plan_period_end: new Date(periodEnd * 1000).toISOString(),
              })
              .eq("stripe_customer_id", customerId);

            log("stripe/webhook", "invoice.paid", {
              customerId,
              periodEnd: new Date(periodEnd * 1000).toISOString(),
            });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (customerId) {
          // 事業主にLINE通知を送信
          const { data: provider } = await supabase
            .from("providers")
            .select("user_id, name")
            .eq("stripe_customer_id", customerId)
            .single();

          if (provider) {
            const { data: user } = await supabase
              .from("users")
              .select("line_user_id")
              .eq("id", provider.user_id)
              .single();

            if (user?.line_user_id) {
              await pushFlexMessage(
                user.line_user_id,
                "決済失敗のお知らせ",
                {
                  type: "bubble",
                  body: {
                    type: "box",
                    layout: "vertical",
                    spacing: "md",
                    contents: [
                      {
                        type: "text",
                        text: "決済失敗のお知らせ",
                        weight: "bold",
                        size: "lg",
                      },
                      {
                        type: "text",
                        text: "月額料金の決済に失敗しました。お支払い方法をご確認ください。",
                        size: "sm",
                        wrap: true,
                        color: "#666666",
                      },
                    ],
                  },
                }
              );
            }
          }

          logError("stripe/webhook", "invoice.payment_failed", { customerId });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // プラン変更を検出
        const priceId = subscription.items?.data?.[0]?.price?.id;
        let newPlan: string | null = null;

        if (priceId === process.env.STRIPE_BASIC_PRICE_ID) {
          newPlan = "basic";
        } else if (priceId === process.env.STRIPE_STANDARD_PRICE_ID) {
          newPlan = "standard";
        }

        if (customerId && newPlan) {
          const updates: Record<string, unknown> = { plan: newPlan };

          const currentPeriodEnd = subscription.items?.data?.[0]?.current_period_end;
          if (currentPeriodEnd) {
            updates.plan_period_end = new Date(
              currentPeriodEnd * 1000
            ).toISOString();
          }

          if (subscription.trial_end) {
            updates.trial_ends_at = new Date(
              subscription.trial_end * 1000
            ).toISOString();
          }

          await supabase
            .from("providers")
            .update(updates)
            .eq("stripe_customer_id", customerId);

          log("stripe/webhook", "subscription.updated", {
            customerId,
            newPlan,
          });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        if (customerId) {
          await supabase
            .from("providers")
            .update({
              plan: "basic",
              stripe_subscription_id: null,
              plan_period_end: null,
              trial_ends_at: null,
            })
            .eq("stripe_customer_id", customerId);

          log("stripe/webhook", "subscription.deleted", { customerId });
        }
        break;
      }

      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        if (customerId) {
          const { data: provider } = await supabase
            .from("providers")
            .select("user_id, name")
            .eq("stripe_customer_id", customerId)
            .single();

          if (provider) {
            const { data: user } = await supabase
              .from("users")
              .select("line_user_id")
              .eq("id", provider.user_id)
              .single();

            if (user?.line_user_id) {
              const trialEnd = subscription.trial_end
                ? new Date(subscription.trial_end * 1000)
                : null;
              const daysLeft = trialEnd
                ? Math.ceil(
                    (trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  )
                : 3;

              await pushFlexMessage(
                user.line_user_id,
                "トライアル終了のお知らせ",
                {
                  type: "bubble",
                  body: {
                    type: "box",
                    layout: "vertical",
                    spacing: "md",
                    contents: [
                      {
                        type: "text",
                        text: "トライアル終了のお知らせ",
                        weight: "bold",
                        size: "lg",
                      },
                      {
                        type: "text",
                        text: `トライアル期間が${daysLeft}日後に終了します。自動的に980円/月の課金が開始されます。`,
                        size: "sm",
                        wrap: true,
                        color: "#666666",
                      },
                      {
                        type: "text",
                        text: "プランの変更・解約は管理画面から行えます。",
                        size: "xs",
                        wrap: true,
                        color: "#999999",
                        margin: "md",
                      },
                    ],
                  },
                }
              );
            }
          }

          log("stripe/webhook", "trial_will_end", { customerId });
        }
        break;
      }

      default:
        log("stripe/webhook", "Unhandled event type", { type: event.type });
    }
  } catch (error) {
    logError("stripe/webhook", `Error processing ${event.type}`, error);
    // Webhookは200を返さないとStripeがリトライする
    // 処理エラーでも200を返して、ログで追跡する
  }

  return NextResponse.json({ received: true });
}
