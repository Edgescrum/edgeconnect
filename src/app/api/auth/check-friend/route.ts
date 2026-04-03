import { NextResponse } from "next/server";
import { messagingApi } from "@line/bot-sdk";
import { log } from "@/lib/log";

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lineUserId = searchParams.get("lineUserId");

  if (!lineUserId) {
    return NextResponse.json({ isFriend: false });
  }

  try {
    // Messaging APIでプロフィール取得を試行
    // 友だちでないユーザーのプロフィールは取得できない（404エラー）
    await client.getProfile(lineUserId);
    log("check-friend", "is friend", { lineUserId });
    return NextResponse.json({ isFriend: true });
  } catch {
    log("check-friend", "not friend", { lineUserId });
    return NextResponse.json({ isFriend: false });
  }
}
