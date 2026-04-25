import Link from "next/link";

export function PublicFooter({
  showProviderCta = false,
  maxWidth = "max-w-5xl",
}: {
  showProviderCta?: boolean;
  maxWidth?: string;
}) {
  return (
    <footer className="mt-auto border-t border-border bg-card/60">
      {showProviderCta && (
        <div className="border-b border-border py-6">
          <div className={`mx-auto ${maxWidth} rounded-2xl bg-gradient-to-br from-accent/8 to-accent/4 p-5 px-4 text-center ring-1 ring-accent/10 sm:px-8`}>
            <p className="text-sm font-semibold">
              あなたもPeCoで
              <br />
              予約管理をはじめませんか？
            </p>
            <p className="mt-1.5 text-xs text-muted">
              無料でサービスメニュー・予約ページを作成できます
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-1 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 active:scale-[0.98]"
            >
              詳しく見る
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          </div>
        </div>
      )}
      <div className={`mx-auto ${maxWidth} px-4 py-4 sm:px-8 `}>
        <div className="flex items-center gap-3 text-xs text-muted">
          <img src="/logo.svg" alt="PeCo" className="h-4 sm:h-5" />
          <span className="text-border">|</span>
          <Link href="/" className="hover:text-foreground">PeCoとは</Link>
          <Link href="/explore" className="hover:text-foreground">事業主を探す</Link>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-muted/70">
          <Link href="/legal/terms" className="hover:text-foreground">利用規約</Link>
          <Link href="/legal/privacy" className="hover:text-foreground">プライバシーポリシー</Link>
          <Link href="/legal/commercial" className="hover:text-foreground">特定商取引法</Link>
        </div>
        <p className="mt-2 text-[10px] text-muted/50">&copy; EdgeScrum合同会社</p>
      </div>
    </footer>
  );
}
