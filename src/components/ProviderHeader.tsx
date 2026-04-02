"use client";

import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  "/provider/services": "サービスメニュー",
  "/provider/services/new": "メニューを追加",
  "/provider/schedule": "スケジュール設定",
  "/provider/profile": "プロフィール編集",
  "/provider/qrcode": "QRコード",
};

export function ProviderHeader() {
  const pathname = usePathname();

  // ダッシュボードとpublicページでは非表示
  if (pathname === "/" || pathname.startsWith("/p/")) return null;

  // 編集ページ（/provider/services/123/edit）
  const isEditPage = /\/provider\/services\/\d+\/edit/.test(pathname);
  const title = isEditPage
    ? "メニューを編集"
    : PAGE_TITLES[pathname] || "";

  if (!title) return null;

  // 戻り先の判定
  const backHref = isEditPage || pathname === "/provider/services/new"
    ? "/provider/services"
    : "/";

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
