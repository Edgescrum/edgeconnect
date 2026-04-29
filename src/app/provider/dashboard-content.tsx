import Link from "next/link";
import type { ProviderBase } from "@/lib/types/provider";
import { RegisterCompleteModal } from "@/components/RegisterCompleteModal";
import { ProviderAvatar } from "@/components/ProviderAvatar";

interface Onboarding {
  hasService: boolean;
  hasProfile: boolean;
  hasSchedule: boolean;
  hasQrcode: boolean;
}

const onboardingSteps = [
  {
    key: "hasService" as const,
    href: "/provider/services/new",
    title: "サービスメニューを追加",
    desc: "お客さまが予約できるメニューを登録しましょう",
  },
  {
    key: "hasProfile" as const,
    href: "/provider/profile",
    title: "プロフィールを設定",
    desc: "連絡先・アイコン・紹介文を設定しましょう",
  },
  {
    key: "hasSchedule" as const,
    href: "/provider/schedule",
    title: "営業時間を設定",
    desc: "予約を受け付ける曜日・時間を設定しましょう",
  },
  {
    key: "hasQrcode" as const,
    href: "/provider/qrcode",
    title: "QRコードを確認",
    desc: "お客さまに共有するQRコードを確認しましょう",
  },
];

const menuItems = [
  {
    href: "/provider/bookings",
    icon: "📅",
    title: "予約管理",
    desc: "予約の確認・キャンセル",
  },
  {
    href: "/provider/services",
    icon: "📋",
    title: "サービスメニュー",
    desc: "メニューの追加・編集・公開設定",
  },
  {
    href: "/provider/schedule",
    icon: "🕐",
    title: "スケジュール設定",
    desc: "営業時間・定休日・インターバル",
  },
  {
    href: "/provider/profile",
    icon: "✏️",
    title: "プロフィール編集",
    desc: "名前・紹介文・アイコンを変更",
  },
  {
    href: "/provider/calendar",
    icon: "📆",
    title: "カレンダー連携",
    desc: "Google・Appleカレンダーと同期",
  },
  {
    href: "/provider/qrcode",
    icon: "📱",
    title: "QRコード",
    desc: "お客さまに共有するQRコード",
  },
  {
    href: "/provider/billing",
    icon: "💳",
    title: "プラン管理",
    desc: "プランの確認・変更・解約",
  },
];

