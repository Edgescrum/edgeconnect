"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/provider", icon: "🏠", label: "ダッシュボード" },
  { href: "/provider/bookings", icon: "📅", label: "予約管理" },
  { href: "/provider/services", icon: "📋", label: "サービスメニュー" },
  { href: "/provider/schedule", icon: "🕐", label: "スケジュール" },
  { href: "/provider/customers", icon: "👥", label: "顧客管理" },
  { href: "/provider/reviews", icon: "⭐", label: "口コミ管理" },
  { href: "/provider/survey-settings", icon: "📝", label: "アンケート設問" },
  { href: "/provider/analytics", icon: "📊", label: "分析" },
  { href: "/provider/profile", icon: "✏️", label: "プロフィール" },
  { href: "/provider/calendar", icon: "📆", label: "カレンダー連携" },
  { href: "/provider/qrcode", icon: "📱", label: "QRコード" },
  { href: "/provider/billing", icon: "💳", label: "プラン管理" },
];

export function ProviderSidebar() {
  const pathname = usePathname();

  // ウィザード（登録画面）ではサイドバーを非表示にする
  if (pathname === "/provider/register") return null;

  function isActive(href: string) {
    if (href === "/provider") return pathname === "/provider";
    return pathname.startsWith(href);
  }

  return (
    <aside className="hidden sm:flex sm:w-56 sm:shrink-0 sm:flex-col sm:border-r sm:border-border sm:bg-card/60 lg:w-64">
      {/* ロゴ */}
      <div className="flex items-center gap-2 px-5 py-4">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="PeCo" className="h-6" />
        </Link>
      </div>

      {/* ナビゲーション */}
      <nav className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isActive(item.href)
                    ? "bg-accent/10 font-semibold text-accent"
                    : "text-muted hover:bg-background hover:text-foreground"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* フッター */}
      <div className="border-t border-border px-5 py-3">
        <Link href="/home" className="text-xs text-muted hover:text-foreground">
          お客さま画面に戻る
        </Link>
      </div>
    </aside>
  );
}
