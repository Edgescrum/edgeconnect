"use client";

import { useLiff } from "@/components/LiffProvider";
import { useEffect, useState } from "react";

interface RecentProvider {
  slug: string;
  name: string;
  icon_url: string | null;
  lastService: string;
  lastDate: string;
}

interface UserInfo {
  role: string;
  provider?: { slug: string; name: string; icon_url: string | null } | null;
  recentProviders?: RecentProvider[];
}

export default function Home() {
  const { user, isReady, isLoggedIn } = useLiff();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    if (!isReady || !isLoggedIn || !user) return;
    fetch("/api/auth/me", { cache: "no-store" })
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
      <main className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-border border-t-accent" />
          <p className="mt-3 text-xs text-muted">読み込み中...</p>
        </div>
      </main>
    );
  }

  // 未ログイン → ランディングページ
  if (!isLoggedIn) {
    const liffUrl = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}`;
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-white shadow-lg">
            E
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">EdgeConnect</h1>
          <p className="mt-3 text-muted">
            予約受付をもっとシンプルに
          </p>
          <p className="mt-2 text-sm text-muted">
            LINEで簡単に予約・管理ができるサービスです
          </p>
          <a
            href={liffUrl}
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-success py-3.5 text-base font-semibold text-white shadow-lg shadow-success/25 active:scale-[0.98]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            LINEで始める
          </a>
          <p className="mt-3 text-xs text-muted">
            LINEアカウントで簡単に利用できます
          </p>
        </div>
      </main>
    );
  }

  const hasRecent = userInfo?.recentProviders && userInfo.recentProviders.length > 0;
  const isProvider = userInfo?.role === "provider";

  // バナーカード定義
  const bannerCards: { key: string; node: React.ReactNode }[] = [];
  bannerCards.push({
    key: "welcome",
    node: (
      <>
        <h2 className="text-lg font-bold text-white">EdgeConnectへようこそ</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/90">
          LINEで簡単に予約ができるサービスです。事業主のQRコードやURLから予約しましょう。
        </p>
      </>
    ),
  });
  if (!isProvider) {
    bannerCards.push({
      key: "provider-cta",
      node: (
        <>
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
                  className={`relative flex h-[180px] shrink-0 snap-center flex-col overflow-hidden rounded-2xl p-5 shadow-lg ${
                    bannerCards.length === 1 ? "w-full" : "w-[80vw] max-w-[360px]"
                  } ${
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

        {/* 事業主管理セクション — 左ボーダーアクセントで「管理者向け」を示す */}
        {isLoggedIn && isProvider && (
          <div className="mx-4 mt-4">
            <a
              href="/provider"
              className="flex items-center gap-4 rounded-2xl border-l-4 border-accent bg-card p-4 shadow-sm ring-1 ring-border active:scale-[0.99]"
            >
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-accent text-sm font-bold text-white shadow-sm shadow-accent/30">
                {userInfo?.provider?.icon_url ? (
                  <img
                    src={userInfo.provider.icon_url}
                    alt={userInfo.provider.name || ""}
                    className="h-11 w-11 object-cover"
                  />
                ) : (
                  userInfo?.provider?.name?.[0] || "E"
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{userInfo?.provider?.name || "管理画面"}</p>
                <p className="text-xs text-muted">予約・メニュー・スケジュールを管理</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-bg">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </div>
            </a>
          </div>
        )}

        {/* ユーザーセクション — 背景色を変えて領域を分離 */}
        {isLoggedIn && (
          <div className="mt-4 bg-card/60 py-4">
            <div className="space-y-3 px-4">
              {/* 予約一覧 */}
              <a
                href="/bookings"
                className="flex items-center gap-3.5 rounded-xl bg-background p-3.5 ring-1 ring-border active:scale-[0.99]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-bg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">予約一覧</p>
                  <p className="text-xs text-muted">予約の確認・キャンセル</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </a>

              {/* 最近利用した事業主 */}
              {hasRecent && (
                <>
                  <p className="pt-1 text-xs font-medium text-muted">最近の利用</p>
                  {userInfo!.recentProviders!.map((rp) => {
                    const d = new Date(rp.lastDate);
                    const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;
                    return (
                      <a
                        key={rp.slug}
                        href={`/p/${rp.slug}`}
                        className="flex items-center gap-3.5 rounded-xl bg-background p-3.5 ring-1 ring-border active:scale-[0.99]"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
                          {rp.icon_url ? (
                            <img src={rp.icon_url} alt={rp.name} className="h-9 w-9 object-cover" />
                          ) : (
                            rp.name[0]
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{rp.name}</p>
                          <p className="text-xs text-muted truncate">
                            {dateLabel} {rp.lastService}
                          </p>
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted">
                          <path d="m9 18 6-6-6-6" />
                        </svg>
                      </a>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
