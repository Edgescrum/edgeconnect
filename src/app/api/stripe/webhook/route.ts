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
          // 現在のプランを取得してダウングレード/アップグレードを判定
          const { data: currentProvider } = await supabase
            .from("providers")
            .select("plan")
            .eq("stripe_customer_id", customerId)
            .single();

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

          // ダウングレード時: downgraded_at を記録
          if (currentProvider?.plan === "standard" && newPlan === "basic") {
            updates.downgraded_at = new Date().toISOString();
          }
          // アップグレード時: downgraded_at をクリア（3ヶ月以内のデータ復活）
          if (currentProvider?.plan === "basic" && newPlan === "standard") {
            updates.downgraded_at = null;
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
          // stripe_customer_id は残す（再サブスクライブ時に Customer を再利用するため）
          // stripe_subscription_id のみクリアする
          await supabase
            .from("providers")
            .update({
              plan: "basic",
              stripe_subscription_id: null,
              plan_period_end: null,
              trial_ends_at: null,
              downgraded_at: new Date().toISOString(),
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

              const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://peco.edgescrum.com";
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
                        text: `トライアル期間が${daysLeft}日後に終了します。`,
                        size: "sm",
                        wrap: true,
                        color: "#666666",
                      },
                      {
                        type: "separator",
                        margin: "lg",
                      },
                      {
                        type: "text",
                        text: "トライアル終了後:",
                        weight: "bold",
                        size: "sm",
                        margin: "lg",
                      },
                      {
                        type: "box",
                        layout: "vertical",
                        spacing: "sm",
                        margin: "sm",
                        contents: [
                          {
                            type: "text",
                            text: "・そのまま → スタンダード継続（980円/月）",
                            size: "xs",
                            wrap: true,
                            color: "#666666",
                          },
                          {
                            type: "text",
                            text: "・ダウングレード → ベーシック（500円/月）",
                            size: "xs",
                            wrap: true,
                            color: "#666666",
                          },
                          {
                            type: "text",
                            text: "・解約 → 全機能停止",
                            size: "xs",
                            wrap: true,
                            color: "#666666",
                          },
                        ],
                      },
                      {
                        type: "text",
                        text: "プランの変更・解約は下のボタンから行えます。",
                        size: "xs",
                        wrap: true,
                        color: "#999999",
                        margin: "lg",
                      },
                    ],
                  },
                  footer: {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    contents: [
                      {
                        type: "button",
                        action: {
                          type: "uri",
                          label: "プランを確認・変更する",
                          uri: `${appUrl}/provider/billing`,
                        },
                        style: "primary",
                        color: "#6366F1",
                      },
                      {
                        type: "button",
                        action: {
                          type: "uri",
                          label: "このまま継続する",
                          uri: `${appUrl}/provider`,
                        },
                        style: "secondary",
                      },
                    ],
                  },
                  footer: {
                    type: "box",
                    layout: "vertical",
                    spacing: "sm",
                    contents: [
                      {
                        type: "button",
                        action: {
                          type: "uri",
                          label: "プラン管理を開く",
                          uri: `${appUrl}/provider/billing`,
                        },
                        style: "primary",
                        color: "#6366F1",
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
