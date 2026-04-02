import { NextResponse } from "next/server";
import { messagingApi } from "@line/bot-sdk";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID!;

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
});

const blobClient = new messagingApi.MessagingApiBlobClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
});

// リッチメニューの作成・設定（1回だけ実行）
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. リッチメニューを作成
    const richMenu = await client.createRichMenu({
      size: { width: 2500, height: 843 },
      selected: true,
      name: "EdgeConnect Menu",
      chatBarText: "メニュー",
      areas: [
        {
          bounds: { x: 0, y: 0, width: 833, height: 843 },
          action: {
            type: "uri",
            label: "予約一覧",
            uri: `https://liff.line.me/${LIFF_ID}?path=/bookings`,
          },
        },
        {
          bounds: { x: 833, y: 0, width: 834, height: 843 },
          action: {
            type: "uri",
            label: "予約する",
            uri: `https://liff.line.me/${LIFF_ID}`,
          },
        },
        {
          bounds: { x: 1667, y: 0, width: 833, height: 843 },
          action: {
            type: "uri",
            label: "マイページ",
            uri: `https://liff.line.me/${LIFF_ID}`,
          },
        },
      ],
    });

    const richMenuId = richMenu.richMenuId;

    // 2. リッチメニュー画像を生成（SVGからPNG）
    const svgImage = generateRichMenuSvg();
    const pngBuffer = await svgToPng(svgImage);

    const blob = new Blob([new Uint8Array(pngBuffer)], { type: "image/png" });
    await blobClient.setRichMenuImage(richMenuId, blob);

    // 3. デフォルトリッチメニューに設定
    await client.setDefaultRichMenu(richMenuId);

    return NextResponse.json({
      success: true,
      richMenuId,
      message: "リッチメニューを作成・設定しました",
    });
  } catch (e) {
    console.error("Rich menu setup failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}

function generateRichMenuSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2500" height="843" viewBox="0 0 2500 843">
    <rect width="2500" height="843" fill="#ffffff"/>
    <line x1="833" y1="0" x2="833" y2="843" stroke="#e2e8f0" stroke-width="2"/>
    <line x1="1667" y1="0" x2="1667" y2="843" stroke="#e2e8f0" stroke-width="2"/>

    <!-- 予約一覧 -->
    <text x="416" y="370" text-anchor="middle" font-size="120" fill="#6366f1">📅</text>
    <text x="416" y="520" text-anchor="middle" font-family="sans-serif" font-size="64" font-weight="bold" fill="#0f172a">予約一覧</text>

    <!-- 予約する -->
    <text x="1250" y="370" text-anchor="middle" font-size="120" fill="#06C755">🏠</text>
    <text x="1250" y="520" text-anchor="middle" font-family="sans-serif" font-size="64" font-weight="bold" fill="#0f172a">ホーム</text>

    <!-- マイページ -->
    <text x="2084" y="370" text-anchor="middle" font-size="120" fill="#6366f1">👤</text>
    <text x="2084" y="520" text-anchor="middle" font-family="sans-serif" font-size="64" font-weight="bold" fill="#0f172a">マイページ</text>
  </svg>`;
}

async function svgToPng(svg: string): Promise<Buffer> {
  // Resvgがなければシンプルなプレースホルダー画像を生成
  // 本番ではCanvasやSharpなどを使う
  // ここではSVGをそのままバッファとして返す（LINEはPNG必須なのでフォールバック）
  try {
    const { Resvg } = await import("@resvg/resvg-js");
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 2500 } });
    const rendered = resvg.render();
    return Buffer.from(rendered.asPng());
  } catch {
    // resvgがない場合はシンプルなPNGを生成
    return createSimpleRichMenuPng();
  }
}

function createSimpleRichMenuPng(): Buffer {
  // 1x1 白ピクセルのPNG（フォールバック用）
  // 実際にはLINE Official Account Managerから画像を設定してください
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
    "base64"
  );
  return png;
}
