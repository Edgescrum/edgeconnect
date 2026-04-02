"use client";

import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/provider/services": "サービスメニュー",
  "/provider/services/new": "メニューを追加",
  "/provider/schedule": "スケジュール設定",
  "/provider/profile": "プロフィール編集",
  "/provider/qrcode": "QRコード",
  "/provider/register": "事業主登録",
  "/provider/bookings": "予約管理",
  "/provider/calendar": "カレンダー連携",
};

export function ProviderHeader() {
  const pathname = usePathname();

  // トップ、ダッシュボード、publicページでは非表示
  if (pathname === "/" || pathname === "/provider" || pathname.startsWith("/p/"))
    return null;

  // 動的ページのタイトル判定
  const isServiceEditPage = /\/provider\/services\/\d+\/edit/.test(pathname);
  const isBookingDetailPage = /\/provider\/bookings\/[a-f0-9-]+/.test(pathname);
  const title = isServiceEditPage
    ? "メニューを編集"
    : isBookingDetailPage
      ? "予約詳細"
      : PAGE_TITLES[pathname] || "";

  if (!title) return null;

  // 戻り先
  const backHref =
    isServiceEditPage || pathname === "/provider/services/new"
      ? "/provider/services"
      : isBookingDetailPage
        ? "/provider/bookings"
        : "/provider";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
        <a
          href={backHref}
          className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-accent-bg"
          aria-label="戻る"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </a>
        <h1 className="text-base font-semibold">{title}</h1>
      </div>
    </header>
  );
}
