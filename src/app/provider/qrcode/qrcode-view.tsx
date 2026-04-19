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

  // シェアテンプレート
  const defaultTemplate = `${name}のご予約はこちらから！\nLINEで簡単に予約できます。`;
  const [shareText, setShareText] = useState(defaultTemplate);
  const [shareCopied, setShareCopied] = useState(false);

  const fullShareText = `${shareText}\n${url}`;
  const lineShareUrl = `https://line.me/R/share?text=${encodeURIComponent(fullShareText)}`;
  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShareCopy() {
    await navigator.clipboard.writeText(fullShareText);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }

  async function handleNativeShare() {
    try {
      await navigator.share({ text: fullShareText });
    } catch {
      // ユーザーがキャンセルした場合
    }
  }

  return (
    <div className="mt-6 flex flex-col items-center">
      {/* QR Card */}
      <div className="w-full rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border">
        <div className="flex flex-col items-center">
          <div className="rounded-xl bg-white p-3">
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

      {/* URL Copy */}
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

      {/* SNSシェア */}
      <div className="mt-6 w-full rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
        <h3 className="text-sm font-semibold">SNSでシェア</h3>
        <p className="mt-1 text-xs text-muted">
          お客さまに共有するメッセージを編集できます
        </p>

        <textarea
          value={shareText}
          onChange={(e) => setShareText(e.target.value)}
          rows={3}
          className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm"
        />
        <div className="mt-1 rounded-lg bg-background px-3 py-2">
          <p className="break-all text-xs text-muted">{url}</p>
        </div>

        <div className="mt-4 flex gap-2">
          {/* LINEでシェア */}
          <a
            href={lineShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#06C755] py-3 text-sm font-semibold text-white active:scale-[0.98]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            LINE
          </a>

          {/* コピー */}
          <button
            onClick={handleShareCopy}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold ring-1 active:scale-[0.98] ${
              shareCopied
                ? "bg-green-50 text-green-600 ring-green-200"
                : "bg-card ring-border"
            }`}
          >
            {shareCopied ? (
              "✓ コピー済"
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                コピー
              </>
            )}
          </button>

          {/* ネイティブシェア */}
          {canNativeShare && (
            <button
              onClick={handleNativeShare}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-card py-3 text-sm font-semibold ring-1 ring-border active:scale-[0.98]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              シェア
            </button>
          )}
        </div>
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
