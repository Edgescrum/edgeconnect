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

    const supabase = await createClient();
    const { data: provider } = await supabase
      .from("providers")
      .select("id, stripe_customer_id")
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

    const session = await stripe.billingPortal.sessions.create({
      customer: provider.stripe_customer_id,
      return_url: `${origin}/provider/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logError("stripe/portal", "Failed to create portal session", error);
    return NextResponse.json(
      { error: "ポータルセッションの作成に失敗しました" },
      { status: 500 }
    );
  }
}
