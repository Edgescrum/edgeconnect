"use client";

interface Provider {
  slug: string;
  name: string;
  icon_url: string | null;
}

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
}: {
  provider: Provider;
  todayCount?: number;
  weekCount?: number;
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted">管理画面</p>
            <h1 className="text-xl font-bold">{provider.name}</h1>
          </div>
          <a
            href={`/p/${provider.slug}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-sm font-bold text-white"
          >
            {provider.name[0]}
          </a>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
            <p className="text-2xl font-bold">{todayCount}</p>
            <p className="text-xs text-muted">今日の予約</p>
          </div>
          <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
            <p className="text-2xl font-bold">{weekCount}</p>
            <p className="text-xs text-muted">今週の予約</p>
          </div>
        </div>

        {/* Menu */}
        <div className="mt-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            管理メニュー
          </h2>
          <div className="space-y-2">
            {menuItems.map((item) => (
              <a
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
              </a>
            ))}
          </div>
        </div>

        {/* Switch to customer */}
        <div className="mt-6 text-center">
          <a href="/" className="text-sm text-muted underline">
            お客さま画面に戻る
          </a>
        </div>
      </div>
    </main>
  );
}
