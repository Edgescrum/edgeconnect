import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { pushFlexMessage } from "@/lib/line/messaging";

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
  const supabase = createAdminClient();

  // ユーザー自動作成（既存なら無視）
  await supabase.rpc("upsert_user_from_line", {
    p_line_user_id: userId,
    p_display_name: null,
    p_role: "customer",
    p_auth_uid: null,
  });

  // ウェルカムFlex Message送信
  await pushFlexMessage(userId, "EdgeConnectへようこそ！", {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      backgroundColor: "#6366f1",
      paddingAll: "20px",
      contents: [
        {
          type: "text",
          text: "EdgeConnect",
          color: "#ffffff",
          size: "xs",
        },
        {
          type: "text",
          text: "ようこそ！",
          color: "#ffffff",
          size: "xl",
          weight: "bold",
          margin: "sm",
        },
        {
          type: "text",
          text: "LINEで簡単に予約ができるサービスです",
          color: "#ffffffcc",
          size: "xs",
          margin: "sm",
          wrap: true,
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      spacing: "md",
      contents: [
        {
          type: "text",
          text: "事業主から共有されたQRコードやURLから予約ページにアクセスしてください。",
          size: "sm",
          color: "#64748b",
          wrap: true,
        },
        {
          type: "text",
          text: "あなた自身がサービスを提供する事業主の方は、無料で予約ページを作成できます。",
          size: "sm",
          color: "#64748b",
          wrap: true,
          margin: "md",
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
            label: "アプリを開く",
            uri: `https://liff.line.me/${LIFF_ID}`,
          },
          style: "primary",
          color: "#6366f1",
        },
        {
          type: "button",
          action: {
            type: "uri",
            label: "事業主として登録する",
            uri: `https://liff.line.me/${LIFF_ID}?path=/provider/register`,
          },
          style: "link",
        },
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

  // イベント処理（バックグラウンド）
  for (const event of events) {
    if (event.type === "follow" && event.source?.userId) {
      handleFollow(event.source.userId).catch(console.error);
    }
  }

  return NextResponse.json({ status: "ok" });
}
