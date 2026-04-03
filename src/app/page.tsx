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
const PROVIDER_BANNER_DISMISSED_KEY = "edgeconnect_provider_banner_dismissed";

export default function Home() {
  const { user, isReady, isLoggedIn } = useLiff();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showProviderCta, setShowProviderCta] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  // localStorage読み込み（LiffProviderがmountedガードしているので安全）
  useEffect(() => {
    if (!localStorage.getItem(WELCOME_DISMISSED_KEY)) setShowWelcome(true);
    if (!localStorage.getItem(PROVIDER_BANNER_DISMISSED_KEY)) setShowProviderCta(true);
  }, []);

  function dismissWelcome() {
    setShowWelcome(false);
    localStorage.setItem(WELCOME_DISMISSED_KEY, "1");
  }

  function dismissProviderBanner() {
    setShowProviderCta(false);
    localStorage.setItem(PROVIDER_BANNER_DISMISSED_KEY, "1");
  }

  useEffect(() => {
    if (!isReady || !isLoggedIn || !user) return;
    fetch(`/api/auth/me?lineUserId=${user.lineUserId}`)
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
    // layout.tsxのinitial-loaderが表示中なので空を返す
    return null;
  }

  const hasRecent = userInfo?.recentProviders && userInfo.recentProviders.length > 0;
  const isProvider = userInfo?.role === "provider";
  const showProviderBanner = isLoggedIn && !isProvider && showProviderCta;

  // バナーカード定義
  const bannerCards: { key: string; node: React.ReactNode }[] = [];
  if (showWelcome) {
    bannerCards.push({
      key: "welcome",
      node: (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); dismissWelcome(); }}
            className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs active:bg-white/30"
          >
            ✕
          </button>
          <h2 className="text-lg font-bold text-white">EdgeConnectへようこそ</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/90">
            LINEで簡単に予約ができるサービスです。事業主のQRコードやURLから予約しましょう。
          </p>
        </>
      ),
    });
  }
  if (showProviderBanner) {
    bannerCards.push({
      key: "provider-cta",
      node: (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); dismissProviderBanner(); }}
            className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs active:bg-white/30"
          >
            ✕
          </button>
          <h2 className="text-lg font-bold text-white">予約を受け付けませんか？</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/90">
            無料であなた専用の予約ページを作成できます。
          </p>
          <a
            href="/provider/register"
            className="mt-4 block w-full rounded-xl bg-white py-3 text-center text-sm font-bold text-orange-500 shadow active:scale-[0.98]"
          >
            事業主として始める
          </a>
        </>
      ),
    });
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const idx = Math.round(el.scrollLeft / (el.scrollWidth / bannerCards.length));
    setActiveSlide(idx);
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
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-10 z-50 w-48 rounded-xl bg-card p-1 shadow-lg ring-1 ring-border">
                    <div className="border-b border-border px-3 py-2">
                      <p className="text-sm font-semibold">{user.displayName}</p>
                    </div>
                    {isProvider && (
                      <a href="/provider" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-accent-bg">
                        <span>📊</span> 管理画面へ
                      </a>
                    )}
                    {!isProvider && (
                      <a href="/provider/register" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm hover:bg-accent-bg">
                        <span>🏠</span> 事業主として登録
                      </a>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-lg">
        {/* バナーカルーセル */}
        {bannerCards.length > 0 && (
          <div className="pt-4 pb-2">
            <div
              className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 scrollbar-hide"
              onScroll={handleScroll}
            >
              {bannerCards.map((card, i) => (
                <div
                  key={card.key}
                  className={`relative flex h-[180px] w-[80vw] max-w-[360px] shrink-0 snap-center flex-col overflow-hidden rounded-2xl p-5 shadow-lg ${
                    i === 0 && card.key === "welcome"
                      ? "bg-gradient-to-br from-accent to-accent-light"
                      : "bg-gradient-to-br from-amber-400 to-orange-400"
                  }`}
                >
                  {card.node}
                </div>
              ))}
            </div>
            {/* ドットインジケーター */}
            {bannerCards.length > 1 && (
              <div className="mt-2 flex justify-center gap-1.5">
                {bannerCards.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === activeSlide ? "w-4 bg-accent" : "w-1.5 bg-border"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="px-4 pb-4 space-y-4">
          {/* 事業主セクション */}
          {isLoggedIn && isProvider && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                あなたのサービス
              </h2>
              <a
                href="/provider"
                className="flex items-center gap-4 rounded-2xl bg-accent/5 p-4 ring-1 ring-accent/20 active:scale-[0.99]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white">
                  {userInfo?.provider?.name?.[0] || "E"}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{userInfo?.provider?.name || "管理画面"}</p>
                  <p className="text-xs text-muted">予約・メニュー・スケジュールを管理</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </a>
            </section>
          )}

          {/* 予約セクション */}
          {isLoggedIn && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
                予約
              </h2>
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
            </section>
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

          {/* ガイド */}
          {!showWelcome && !hasRecent && !showProviderBanner && (
            <div className="pt-4 text-center">
              <p className="text-sm text-muted">
                事業主のQRコードやURLから予約ページにアクセスしてください
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
