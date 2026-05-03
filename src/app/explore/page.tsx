import type { Metadata } from "next";
import { searchProviders } from "@/lib/actions/explore";
import { getCategories } from "@/lib/constants/categories";
import { ExploreClient } from "./explore-client";
import { PublicLayout } from "@/components/PublicLayout";

export const metadata: Metadata = {
  title: "事業主を探す",
  description: "PeCoで予約できる事業主の一覧。カテゴリや検索で探せます。",
  openGraph: {
    title: "事業主を探す - PeCo",
    description: "PeCoで予約できる事業主の一覧",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string | string[]; q?: string; prefecture?: string }>;
}) {
  const { category, q, prefecture } = await searchParams;
  const categoryArr = category ? (Array.isArray(category) ? category : [category]) : [];
  const providers = await searchProviders(categoryArr.length > 0 ? categoryArr : null, q || null, 0, 20, prefecture || null);

  return (
    <PublicLayout backHref="/" title="事業主を探す">
      <ExploreClient
        initialProviders={providers}
        categories={await getCategories()}
        initialCategories={categoryArr}
        initialQuery={q || null}
        initialPrefecture={prefecture || null}
      />
    </PublicLayout>
  );
}
