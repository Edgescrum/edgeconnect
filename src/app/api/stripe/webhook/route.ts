import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
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
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan;
        const context = session.metadata?.context;

        // subscription 情報を1回だけ取得して使い回す
        let subData: {
          hadTrial: boolean;
          trialEnd: number | null;
          periodEnd: number | undefined;
        } = { hadTrial: false, trialEnd: null, periodEnd: undefined };

        if (session.subscription) {
          try {
            const stripe = getStripe();
            const sub = await stripe.subscriptions.retrieve(
              session.subscription as string
            );
            subData = {
              hadTrial: sub.trial_start !== null,
              trialEnd: sub.trial_end,
              periodEnd: sub.items?.data?.[0]?.current_period_end,
            };
            log("stripe/webhook", "checkout.session.completed - subscription details", {
              subscriptionId: sub.id,
              status: sub.status,
              trialStart: sub.trial_start,
              trialEnd: sub.trial_end,
              periodEnd: subData.periodEnd,
              itemsCount: sub.items?.data?.length,
            });
          } catch (subErr) {
            logError("stripe/webhook", "checkout.session.completed - failed to retrieve subscription", subErr);
          }
        }

        // 共通の更新データを構築するヘルパー
        const buildUpdates = (): Record<string, unknown> => {
          const updates: Record<string, unknown> = {
            plan,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          };
          if (subData.hadTrial) {
            updates.had_trial = true;
          }
          if (subData.trialEnd) {
            updates.trial_ends_at = new Date(subData.trialEnd * 1000).toISOString();
          }
          if (subData.periodEnd) {
            updates.plan_period_end = new Date(subData.periodEnd * 1000).toISOString();
          }
          return updates;
        };

        if (providerId && plan) {
          // provider_id が分かっている場合は直接更新
          const updates = buildUpdates();

          const { error: updateErr } = await supabase
            .from("providers")
            .update(updates)
            .eq("id", Number(providerId));

          if (updateErr) {
            logError("stripe/webhook", "checkout.session.completed - failed to update provider", updateErr);
          }

          log("stripe/webhook", "checkout.session.completed", {
            providerId,
            plan,
            customerId: session.customer,
            trialEndsAt: updates.trial_ends_at,
            planPeriodEnd: updates.plan_period_end,
          });
        } else if (context === "register" && userId && plan) {
          // 登録フロー: provider がまだ作成されていない可能性がある
          // user_id から provider を探す（既に作成済みの場合のみ更新）
          // リトライ: provider 作成のタイミングと競合する可能性があるため最大2回試行
          let provider: { id: number } | null = null;
          for (let attempt = 0; attempt < 2; attempt++) {
            const { data } = await supabase
              .from("providers")
              .select("id")
              .eq("user_id", Number(userId))
              .single();
            if (data) {
              provider = data;
              break;
            }
            if (attempt === 0) {
              // 1秒待ってリトライ（provider 作成を待つ）
              await new Promise(r => setTimeout(r, 1000));
            }
          }

          if (provider) {
            const updates = buildUpdates();

            const { error: updateErr } = await supabase
              .from("providers")
              .update(updates)
              .eq("id", provider.id);

            if (updateErr) {
              logError("stripe/webhook", "checkout.session.completed (register) - failed to update", updateErr);
            }

            log("stripe/webhook", "checkout.session.completed (register)", {
              providerId: provider.id,
              userId,
              plan,
              trialEndsAt: updates.trial_ends_at,
              planPeriodEnd: updates.plan_period_end,
            });
          } else {
            // provider がまだ作成されていない場合はログだけ
            // client 側の link-subscription API が後から紐づける
            log("stripe/webhook", "checkout.session.completed - provider not yet created, will be linked later", {
              userId,
              plan,
              customerId: session.customer,
            });
          }
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (customerId) {
          const periodEnd = invoice.lines?.data?.[0]?.period?.end;
          // Stripe v22+ では invoice.parent.subscription_details.subscription から取得
          const subscriptionId = (
            invoice.parent?.subscription_details?.subscription
              ? (typeof invoice.parent.subscription_details.subscription === "string"
                  ? invoice.parent.subscription_details.subscription
                  : invoice.parent.subscription_details.subscription.id)
              : null
          );

          // subscription から trial_ends_at も取得
          let invoiceTrialEnd: number | null = null;
          let invoicePeriodEnd: number | undefined;
          if (subscriptionId) {
            try {
              const stripe3 = getStripe();
              const sub = await stripe3.subscriptions.retrieve(subscriptionId);
              invoiceTrialEnd = sub.trial_end;
              invoicePeriodEnd = sub.items?.data?.[0]?.current_period_end;
            } catch {
              // 取得失敗は無視
            }
          }

          const invoiceUpdates: Record<string, unknown> = {};
          if (invoicePeriodEnd) {
            invoiceUpdates.plan_period_end = new Date(invoicePeriodEnd * 1000).toISOString();
          } else if (periodEnd) {
            invoiceUpdates.plan_period_end = new Date(periodEnd * 1000).toISOString();
          }
          if (invoiceTrialEnd) {
            invoiceUpdates.trial_ends_at = new Date(invoiceTrialEnd * 1000).toISOString();
          }
          if (subscriptionId) {
            invoiceUpdates.stripe_subscription_id = subscriptionId;
          }

          if (Object.keys(invoiceUpdates).length > 0) {
            // まず stripe_customer_id で検索
            const { data: providerByCustomer } = await supabase
              .from("providers")
              .select("id")
              .eq("stripe_customer_id", customerId)
              .single();

            if (providerByCustomer) {
              await supabase
                .from("providers")
                .update(invoiceUpdates)
                .eq("id", providerByCustomer.id);

              log("stripe/webhook", "invoice.paid - updated by customer_id", {
                providerId: providerByCustomer.id,
                customerId,
                updates: invoiceUpdates,
              });
            } else {
              // stripe_customer_id がまだ provider に紐づいていない場合
              // Stripe Customer の metadata から user_id を取得して検索
              try {
                const stripe3 = getStripe();
                const customer = await stripe3.customers.retrieve(customerId);
                if (!("deleted" in customer && customer.deleted)) {
                  const metaUserId = customer.metadata?.user_id;
                  if (metaUserId) {
                    const { data: providerByUser } = await supabase
                      .from("providers")
                      .select("id")
                      .eq("user_id", Number(metaUserId))
                      .single();

                    if (providerByUser) {
                      // stripe_customer_id も同時に紐づける
                      invoiceUpdates.stripe_customer_id = customerId;
                      await supabase
                        .from("providers")
                        .update(invoiceUpdates)
                        .eq("id", providerByUser.id);

                      log("stripe/webhook", "invoice.paid - updated by user_id fallback", {
                        providerId: providerByUser.id,
                        userId: metaUserId,
                        customerId,
                        updates: invoiceUpdates,
                      });
                    } else {
                      log("stripe/webhook", "invoice.paid - provider not found by user_id", {
                        userId: metaUserId,
                        customerId,
                      });
                    }
                  }
                }
              } catch (customerErr) {
                logError("stripe/webhook", "invoice.paid - customer lookup failed", customerErr);
              }
            }
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        // LINE 通知は Stripe 側のメール通知に任せる（DB 更新は不要）
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        logError("stripe/webhook", "invoice.payment_failed", { customerId });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        if (!customerId) break;

        // プラン変更を検出
        const priceId = subscription.items?.data?.[0]?.price?.id;
        let newPlan: string | null = null;

        if (priceId === process.env.STRIPE_BASIC_PRICE_ID) {
          newPlan = "basic";
        } else if (priceId === process.env.STRIPE_STANDARD_PRICE_ID) {
          newPlan = "standard";
        }

        // 現在のプランを取得してダウングレード/アップグレードを判定
        const { data: currentProvider } = await supabase
          .from("providers")
          .select("plan")
          .eq("stripe_customer_id", customerId)
          .single();

        const updates: Record<string, unknown> = {};

        // プラン変更がある場合
        if (newPlan) {
          updates.plan = newPlan;

          // ダウングレード時: downgraded_at を記録
          if (currentProvider?.plan === "standard" && newPlan === "basic") {
            updates.downgraded_at = new Date().toISOString();
          }
          // アップグレード時: downgraded_at をクリア（3ヶ月以内のデータ復活）
          if (currentProvider?.plan === "basic" && newPlan === "standard") {
            updates.downgraded_at = null;
          }
        }

        // 期間情報を更新
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

        // cancel_at_period_end の検知: 解約予約状態を DB に反映
        if (subscription.cancel_at_period_end) {
          // 解約予約あり: cancel_at を記録
          if (subscription.cancel_at) {
            updates.cancel_at = new Date(subscription.cancel_at * 1000).toISOString();
          } else if (currentPeriodEnd) {
            // cancel_at がない場合は期間終了日をフォールバックとして使用
            updates.cancel_at = new Date(currentPeriodEnd * 1000).toISOString();
          }
          log("stripe/webhook", "subscription.updated - cancel scheduled", {
            customerId,
            cancelAt: updates.cancel_at,
          });
        } else {
          // 解約予約なし（キャンセルされた or 最初からなし）: cancel_at をクリア
          updates.cancel_at = null;
        }

        if (Object.keys(updates).length > 0) {
          await supabase
            .from("providers")
            .update(updates)
            .eq("stripe_customer_id", customerId);

          log("stripe/webhook", "subscription.updated", {
            customerId,
            newPlan,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            updates: Object.keys(updates),
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
              cancel_at: null,
              downgraded_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", customerId);

          log("stripe/webhook", "subscription.deleted", { customerId });
        }
        break;
      }

      case "customer.subscription.trial_will_end": {
        // LINE 通知は Stripe 側のメール通知に任せる（DB 更新は不要）
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        log("stripe/webhook", "trial_will_end", { customerId });
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
