"use client";

import { useLiff } from "@/components/LiffProvider";

export default function Home() {
  const { user, isReady, isLoggedIn, error, login } = useLiff();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <div className="mb-2 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-white">
          E
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">EdgeConnect</h1>
        <p className="mt-2 text-muted">
          予約受付をもっとシンプルに
        </p>

        <div className="mt-10">
          {!isReady && (
            <div className="flex items-center justify-center gap-2 text-muted">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              <span className="text-sm">接続中...</span>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {isReady && !isLoggedIn && (
            <div className="space-y-4">
              <button
                onClick={login}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3.5 text-base font-semibold text-white shadow-lg shadow-success/25 active:scale-[0.98]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                LINEでログイン
              </button>
              <p className="text-xs text-muted">
                LINEアカウントで簡単に始められます
              </p>
            </div>
          )}

          {isLoggedIn && user && (
            <div className="space-y-4">
              <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-bg text-lg font-bold text-accent">
                    {user.displayName[0]}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">{user.displayName}</p>
                    <p className="text-xs text-muted">ログイン中</p>
                  </div>
                </div>
              </div>
              <a
                href="/provider/register"
                className="block w-full rounded-xl bg-accent py-3.5 text-center text-base font-semibold text-white shadow-lg shadow-accent/25 active:scale-[0.98]"
              >
                事業主として始める
              </a>
              <p className="text-xs text-muted">
                無料で予約ページを作成できます
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
