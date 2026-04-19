"use client";

import { useState, useEffect } from "react";

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
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#06C755] px-3.5 py-2 text-xs font-semibold text-white active:scale-[0.98]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
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
