"use client";

import { useState } from "react";

export function CalendarSettings({
  icalUrl,
  webcalUrl,
  lastSyncedAt,
}: {
  icalUrl: string;
  webcalUrl: string;
  lastSyncedAt: string | null;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(icalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const lastSync = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString("ja-JP", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="mt-6 space-y-6">
      {/* 同期状況 */}
      <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">同期状況</p>
            <p className="mt-0.5 text-xs text-muted">
              {lastSync ? `最終同期: ${lastSync}` : "まだ同期されていません"}
            </p>
          </div>
          <div
            className={`h-2.5 w-2.5 rounded-full ${
              lastSync ? "bg-success" : "bg-gray-300"
            }`}
          />
        </div>
      </div>

      {/* カレンダー追加ボタン */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
          カレンダーに追加
        </h2>
        <div className="space-y-2.5">
          <a
            href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[3rem] items-center gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border active:scale-[0.99]"
          >
            <span className="text-xl">📅</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">Googleカレンダーに登録</p>
              <p className="text-xs text-muted">タップで自動追加</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>

          <a
            href={webcalUrl}
            className="flex min-h-[3rem] items-center gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border active:scale-[0.99]"
          >
            <span className="text-xl">🍎</span>
            <div className="flex-1">
              <p className="text-sm font-semibold">Appleカレンダーに登録</p>
              <p className="text-xs text-muted">iPhone / Macで自動追加</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>

          <button
            onClick={handleCopy}
            className={`flex min-h-[3rem] w-full items-center gap-3 rounded-2xl p-4 shadow-sm ring-1 active:scale-[0.99] ${
              copied
                ? "bg-green-50 ring-green-200"
                : "bg-card ring-border"
            }`}
          >
            <span className="text-xl">🔗</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold">
                {copied ? "コピーしました" : "URLをコピー"}
              </p>
              <p className="text-xs text-muted">TimeTree・Outlookなど</p>
            </div>
          </button>
        </div>
      </section>

      {/* 注意書き */}
      <div className="rounded-xl bg-accent-bg p-3">
        <p className="text-xs leading-relaxed text-accent">
          ⚠️ このURLはあなた専用です。他の人と共有しないでください。
          カレンダーアプリが定期的にアクセスし、予約が自動反映されます。
        </p>
      </div>
    </div>
  );
}
