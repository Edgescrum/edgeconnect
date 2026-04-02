"use client";

import { useLiff } from "@/components/LiffProvider";
import { useEffect, useState } from "react";

interface UserInfo {
  role: string;
  provider?: { slug: string; name: string } | null;
}

export default function Home() {
  const { user, isReady, isLoggedIn } = useLiff();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!isReady || !isLoggedIn) return;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUserInfo({
            role: data.user.role,
            provider: data.provider,
          });
        }
      });
  }, [isReady, isLoggedIn]);

  if (!isReady) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-2 text-muted">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-sm">読み込み中...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white">
              E
            </div>
            <span className="font-semibold">EdgeConnect</span>
          </div>
          {isLoggedIn && user && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-bg text-sm font-bold text-accent"
              >
                {user.displayName[0]}
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-10 z-50 w-48 rounded-xl bg-card p-1 shadow-lg ring-1 ring-border">
                    <div className="border-b border-border px-3 py-2">
                      <p className="text-sm font-semibold">
                        {user.displayName}
                      </p>
                    </div>
                    {userInfo?.role === "provider" && (
                      <a
                        href="/provider"
                        className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-accent-bg"
                      >
                        <span>📊</span>
                        管理画面へ
                      </a>
                    )}
                    {userInfo?.role !== "provider" && (
                      <a
                        href="/provider/register"
                        className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-accent-bg"
                      >
                        <span>🏠</span>
                        事業主として登録
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-lg px-4 py-6">
        {isLoggedIn && (
          <a
            href="/bookings"
            className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border active:scale-[0.99]"
          >
            <span className="text-2xl">📅</span>
            <div className="flex-1">
              <p className="font-semibold">予約一覧</p>
              <p className="text-xs text-muted">予約の確認・キャンセル</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>
        )}

        <div className="mt-8 flex flex-col items-center text-center">
          <p className="text-sm text-muted">
            事業主のQRコードやURLから予約ページにアクセスしてください
          </p>
        </div>
      </div>
    </main>
  );
}
