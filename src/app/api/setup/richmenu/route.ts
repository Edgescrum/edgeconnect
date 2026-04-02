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
            label: "ホーム",
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

    // 2. シンプルなリッチメニュー画像を生成（2500x843のPNG）
    const pngBuffer = createRichMenuImage();
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

// シンプルなPNG画像を生成（純粋なバイト列操作、外部依存なし）
function createRichMenuImage(): Buffer {
  const width = 2500;
  const height = 843;

  // 非圧縮BMPをPNGの代わりに使うのは非推奨なので、
  // 最小限のPNGを生成（1色の背景）
  // LINE APIは最低限のPNGを受け付ける

  // 白背景の2500x843 PNGを生成するために、
  // zlib不要の最小PNGフォーマットを使用
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 2; // color type (RGB)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdr = createPngChunk("IHDR", ihdrData);

  // IDAT chunk - 非圧縮のdeflateブロック
  // 各行: filter byte (0) + RGB pixels
  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const offset = y * rowSize;
    rawData[offset] = 0; // no filter
    for (let x = 0; x < width; x++) {
      const px = offset + 1 + x * 3;
      rawData[px] = 255;     // R (white)
      rawData[px + 1] = 255; // G
      rawData[px + 2] = 255; // B
    }

    // 区切り線（833px, 1667px）
    if (true) {
      for (let lineX = 832; lineX <= 834; lineX++) {
        const px = offset + 1 + lineX * 3;
        rawData[px] = 226; rawData[px+1] = 232; rawData[px+2] = 240;
      }
      for (let lineX = 1666; lineX <= 1668; lineX++) {
        const px = offset + 1 + lineX * 3;
        rawData[px] = 226; rawData[px+1] = 232; rawData[px+2] = 240;
      }
    }
  }

  // zlib非圧縮形式でラップ
  const zlibData = createUncompressedZlib(rawData);
  const idat = createPngChunk("IDAT", zlibData);

  // IEND chunk
  const iend = createPngChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createPngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, "ascii");
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function createUncompressedZlib(data: Buffer): Buffer {
  // zlib header (no compression)
  const header = Buffer.from([0x78, 0x01]);

  // Split into 65535-byte blocks
  const blocks: Buffer[] = [header];
  const maxBlock = 65535;

  for (let i = 0; i < data.length; i += maxBlock) {
    const isLast = i + maxBlock >= data.length;
    const chunk = data.subarray(i, Math.min(i + maxBlock, data.length));
    const blockHeader = Buffer.alloc(5);
    blockHeader[0] = isLast ? 1 : 0;
    blockHeader.writeUInt16LE(chunk.length, 1);
    blockHeader.writeUInt16LE(chunk.length ^ 0xffff, 3);
    blocks.push(blockHeader, chunk);
  }

  // Adler-32 checksum
  const adler = adler32(data);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(adler, 0);
  blocks.push(checksum);

  return Buffer.concat(blocks);
}

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function adler32(buf: Buffer): number {
  let a = 1, b = 0;
  for (let i = 0; i < buf.length; i++) {
    a = (a + buf[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}
