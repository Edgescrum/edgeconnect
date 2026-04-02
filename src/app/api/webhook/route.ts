import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // TODO: LINE署名検証・イベント処理を実装（09で対応）
  return NextResponse.json({ status: "ok" });
}
