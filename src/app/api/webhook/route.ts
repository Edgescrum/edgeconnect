import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { pushFlexMessage } from "@/lib/line/messaging";
import { log, logError } from "@/lib/log";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID!;

function verifySignature(body: string, signature: string): boolean {
  const hash = createHmac("sha256", process.env.LINE_CHANNEL_SECRET!)
    .update(body)
    .digest("base64");
  return hash === signature;
}

interface LineEvent {
  type: string;
  source?: { type: string; userId?: string };
  replyToken?: string;
}

async function handleFollow(userId: string) {
  log("webhook", "follow", { userId });
  const supabase = createAdminClient();

  // ユーザー自動作成
  await supabase.rpc("upsert_user_from_line", {
    p_line_user_id: userId,
    p_display_name: null,
    p_role: "customer",
    p_auth_uid: null,
  });

  // pending-booking があるか確認
  const { data: pending } = await supabase
    .from("pending_bookings")
    .select("return_url")
    .eq("line_user_id", userId)
    .single();

  if (pending) {
    log("webhook", "pending booking found, sending return link", { returnUrl: pending.return_url });

    // 予約ページに戻れるFlex Messageを送信
    await pushFlexMessage(userId, "予約を続けましょう", {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#6366f1",
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: "友だち追加ありがとうございます！",
            color: "#ffffff",
            size: "md",
            weight: "bold",
            wrap: true,
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "予約の続きからお進みいただけます。",
            size: "sm",
            color: "#64748b",
            wrap: true,
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "予約を続ける",
              uri: `https://liff.line.me/${LIFF_ID}?path=${pending.return_url}`,
            },
            style: "primary",
            color: "#6366f1",
          },
        ],
      },
    });

    // pending-booking を削除
    await supabase
      .from("pending_bookings")
      .delete()
      .eq("line_user_id", userId);

    return;
  }

  // pending なし → 通常のウェルカムメッセージ
  log("webhook", "no pending, sending welcome");
  await pushFlexMessage(userId, "EdgeConnectへようこそ！", {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#6366f1",
      paddingAll: "20px",
      contents: [
        { type: "text", text: "EdgeConnect", color: "#ffffff", size: "xs" },
        { type: "text", text: "ようこそ！", color: "#ffffff", size: "xl", weight: "bold", margin: "sm" },
        { type: "text", text: "LINEで簡単に予約ができるサービスです", color: "#ffffffcc", size: "xs", margin: "sm", wrap: true },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        { type: "text", text: "事業主から共有されたQRコードやURLから予約ページにアクセスしてください。", size: "sm", color: "#64748b", wrap: true },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        { type: "button", action: { type: "uri", label: "アプリを開く", uri: `https://liff.line.me/${LIFF_ID}` }, style: "primary", color: "#6366f1" },
        { type: "button", action: { type: "uri", label: "事業主として登録する", uri: `https://liff.line.me/${LIFF_ID}?path=/provider/register` }, style: "link" },
      ],
    },
  });
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature") || "";

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const parsed = JSON.parse(body);
  const events: LineEvent[] = parsed.events || [];

  for (const event of events) {
    if (event.type === "follow" && event.source?.userId) {
      handleFollow(event.source.userId).catch((e) => logError("webhook", "follow failed", e));
    }
  }

  return NextResponse.json({ status: "ok" });
}
