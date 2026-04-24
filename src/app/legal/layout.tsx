import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3 sm:px-8">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-accent-bg"
            aria-label="トップへ戻る"
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
          </Link>
          <Link href="/" className="flex items-center">
            <img src="/logo.svg" alt="PeCo" className="h-5" />
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-8">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
