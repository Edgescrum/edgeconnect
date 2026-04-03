"use client";

import { useState } from "react";
import { useLiff } from "@/components/LiffProvider";

export function BookingButton({
  slug,
  serviceId,
}: {
  slug: string;
  serviceId: number;
}) {
  const { isLoggedIn, isFriend, login, checkFriendship } = useLiff();
  const [showFriendModal, setShowFriendModal] = useState(false);
  const [checking, setChecking] = useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();

    // 未ログイン → LINEログイン
    if (!isLoggedIn) {
      login();
      return;
    }

    // 友だちチェック
    setChecking(true);
    const friendFlag = isFriend ?? await checkFriendship();
    setChecking(false);

    if (!friendFlag) {
      setShowFriendModal(true);
      return;
    }

    // 友だち追加済み → 予約ページへ
    window.location.href = `/p/${slug}/book/${serviceId}`;
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={checking}
        className="mt-3 flex w-full items-center justify-center rounded-xl bg-accent-bg py-2.5 text-sm font-semibold text-accent active:scale-[0.98]"
      >
        {checking ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        ) : (
          "予約する"
        )}
      </button>

      {/* 友だち追加モーダル */}
      {showFriendModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-2xl">
                💬
              </div>
              <h3 className="mt-4 text-lg font-bold">友だち追加が必要です</h3>
              <p className="mt-2 text-sm text-muted">
                予約確定通知やリマインダーを受け取るために、EdgeConnect公式アカウントを友だちに追加してください。
              </p>
            </div>
            <div className="mt-6 space-y-2.5">
              <a
                href="https://line.me/R/ti/p/@edgeconnect"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3.5 font-semibold text-white active:scale-[0.98]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                友だち追加する
              </a>
              <button
                onClick={() => setShowFriendModal(false)}
                className="w-full rounded-xl border border-border py-3 text-sm font-medium text-muted active:scale-[0.98]"
              >
                あとで
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
