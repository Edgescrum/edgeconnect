import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";

/**
 * 公開ページ共通レイアウト
 * ヘッダー（sticky）+ コンテンツ + フッターの幅を統一する
 *
 * パターン:
 *   "wide"  — max-w-5xl（LP、探す、一覧系）
 *   "narrow" — max-w-2xl（法的文書、読み物系）
 */
type LayoutWidth = "wide" | "narrow";

const widthClass: Record<LayoutWidth, string> = {
  wide: "max-w-5xl",
  narrow: "max-w-2xl",
};

export function PublicLayout({
  children,
  width = "wide",
  backHref,
  title,
  headerRight,
  showFooterProviderCta = false,
}: {
  children: React.ReactNode;
  width?: LayoutWidth;
  backHref?: string;
  title?: string;
  headerRight?: React.ReactNode;
  showFooterProviderCta?: boolean;
}) {
  const w = widthClass[width];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className={`mx-auto flex ${w} items-center justify-between px-4 py-3 sm:px-8`}>
          <div className="flex items-center gap-3">
            {backHref && (
              <Link
                href={backHref}
                className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-accent-bg"
                aria-label="戻る"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </Link>
            )}
            {title ? (
              <h1 className="text-base font-semibold">{title}</h1>
            ) : (
              <Link href="/">
                <img src="/logo.svg" alt="PeCo" className="h-5 sm:h-6" />
              </Link>
            )}
          </div>
          {headerRight && <div className="flex items-center gap-4">{headerRight}</div>}
        </div>
      </header>
      <main className={`mx-auto w-full ${w} flex-1 px-4 py-6 sm:px-8 sm:py-8`}>
        {children}
      </main>
      <PublicFooter maxWidth={w} showProviderCta={showFooterProviderCta} />
    </div>
  );
}
