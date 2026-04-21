"use client";

import Link from "next/link";
import Image from "next/image";

interface RecentProvider {
  slug: string;
  name: string;
  icon_url: string | null;
  lastService: string;
  lastDate: string;
}

interface Provider {
  slug: string;
  name: string;
  icon_url: string | null;
}

export function DashboardClient({
  role,
  provider,
  recentProviders,
}: {
  role: string;
  provider: Provider | null;
  recentProviders: RecentProvider[];
}) {
  const isProvider = role === "provider";
  const hasRecent = recentProviders.length > 0;

  return (
    <>
      {/* --- モバイル版 --- */}
      <div className="sm:hidden">
        <div>
          {/* ヒーローバナー */}
          <div className="relative overflow-hidden bg-gradient-to-br from-accent via-accent-light to-accent px-5 pb-6 pt-5 text-white">
            {/* 背景装飾 */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-12 -left-6 h-36 w-36 rounded-full bg-white/5" />
            {/* 設定アイコン */}
            <Link href="/settings" className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 active:bg-white/30">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </Link>
            <div className="relative">
              <h1 className="text-xl font-bold">PeCoへようこそ</h1>
              <p className="mt-1.5 text-sm leading-relaxed text-white/80">
                LINEで簡単に予約ができるサービスです
              </p>
              <div className="mt-4 flex gap-2">
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-accent shadow active:scale-[0.98]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                  </svg>
                  事業主を探す
                </Link>
                <Link
                  href="/bookings"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-4 py-2.5 text-xs font-semibold backdrop-blur-sm active:scale-[0.98]"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  予約一覧
                </Link>
              </div>
            </div>
          </div>

          {!isProvider && (
            <div className="mx-4 mt-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 p-4 text-white shadow">
              <p className="font-bold">予約を受け付けませんか？</p>
              <p className="mt-1 text-xs text-white/90">無料であなた専用の予約ページを作成できます</p>
              <Link
                href="/provider/register"
                className="mt-3 block w-full rounded-xl bg-white py-2.5 text-center text-sm font-bold text-orange-500 shadow active:scale-[0.98]"
              >
                事業主として始める
              </Link>
            </div>
          )}

          {isProvider && (
            <div className="mx-4 mt-4">
              <Link
                href="/provider"
                className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border active:scale-[0.99]"
              >
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-accent text-sm font-bold text-white">
                  {provider?.icon_url ? (
                    <Image src={provider.icon_url} alt={provider.name || ""} width={44} height={44} className="h-11 w-11 object-cover" />
                  ) : (
                    provider?.name?.[0] || "E"
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{provider?.name || "管理画面"}</p>
                  <p className="text-xs text-muted">予約・メニュー・スケジュールを管理</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-bg">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-accent">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </div>
              </Link>
            </div>
          )}

          <div className="mt-4 bg-card/60 py-4">
            <div className="space-y-3 px-4">
              <Link
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
              </Link>

              <Link
                href="/settings"
                className="flex items-center gap-3.5 rounded-xl bg-background p-3.5 ring-1 ring-border active:scale-[0.99]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-bg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">設定</p>
                  <p className="text-xs text-muted">名前・電話番号の登録</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>

              {hasRecent && (
                <>
                  <p className="pt-1 text-xs font-medium text-muted">最近の利用</p>
                  {recentProviders.map((rp) => (
                    <RecentProviderCard key={rp.slug} rp={rp} />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- PC版 --- */}
      <div className="mx-auto hidden max-w-5xl px-8 py-8 sm:block">
        {/* ヒーローバナー */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-accent via-accent-light to-accent p-8 text-white shadow-xl lg:p-10">
          {/* 背景装飾 */}
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-16 -left-8 h-48 w-48 rounded-full bg-white/5" />
          {/* 設定アイコン */}
          <Link href="/settings" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Link>
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-sm text-white/70">マイページ</p>
              <h1 className="mt-1 text-2xl font-bold lg:text-3xl">PeCoへようこそ</h1>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">
                LINEで簡単に予約ができるサービスです。事業主のQRコードやURLから予約しましょう。
              </p>
              <div className="mt-5 flex gap-3">
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-accent shadow-lg hover:shadow-xl transition-shadow"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                  </svg>
                  事業主を探す
                </Link>
                <Link
                  href="/bookings"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 px-5 py-2.5 text-sm font-semibold backdrop-blur-sm hover:bg-white/30 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  予約一覧
                </Link>
              </div>
            </div>
            <div className="hidden lg:block">
              <img src="/logo.svg" alt="PeCo" className="h-16" />
            </div>
          </div>
        </div>

        {/* カードグリッド */}
        <div className="mt-6 grid grid-cols-12 gap-5">
          {/* 事業主管理カード */}
          {isProvider && (
            <Link
              href="/provider"
              className="col-span-12 flex items-center gap-5 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border hover:ring-accent/30 hover:shadow-md transition-all lg:col-span-6"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-accent text-lg font-bold text-white">
                {provider?.icon_url ? (
                  <Image src={provider.icon_url} alt={provider.name || ""} width={56} height={56} className="h-14 w-14 object-cover" />
                ) : (
                  provider?.name?.[0] || "E"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold truncate">{provider?.name || "管理画面"}</p>
                <p className="text-sm text-muted">事業主管理画面を開く</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["予約管理", "メニュー", "スケジュール", "QRコード"].map((tag) => (
                    <span key={tag} className="rounded-md bg-accent/8 px-2 py-0.5 text-xs font-medium text-accent">{tag}</span>
                  ))}
                </div>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          )}

          {/* 事業主CTAカード（事業主でない場合） */}
          {!isProvider && (
            <div className="col-span-12 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 p-6 text-white shadow-lg lg:col-span-6">
              <h3 className="text-lg font-bold">予約を受け付けませんか？</h3>
              <p className="mt-1 text-sm text-white/90">無料であなた専用の予約ページを作成できます。</p>
              <Link href="/provider/register" className="mt-4 inline-flex rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-orange-500 shadow hover:shadow-md transition-shadow">
                事業主として始める
              </Link>
            </div>
          )}

          {/* 予約一覧カード */}
          <Link
            href="/bookings"
            className="col-span-12 flex items-center gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border hover:ring-accent/30 hover:shadow-md transition-all lg:col-span-6"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold">予約一覧</p>
              <p className="text-sm text-muted">予約の確認・キャンセル</p>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>

          {/* 最近の利用 */}
          {hasRecent && (
            <div className="col-span-12">
              <h3 className="mb-3 text-sm font-semibold text-muted">最近の利用</h3>
              <div className="grid grid-cols-3 gap-4">
                {recentProviders.map((rp) => {
                  const d = new Date(rp.lastDate);
                  const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;
                  return (
                    <Link
                      key={rp.slug}
                      href={`/p/${rp.slug}`}
                      className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border hover:ring-accent/30 hover:shadow-md transition-all"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-sm font-semibold text-slate-400">
                        {rp.icon_url ? (
                          <Image src={rp.icon_url} alt={rp.name} width={44} height={44} className="h-11 w-11 object-cover" />
                        ) : (
                          rp.name[0]
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold truncate">{rp.name}</p>
                        <p className="text-xs text-muted truncate">{dateLabel} {rp.lastService}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function RecentProviderCard({ rp }: { rp: RecentProvider }) {
  const d = new Date(rp.lastDate);
  const dateLabel = `${d.getMonth() + 1}/${d.getDate()}`;
  return (
    <Link
      href={`/p/${rp.slug}`}
      className="flex items-center gap-3.5 rounded-xl bg-background p-3.5 ring-1 ring-border active:scale-[0.99]"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
        {rp.icon_url ? (
          <Image src={rp.icon_url} alt={rp.name} width={36} height={36} className="h-9 w-9 object-cover" />
        ) : (
          rp.name[0]
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{rp.name}</p>
        <p className="text-xs text-muted truncate">{dateLabel} {rp.lastService}</p>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </Link>
  );
}
