import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/log";

export async function POST(request: NextRequest) {
  try {
    const user = await resolveUser();
    if (!user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const flow = body.flow as string | undefined;

    const supabase = await createClient();
    const { data: provider } = await supabase
      .from("providers")
      .select("id, stripe_customer_id, stripe_subscription_id")
      .eq("user_id", user.id)
      .single();

    if (!provider?.stripe_customer_id) {
      return NextResponse.json(
        { error: "Stripeカスタマー情報が見つかりません" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const origin =
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "";

    // flow_data でポータル内の特定セクションに直接遷移
    // See: https://docs.stripe.com/api/customer_portal/sessions/create#create_portal_session-flow_data
    type PortalParams = Parameters<typeof stripe.billingPortal.sessions.create>[0];
    const params: PortalParams = {
      customer: provider.stripe_customer_id,
      return_url: `${origin}/provider/billing`,
    };

    if (flow === "subscription_update" && provider.stripe_subscription_id) {
      params.flow_data = {
        type: "subscription_update",
        subscription_update: {
          subscription: provider.stripe_subscription_id,
        },
      };
    } else if (flow === "subscription_cancel" && provider.stripe_subscription_id) {
      params.flow_data = {
        type: "subscription_cancel",
        subscription_cancel: {
          subscription: provider.stripe_subscription_id,
        },
      };
    } else if (flow === "payment_method_update") {
      params.flow_data = {
        type: "payment_method_update",
      };
    }

    const session = await stripe.billingPortal.sessions.create(params);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logError("stripe/portal", "Failed to create portal session", error);
    return NextResponse.json(
      { error: "ポータルセッションの作成に失敗しました" },
      { status: 500 }
    );
  }
}
