import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/log";

export interface InvoiceItem {
  id: string;
  date: string;
  amount: number;
  currency: string;
  description: string;
  status: string;
  invoicePdf: string | null;
}

export async function GET() {
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
      return NextResponse.json({ invoices: [] });
    }

    const stripe = getStripe();
    const invoices = await stripe.invoices.list({
      customer: provider.stripe_customer_id,
      limit: 20,
    });

    const items: InvoiceItem[] = invoices.data.map((inv) => ({
      id: inv.number || inv.id,
      date: inv.created
        ? new Date(inv.created * 1000).toISOString()
        : "",
      amount: inv.amount_paid ?? 0,
      currency: inv.currency || "jpy",
      description:
        inv.lines?.data?.[0]?.description || "サブスクリプション",
      status: inv.status || "unknown",
      invoicePdf: inv.invoice_pdf || null,
    }));

    return NextResponse.json({ invoices: items });
  } catch (error) {
    logError("stripe/invoices", "Failed to fetch invoices", error);
    return NextResponse.json(
      { error: "請求履歴の取得に失敗しました" },
      { status: 500 }
    );
  }
}
