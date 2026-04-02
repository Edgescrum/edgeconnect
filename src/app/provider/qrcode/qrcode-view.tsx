"use client";

import { useEffect, useRef, useState } from "react";

export function QrCodeView({ url, slug }: { url: string; slug: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);

  useEffect(() => {
    async function generateQr() {
      // QRコード生成ライブラリを動的インポート
      const QRCode = (await import("qrcode")).default;
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, url, {
          width: 256,
          margin: 2,
        });
        setQrLoaded(true);
      }
    }
    generateQr();
  }, [url]);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `edgeconnect-${slug}.png`;
    link.href = canvasRef.current.toDataURL("image/png");
    link.click();
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="rounded-lg border p-4">
        <canvas ref={canvasRef} />
      </div>

      <div className="w-full space-y-3">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="mb-1 text-xs text-gray-500">あなたの予約ページURL</p>
          <p className="break-all text-sm">{url}</p>
        </div>

        <button
          onClick={handleCopy}
          className="w-full rounded-lg border py-3 font-semibold"
        >
          {copied ? "コピーしました" : "URLをコピー"}
        </button>

        {qrLoaded && (
          <button
            onClick={handleDownload}
            className="w-full rounded-lg bg-black py-3 font-semibold text-white"
          >
            QRコードをダウンロード
          </button>
        )}
      </div>
    </div>
  );
}
