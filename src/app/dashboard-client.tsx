"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

import type { ProviderBase } from "@/lib/types/provider";
import { GearIcon, SearchIcon, CalendarIcon, ChevronRightIcon, HeartIcon } from "@/components/icons";
import { ProviderAvatar } from "@/components/ProviderAvatar";
import { ProfilePromptModal } from "@/components/ProfilePromptModal";

interface RecentProvider extends ProviderBase {
  lastService: string;
  lastDate: string;
}

interface UserStats {
  todayBookings: number;
  upcomingBookings: number;
}

const PROVIDER_CTA_DISMISSED_KEY = "peco_provider_cta_dismissed";

export function DashboardClient({
  role,
  provider,
  recentProviders,
  pendingSurveyCount = 0,
  showProfileModal = false,
  stats = { todayBookings: 0, upcomingBookings: 0 },
}: {
  role: string;
  provider: ProviderBase | null;
  recentProviders: RecentProvider[];
  pendingSurveyCount?: number;
  showAttributePrompt?: boolean;
  showProfileModal?: boolean;
  stats?: UserStats;
}) {
  const isProvider = role === "provider";
  const hasRecent = recentProviders.length > 0;
  const [providerCtaDismissed, setProviderCtaDismissed] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem(PROVIDER_CTA_DISMISSED_KEY);
    setProviderCtaDismissed(!!dismissed);
  }, []);

  function dismissProviderCta() {
    localStorage.setItem(PROVIDER_CTA_DISMISSED_KEY, "1");
    setProviderCtaDismissed(true);
  }

  return (
    <>
      {/* Profile prompt modal for first-time users */}
      {showProfileModal && <ProfilePromptModal />}

      {/* --- モバイル版 --- */}
      <div className="sm:hidden">
        <div>
          {/* ヒーローバナー */}
          <div className="relative overflow-hidden bg-gradient-to-br from-accent via-accent-light to-accent px-5 pb-6 pt-5 text-white">
            {/* 背景装飾 */}
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-12 -left-6 h-36 w-36 rounded-full bg-white/5" />
            {/* 設定アイコン */}
            <Link href="/settings" className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 active:bg-white/30">
              <GearIcon className="text-white" />
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
                  <SearchIcon size={14} />
                  事業主を探す
                </Link>
              </div>
            </div>
          </div>

          {/* Stats cards */}
          <div className="mx-4 mt-4 grid grid-cols-2 gap-2">
            <Link
              href="/bookings?filter=today"
              className="rounded-xl bg-card p-3 text-center ring-1 ring-border active:scale-[0.98]"
            >
              <p className="text-xl font-bold text-accent">{stats.todayBookings}</p>
              <p className="text-[10px] text-muted">今日の予約</p>
            </Link>
            <Link
              href="/bookings?filter=upcoming"
              className="rounded-xl bg-card p-3 text-center ring-1 ring-border active:scale-[0.98]"
            >
              <p className="text-xl font-bold text-accent">{stats.upcomingBookings}</p>
              <p className="text-[10px] text-muted">今後の予約</p>
            </Link>
          </div>

          {!isProvider && !providerCtaDismissed && (
            <div className="relative mx-4 mt-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 p-4 text-white shadow">
              <button
                onClick={dismissProviderCta}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white/80 active:bg-white/30"
                aria-label="閉じる"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
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
                <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl">
                  <ProviderAvatar iconUrl={provider?.icon_url} name={provider?.name} size={44} className="rounded-xl" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{provider?.name || "管理画面"}</p>
                  <p className="text-xs text-muted">予約・メニュー・スケジュールを管理</p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-bg">
                  <ChevronRightIcon className="text-accent" />
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
                  <CalendarIcon className="text-accent" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">予約一覧</p>
                  <p className="text-xs text-muted">予約の確認・キャンセル</p>
                </div>
                <ChevronRightIcon className="text-muted" />
              </Link>

              <Link
                href="/favorites"
                className="flex items-center gap-3.5 rounded-xl bg-background p-3.5 ring-1 ring-border active:scale-[0.99]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pink-50">
                  <HeartIcon size={18} filled className="text-pink-500" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">お気に入り</p>
                  <p className="text-xs text-muted">お気に入りの事業主一覧</p>
                </div>
                <ChevronRightIcon className="text-muted" />
              </Link>

              <Link
                href="/surveys"
                className="flex items-center gap-3.5 rounded-xl bg-background p-3.5 ring-1 ring-border active:scale-[0.99]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500">
                    <path d="M9 11l3 3L22 4" />
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">アンケート</p>
                  <p className="text-xs text-muted">サービスの感想を回答</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {pendingSurveyCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                      {pendingSurveyCount}
                    </span>
                  )}
                  <ChevronRightIcon className="text-muted" />
                </div>
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
            <GearIcon size={18} className="text-white" />
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
                  <SearchIcon />
                  事業主を探す
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
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl">
                <ProviderAvatar iconUrl={provider?.icon_url} name={provider?.name} size={56} className="rounded-2xl" />
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
              <ChevronRightIcon size={20} className="shrink-0 text-muted" />
            </Link>
          )}

          {/* Stats cards */}
          <div className="col-span-12 grid grid-cols-2 gap-4 lg:col-span-6">
            <Link
              href="/bookings?filter=today"
              className="rounded-2xl bg-card p-4 text-center ring-1 ring-border shadow-sm hover:ring-accent/30 hover:shadow-md transition-all"
            >
              <p className="text-2xl font-bold text-accent">{stats.todayBookings}</p>
              <p className="mt-1 text-xs text-muted">今日の予約</p>
            </Link>
            <Link
              href="/bookings?filter=upcoming"
              className="rounded-2xl bg-card p-4 text-center ring-1 ring-border shadow-sm hover:ring-accent/30 hover:shadow-md transition-all"
            >
              <p className="text-2xl font-bold text-accent">{stats.upcomingBookings}</p>
              <p className="mt-1 text-xs text-muted">今後の予約</p>
            </Link>
          </div>

          {/* 事業主CTAカード（事業主でない場合） */}
          {!isProvider && !providerCtaDismissed && (
            <div className="relative col-span-12 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 p-6 text-white shadow-lg lg:col-span-6">
              <button
                onClick={dismissProviderCta}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white/80 hover:bg-white/30 transition-colors"
                aria-label="閉じる"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
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
            className="col-span-12 flex items-center gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border hover:ring-accent/30 hover:shadow-md transition-all lg:col-span-4"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <CalendarIcon size={24} className="text-accent" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">予約一覧</p>
              <p className="text-sm text-muted">予約の確認・キャンセル</p>
            </div>
            <ChevronRightIcon size={16} className="text-muted" />
          </Link>

          {/* お気に入りカード */}
          <Link
            href="/favorites"
            className="col-span-12 flex items-center gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border hover:ring-accent/30 hover:shadow-md transition-all lg:col-span-4"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-pink-50">
              <HeartIcon size={24} filled className="text-pink-500" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">お気に入り</p>
              <p className="text-sm text-muted">お気に入りの事業主一覧</p>
            </div>
            <ChevronRightIcon size={16} className="text-muted" />
          </Link>

          {/* アンケートカード */}
          <Link
            href="/surveys"
            className="col-span-12 flex items-center gap-4 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border hover:ring-accent/30 hover:shadow-md transition-all lg:col-span-4"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-500">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold">アンケート</p>
              <p className="text-sm text-muted">サービスの感想を回答</p>
            </div>
            <div className="flex items-center gap-2">
              {pendingSurveyCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                  {pendingSurveyCount}
                </span>
              )}
              <ChevronRightIcon size={16} className="text-muted" />
            </div>
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
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                        <ProviderAvatar iconUrl={rp.icon_url} name={rp.name} size={44} className="rounded-xl" />
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
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full">
        <ProviderAvatar iconUrl={rp.icon_url} name={rp.name} size={36} className="rounded-full" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{rp.name}</p>
        <p className="text-xs text-muted truncate">{dateLabel} {rp.lastService}</p>
      </div>
      <ChevronRightIcon className="shrink-0 text-muted" />
    </Link>
  );
}
