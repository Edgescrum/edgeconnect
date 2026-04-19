import type { Metadata } from "next";
import { searchProviders } from "@/lib/actions/explore";
import { PROVIDER_CATEGORIES } from "@/lib/constants/categories";
import { ExploreClient } from "./explore-client";
import { PublicFooter } from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: "事業主を探す",
  description: "EdgeConnectで予約できる事業主の一覧。カテゴリや検索で探せます。",
  openGraph: {
    title: "事業主を探す - EdgeConnect",
    description: "EdgeConnectで予約できる事業主の一覧",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const providers = await searchProviders(category || null, q || null, 0, 20);

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-8">
          <a href="/" className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-accent-bg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </a>
          <h1 className="text-base font-semibold">事業主を探す</h1>
        </div>
      </header>

      <div className="mx-auto max-w-5xl flex-1 px-4 py-6 sm:px-8">
        <ExploreClient
          initialProviders={providers}
          categories={PROVIDER_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))}
          initialCategory={category || null}
          initialQuery={q || null}
        />
      </div>

      <PublicFooter maxWidth="max-w-5xl" />
    </main>
  );
}
