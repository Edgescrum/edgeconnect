"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const PAGE_TITLES: Record<string, string> = {
  "/provider/services": "サービスメニュー",
  "/provider/services/new": "メニューを追加",
  "/provider/schedule": "スケジュール設定",
  "/provider/profile": "プロフィール編集",
  "/provider/qrcode": "QRコード",
  "/provider/register": "事業主登録",
  "/provider/bookings": "予約管理",
  "/provider/calendar": "カレンダー連携",
  "/provider/billing": "プラン管理",
  "/provider/customers": "顧客管理",
  "/provider/reviews": "口コミ管理",
  "/provider/analytics": "実績分析",
};

export function ProviderNav() {
  const pathname = usePathname();

  // ダッシュボードでは非表示
  if (pathname === "/provider") return null;
  // ウィザード（登録画面）ではモバイルナビも非表示にする（専用UIを使用）
  if (pathname === "/provider/register") return null;

  const isServiceEditPage = /\/provider\/services\/\d+\/edit/.test(pathname);
  const isBookingDetailPage = /\/provider\/bookings\/[a-f0-9-]+/.test(pathname);
  const isCustomerDetailPage = /\/provider\/customers\/\d+/.test(pathname);
  const title = isServiceEditPage
    ? "メニューを編集"
    : isBookingDetailPage
      ? "予約詳細"
      : isCustomerDetailPage
        ? "顧客詳細"
        : PAGE_TITLES[pathname] || "";

  if (!title) return null;

  const backHref =
    isServiceEditPage || pathname === "/provider/services/new"
      ? "/provider/services"
      : isBookingDetailPage
        ? "/provider/bookings"
        : isCustomerDetailPage
          ? "/provider/customers"
          : "/provider";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg sm:hidden">
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
        <Link
          href={backHref}
          className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-accent-bg"
          aria-label="戻る"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </Link>
        <h1 className="text-base font-semibold">{title}</h1>
      </div>
    </header>
  );
}