export function ProviderDashboard({
  provider,
  todayCount = 0,
  weekCount = 0,
  onboarding,
}: {
  provider: ProviderBase;
  todayCount?: number;
  weekCount?: number;
  onboarding?: Onboarding;
}) {
  const completedCount = onboarding
    ? onboardingSteps.filter((s) => onboarding[s.key]).length
    : onboardingSteps.length;
  const allDone = completedCount === onboardingSteps.length;
  const showOnboarding = onboarding && !allDone;

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-8 sm:py-8">
      <RegisterCompleteModal />
      {/* --- モバイル版 --- */}
      <div className="mx-auto max-w-lg sm:hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">管理画面</p>
            <h1 className="text-xl font-bold">{provider.name}</h1>
          </div>
          <Link
            href={`/p/${provider.slug}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden"
          >
            <ProviderAvatar iconUrl={provider.icon_url} name={provider.name} size={40} className="rounded-xl" />
          </Link>
        </div>

        <MobileOnboarding showOnboarding={showOnboarding} onboarding={onboarding} completedCount={completedCount} />

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <StatCard href="/provider/bookings?filter=today" value={todayCount} label="今日の予約" />
          <StatCard href="/provider/bookings?filter=week" value={weekCount} label="今週の予約" />
        </div>

        {/* Menu */}
        <div className="mt-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">管理メニュー</h2>
          <div className="space-y-2">
            {menuItems.map((item) => (
              <MenuCard key={item.href} {...item} />
            ))}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/home" className="text-sm text-muted underline">お客さま画面に戻る</Link>
        </div>
      </div>

      {/* --- PC版 --- */}
      <div className="mx-auto hidden max-w-5xl sm:block">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">ダッシュボード</h1>
            <p className="mt-1 text-sm text-muted">{provider.name} の管理画面</p>
          </div>
          <Link
            href={`/p/${provider.slug}`}
            className="flex items-center gap-3 rounded-xl bg-card px-4 py-2.5 ring-1 ring-border hover:bg-background"
          >
            <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg">
              <ProviderAvatar iconUrl={provider.icon_url} name={provider.name} size={32} className="rounded-lg" />
            </div>
            <span className="text-sm font-medium">公開ページを見る</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </Link>
        </div>

        {/* Stats + Onboarding row */}
        <div className="mt-8 grid grid-cols-12 gap-6">
          {/* Left: Stats */}
          <div className={showOnboarding ? "col-span-7" : "col-span-12"}>
            {/* Stats cards */}
            <div className="grid grid-cols-2 gap-4">
              <Link
                href="/provider/bookings?filter=today"
                className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border hover:ring-accent/30 transition-all"
              >
                <p className="text-sm text-muted">今日の予約</p>
                <p className="mt-2 text-4xl font-bold">{todayCount}</p>
                <p className="mt-1 text-xs text-accent">詳細を見る →</p>
              </Link>
              <Link
                href="/provider/bookings?filter=week"
                className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-border hover:ring-accent/30 transition-all"
              >
                <p className="text-sm text-muted">今週の予約</p>
                <p className="mt-2 text-4xl font-bold">{weekCount}</p>
                <p className="mt-1 text-xs text-accent">詳細を見る →</p>
              </Link>
            </div>

            {/* Quick actions */}
            <div className="mt-6">
              <h2 className="mb-4 text-sm font-semibold text-muted">クイックアクション</h2>
              <div className="grid grid-cols-3 gap-3">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex flex-col items-center rounded-2xl bg-card p-5 text-center shadow-sm ring-1 ring-border hover:ring-accent/30 hover:shadow-md transition-all"
                  >
                    <span className="text-3xl">{item.icon}</span>
                    <p className="mt-2 text-sm font-semibold">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted">{item.desc}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Onboarding */}
          {showOnboarding && (
            <div className="col-span-5">
              <div className="rounded-2xl bg-accent/5 p-6 ring-1 ring-accent/20">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">はじめの設定</p>
                  <span className="text-sm text-muted">{completedCount}/{onboardingSteps.length}</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${(completedCount / onboardingSteps.length) * 100}%` }}
                  />
                </div>
                <div className="mt-4 space-y-2">
                  {onboardingSteps.map((step) => {
                    const done = onboarding[step.key];
                    return (
                      <Link
                        key={step.key}
                        href={done ? "#" : step.href}
                        className={`flex items-center gap-3 rounded-xl p-3 ${
                          done ? "opacity-50" : "bg-card ring-1 ring-border hover:ring-accent/30"
                        }`}
                      >
                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                          done ? "bg-accent text-white" : "ring-2 ring-border"
                        }`}>
                          {done && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M20 6 9 17l-5-5" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${done ? "line-through" : ""}`}>{step.title}</p>
                          {!done && <p className="text-xs text-muted">{step.desc}</p>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/* --- 共通サブコンポーネント --- */

function StatCard({ href, value, label }: { href: string; value: number; label: string }) {
  return (
    <Link href={href} className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border active:scale-[0.98]">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted">{label} →</p>
    </Link>
  );
}

function MenuCard({ href, icon, title, desc }: { href: string; icon: string; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="flex min-h-[4.5rem] items-center gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border active:scale-[0.99]"
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <p className="font-semibold">{title}</p>
        <p className="text-xs text-muted">{desc}</p>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </Link>
  );
}

function MobileOnboarding({
  showOnboarding,
  onboarding,
  completedCount,
}: {
  showOnboarding: boolean | undefined;
  onboarding: Onboarding | undefined;
  completedCount: number;
}) {
  if (!showOnboarding || !onboarding) return null;
  return (
    <div className="mt-5 rounded-2xl bg-accent/5 p-4 ring-1 ring-accent/20">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">はじめの設定</p>
        <span className="text-xs text-muted">{completedCount}/{onboardingSteps.length} 完了</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${(completedCount / onboardingSteps.length) * 100}%` }}
        />
      </div>
      <div className="mt-3 space-y-2">
        {onboardingSteps.map((step) => {
          const done = onboarding[step.key];
          return (
            <Link
              key={step.key}
              href={done ? "#" : step.href}
              className={`flex items-center gap-3 rounded-xl p-3 ${done ? "opacity-50" : "bg-card ring-1 ring-border active:scale-[0.99]"}`}
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${done ? "bg-accent text-white" : "ring-2 ring-border"}`}>
                {done && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${done ? "line-through" : ""}`}>{step.title}</p>
                {!done && <p className="text-xs text-muted">{step.desc}</p>}
              </div>
              {!done && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-accent">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
