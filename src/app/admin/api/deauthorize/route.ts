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

  // LINEログインチャネル（LIFF）のChannel IDとSecretでトークンを発行
  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  const liffChannelSecret = process.env.LIFF_CHANNEL_SECRET;
  if (!liffId || !liffChannelSecret) {
    return NextResponse.json({ error: "LIFF credentials not configured" }, { status: 500 });
  }
  const channelId = liffId.split("-")[0];

  // Build JWT assertion for LINE Login channel access token
  // Ref: https://developers.line.biz/ja/reference/line-login/#issue-channel-access-token
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    iss: channelId,
    sub: channelId,
    aud: "https://api.line.me/",
    exp: now + 1800,
    iat: now,
  };

  const enc = (obj: object) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");
  const { createHmac } = await import("crypto");
  const signingInput = `${enc(header)}.${enc(payload)}`;
  const signature = createHmac("sha256", liffChannelSecret)
    .update(signingInput)
    .digest("base64url");
  const jwt = `${signingInput}.${signature}`;

  // Issue channel access token using JWT assertion
  const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_assertion_type: "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
      client_assertion: jwt,
    }),
  });

  if (!tokenRes.ok) {
    const tokenErr = await tokenRes.text();
    return NextResponse.json({ error: `Token issue failed: ${tokenRes.status} ${tokenErr}`, source: "token" }, { status: 400 });
  }

  const { access_token: channelAccessToken } = await tokenRes.json();

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
