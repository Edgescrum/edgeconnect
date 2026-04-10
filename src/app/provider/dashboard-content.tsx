import Link from "next/link";
import Image from "next/image";

interface Provider {
  slug: string;
  name: string;
  icon_url: string | null;
}

interface Onboarding {
  hasService: boolean;
  hasSchedule: boolean;
  hasProfile: boolean;
}

const onboardingSteps = [
  {
    key: "hasService" as const,
    href: "/provider/services/new",
    title: "サービスメニューを追加",
    desc: "お客さまが予約できるメニューを登録しましょう",
  },
  {
    key: "hasSchedule" as const,
    href: "/provider/schedule",
    title: "営業時間を設定",
    desc: "予約を受け付ける曜日・時間を設定しましょう",
  },
  {
    key: "hasProfile" as const,
    href: "/provider/profile",
    title: "プロフィールを仕上げる",
    desc: "アイコンや紹介文を設定しましょう",
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
];

export function ProviderDashboard({
  provider,
  todayCount = 0,
  weekCount = 0,
  onboarding,
}: {
  provider: Provider;
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
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">管理画面</p>
            <h1 className="text-xl font-bold">{provider.name}</h1>
          </div>
          <Link
            href={`/p/${provider.slug}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white overflow-hidden"
          >
            {provider.icon_url ? (
              <Image
                src={provider.icon_url}
                alt={provider.name}
                width={40}
                height={40}
                className="h-10 w-10 object-cover"
              />
            ) : (
              provider.name[0]
            )}
          </Link>
        </div>

        {/* オンボーディング */}
        {showOnboarding && (
          <div className="mt-5 rounded-2xl bg-accent/5 p-4 ring-1 ring-accent/20">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">はじめの設定</p>
              <span className="text-xs text-muted">
                {completedCount}/{onboardingSteps.length} 完了
              </span>
            </div>
            {/* プログレスバー */}
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
                    className={`flex items-center gap-3 rounded-xl p-3 ${
                      done
                        ? "opacity-50"
                        : "bg-card ring-1 ring-border active:scale-[0.99]"
                    }`}
                  >
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                      done
                        ? "bg-accent text-white"
                        : "ring-2 ring-border"
                    }`}>
                      {done && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${done ? "line-through" : ""}`}>
                        {step.title}
                      </p>
                      {!done && (
                        <p className="text-xs text-muted">{step.desc}</p>
                      )}
                    </div>
                    {!done && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-accent">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    )}
                  </Link>
                );
              })}
              {/* QRコード共有（全ステップ完了後に表示） */}
              {completedCount >= 3 && (
                <Link
                  href="/provider/qrcode"
                  className="flex items-center gap-3 rounded-xl bg-accent p-3 text-white active:scale-[0.99]"
                >
                  <span className="text-lg">📱</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">QRコードをお客さまに共有</p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-70">
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link
            href="/provider/bookings?filter=today"
            className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border active:scale-[0.98]"
          >
            <p className="text-2xl font-bold">{todayCount}</p>
            <p className="text-xs text-muted">今日の予約 →</p>
          </Link>
          <Link
            href="/provider/bookings?filter=week"
            className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border active:scale-[0.98]"
          >
            <p className="text-2xl font-bold">{weekCount}</p>
            <p className="text-xs text-muted">今週の予約 →</p>
          </Link>
        </div>

        {/* Menu */}
        <div className="mt-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            管理メニュー
          </h2>
          <div className="space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-[4.5rem] items-center gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border active:scale-[0.99]"
              >
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-xs text-muted">{item.desc}</p>
                </div>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* Switch to customer */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-muted underline">
            お客さま画面に戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
