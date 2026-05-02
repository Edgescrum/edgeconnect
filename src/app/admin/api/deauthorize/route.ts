import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // staging 環境のみ許可
  const vercelEnv = process.env.VERCEL_ENV;
  const nodeEnv = process.env.NODE_ENV;
  const appUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  // 本番Supabaseを使っていない場合は許可（dev/staging判定）
  const isProd = vercelEnv === "production" && appUrl.includes("kyihuqqgnrpnrpdklttq");
  if (isProd) {
    return NextResponse.json({ error: "Forbidden", vercelEnv, nodeEnv }, { status: 403 });
  }

  const { userAccessToken } = await request.json();
  if (!userAccessToken) {
    return NextResponse.json({ error: "userAccessToken is required" }, { status: 400 });
  }

  // Messaging API の Channel Access Token を使用
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!channelAccessToken) {
    return NextResponse.json({ error: "LINE_CHANNEL_ACCESS_TOKEN not configured" }, { status: 500 });
  }

  const res = await fetch("https://api.line.me/user/v1/deauthorize", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${channelAccessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userAccessToken }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    return NextResponse.json(
      { error: `LINE API error: ${res.status} ${errorText}`, source: "line_api" },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true, message: "LINE認可を取り消しました" });
}
