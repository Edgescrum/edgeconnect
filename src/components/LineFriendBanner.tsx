"use client";

import { useState, useEffect } from "react";
import { LineIcon } from "@/components/icons";

const STORAGE_KEY = "line-friend-banner-dismissed";

export function LineFriendBanner({ isLineFriend }: { isLineFriend: boolean }) {
  const [dismissed, setDismissed] = useState(true); // デフォルト非表示で hydration 対策

  useEffect(() => {
    if (!isLineFriend) {
      setDismissed(sessionStorage.getItem(STORAGE_KEY) === "1");
    }
  }, [isLineFriend]);

  if (isLineFriend || dismissed) return null;

  const botId = process.env.NEXT_PUBLIC_LINE_BOT_BASIC_ID;
  const friendUrl = botId ? `https://line.me/R/ti/p/${botId}` : null;

  function handleDismiss() {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  }

  return (
    <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-500">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-800">
            LINE通知が届きません
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-700">
            友だち追加すると予約確認・リマインダーが届きます
          </p>
          <div className="mt-3 flex items-center gap-2">
            {friendUrl && (
              <a
                href={friendUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-success px-3.5 py-2 text-xs font-semibold text-white active:scale-[0.98]"
              >
                <LineIcon size={14} />
                友だち追加する
              </a>
            )}
            <button
              onClick={handleDismiss}
              className="rounded-lg px-3 py-2 text-xs text-amber-600 active:bg-amber-100"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
