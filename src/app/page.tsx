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
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">ようこそ</h1>
          <p className="mt-2 text-sm text-muted">
            予約やお気に入りの事業主がここに表示されます
          </p>
        </div>

        {/* Empty state */}
        <div className="mt-12 flex flex-col items-center text-center">
          <div className="text-5xl">📅</div>
          <p className="mt-4 font-semibold">予約はまだありません</p>
          <p className="mt-1 text-sm text-muted">
            事業主のQRコードやURLから予約ページにアクセスしてください
          </p>
        </div>
      </div>
    </main>
  );
}
