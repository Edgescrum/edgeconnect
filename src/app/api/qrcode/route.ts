import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url || url.length > 2048) {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ error: "Invalid URL protocol" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const buffer = await QRCode.toBuffer(url, {
    width: 512,
    margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" },
    type: "png",
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": "inline",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
