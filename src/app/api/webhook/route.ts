import { NextResponse } from "next/server";
import { createHmac } from "crypto";

function verifySignature(body: string, signature: string): boolean {
  const hash = createHmac("sha256", process.env.LINE_CHANNEL_SECRET!)
    .update(body)
    .digest("base64");
  return hash === signature;
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("x-line-signature") || "";

  if (!verifySignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Webhookイベント処理（将来の拡張用）
  // const events = JSON.parse(body).events;

  return NextResponse.json({ status: "ok" });
}
