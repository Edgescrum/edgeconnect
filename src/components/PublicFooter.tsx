import Link from "next/link";

export function PublicFooter({
  showProviderCta = false,
  maxWidth = "max-w-lg",
}: {
  showProviderCta?: boolean;
  maxWidth?: string;
}) {
  return (
    <footer className="mt-auto border-t border-border bg-card/60">
      {showProviderCta && (
        <div className="border-b border-border px-4 py-6">
          <div className={`mx-auto ${maxWidth} rounded-2xl bg-gradient-to-br from-accent/8 to-accent/4 p-5 text-center ring-1 ring-accent/10`}>
            <p className="text-sm font-semibold">
              あなたもPeCoで
              <br />
              予約管理をはじめませんか？
            </p>
            <p className="mt-1.5 text-xs text-muted">
              無料でサービスメニュー・予約ページを作成できます
            </p>
            <Link
              href="/about"
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
      <div className={`mx-auto ${maxWidth} px-4 py-8`}>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-[10px] font-bold text-white">
            P
          </div>
          <span className="text-sm font-bold">PeCo</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
          <Link href="/about" className="hover:text-foreground">
            PeCoとは
          </Link>
          <Link href="/explore" className="hover:text-foreground">
            事業主を探す
          </Link>
        </div>
        <p className="mt-6 text-xs text-muted/60">&copy; Edgescrum</p>
      </div>
    </footer>
  );
}
