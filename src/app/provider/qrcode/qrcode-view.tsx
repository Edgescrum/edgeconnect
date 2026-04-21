"use client";

import { useState } from "react";
import { LineIcon } from "@/components/icons";

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
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-success py-3 text-sm font-semibold text-white active:scale-[0.98]"
          >
            <LineIcon size={16} />
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
