import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
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
