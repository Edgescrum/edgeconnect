import { NextRequest, NextResponse } from "next/server";

// staging 環境のみ許可
function isAllowed() {
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV;
  return env !== "production";
}

export async function POST(request: NextRequest) {
  if (!isAllowed()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userAccessToken } = await request.json();
  if (!userAccessToken) {
    return NextResponse.json({ error: "userAccessToken is required" }, { status: 400 });
  }

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
      { error: `LINE API error: ${res.status} ${errorText}` },
      { status: res.status }
    );
  }

  return NextResponse.json({ success: true, message: "LINE認可を取り消しました" });
}
