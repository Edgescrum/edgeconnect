"use client";

import { useLiff } from "@/components/LiffProvider";
import { useEffect, useState } from "react";

interface RecentProvider {
  slug: string;
  name: string;
  lastService: string;
  lastDate: string;
}

interface UserInfo {
  role: string;
  provider?: { slug: string; name: string } | null;
  recentProviders?: RecentProvider[];
}

const WELCOME_DISMISSED_KEY = "edgeconnect_welcome_dismissed";

export default function Home() {
  const { user, isReady, isLoggedIn } = useLiff();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

// 初回表示判定
  useEffect(() => {
    const dismissed = localStorage.getItem(WELCOME_DISMISSED_KEY);
    if (!dismissed) {
      setShowWelcome(true);
    }
  }, []);

  function dismissWelcome() {
    setShowWelcome(false);
    localStorage.setItem(WELCOME_DISMISSED_KEY, "1");
  }

  useEffect(() => {
    if (!isReady || !isLoggedIn) return;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUserInfo({
            role: data.user.role,
            provider: data.provider,
            recentProviders: data.recentProviders,
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

  const hasRecent = userInfo?.recentProviders && userInfo.recentProviders.length > 0;

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

      <div className="mx-auto max-w-lg px-4 py-6 space-y-4">
        {/* ウェルカム（初回のみ） */}
        {showWelcome && (
          <div className="relative rounded-2xl bg-gradient-to-br from-accent to-accent-light p-5 text-white shadow-lg">
            <button
              onClick={dismissWelcome}
              className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs active:bg-white/30"
              aria-label="閉じる"
            >
              ✕
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-lg font-bold">
              E
            </div>
            <h2 className="mt-3 text-lg font-bold">
              EdgeConnectへようこそ
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-white/90">
              LINEで簡単に予約ができるサービスです。
              事業主から共有されたQRコードやURLからアクセスして予約しましょう。
            </p>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/10 p-3">
              <span className="text-2xl">📱</span>
              <p className="text-xs leading-relaxed text-white/80">
                QRコードをスキャンするか、共有されたURLをタップしてください
              </p>
            </div>
          </div>
        )}

        {/* 予約一覧 */}
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

        {/* 最近利用した事業主 */}
        {hasRecent && (
          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
              最近利用した事業主
            </h2>
            <div className="space-y-2">
              {userInfo!.recentProviders!.map((rp) => {
                const d = new Date(rp.lastDate);
                const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;
                return (
                  <a
                    key={rp.slug}
                    href={`/p/${rp.slug}`}
                    className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border active:scale-[0.99]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white">
                      {rp.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{rp.name}</p>
                      <p className="text-xs text-muted truncate">
                        {dateLabel} {rp.lastService}
                      </p>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted">
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* ガイド（ウェルカム非表示 & 予約履歴なしの場合） */}
        {!showWelcome && !hasRecent && (
          <div className="pt-4 text-center">
            <p className="text-sm text-muted">
              事業主のQRコードやURLから予約ページにアクセスしてください
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
