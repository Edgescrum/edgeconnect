"use client";

import { useState } from "react";

export function QrCodeView({
  url,
  slug,
  name,
}: {
  url: string;
  slug: string;
  name: string;
}) {
  const [copied, setCopied] = useState(false);
  const qrImageUrl = `/api/qrcode?url=${encodeURIComponent(url)}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mt-6 flex flex-col items-center">
      {/* QR Card */}
      <div className="w-full rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
        <div className="flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-xl font-bold text-white">
            {name[0] || "E"}
          </div>
          <p className="mt-2 font-semibold">{name}</p>

          <div className="mt-4 rounded-xl bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrImageUrl}
              alt={`${name} QRコード`}
              width={220}
              height={220}
            />
          </div>

          <p className="mt-3 text-xs text-muted">
            画像を長押しして保存できます
          </p>

          <div className="mt-3 w-full rounded-xl bg-background p-3">
            <p className="break-all text-center text-xs text-muted">{url}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 w-full">
        <button
          onClick={handleCopy}
          className={`w-full rounded-xl py-3.5 font-semibold ring-1 active:scale-[0.98] ${
            copied
              ? "bg-green-50 text-green-600 ring-green-200"
              : "bg-card text-foreground ring-border"
          }`}
        >
          {copied ? "✓ コピーしました" : "URLをコピー"}
        </button>
      </div>

      {/* Tips */}
      <div className="mt-6 w-full rounded-xl bg-accent-bg p-4">
        <p className="text-xs font-semibold text-accent">💡 使い方</p>
        <ul className="mt-2 space-y-1 text-xs leading-relaxed text-accent">
          <li>・ QRコードを長押しして保存</li>
          <li>・ URLをSNSやプロフィールに貼付</li>
          <li>・ LINEのトークでお客さまに送信</li>
        </ul>
      </div>
    </div>
  );
}
