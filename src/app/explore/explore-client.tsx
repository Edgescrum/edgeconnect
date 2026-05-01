"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { searchProviders, type ProviderCard } from "@/lib/actions/explore";
import { ProviderAvatar } from "@/components/ProviderAvatar";
import { CategorySelector } from "@/components/CategorySelector";
import type { Category } from "@/lib/constants/categories";
import { SearchIcon, ChevronRightIcon } from "@/components/icons";

export function ExploreClient({
  initialProviders,
  categories,
  initialCategories,
  initialQuery,
}: {
  initialProviders: ProviderCard[];
  categories: Category[];
  initialCategories: string[];
  initialQuery: string | null;
}) {
  const router = useRouter();
  const [providers, setProviders] = useState(initialProviders);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const [query, setQuery] = useState(initialQuery || "");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProviders.length >= 20);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  async function handleFilter(newCategories: string[], newQuery: string) {
    setSelectedCategories(newCategories);
    setLoading(true);
    try {
      const results = await searchProviders(
        newCategories.length > 0 ? newCategories : null,
        newQuery || null,
        0,
        20
      );
      setProviders(results);
      setHasMore(results.length >= 20);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }

    const params = new URLSearchParams();
    newCategories.forEach((c) => params.append("category", c));
    if (newQuery) params.set("q", newQuery);
    const qs = params.toString();
    router.replace(`/explore${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  function handleSearchInput(value: string) {
    setQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      handleFilter(selectedCategories, value);
    }, 400);
  }

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const results = await searchProviders(
        selectedCategories.length > 0 ? selectedCategories : null,
        query || null,
        providers.length,
        20
      );
      setProviders((prev) => [...prev, ...results]);
      setHasMore(results.length >= 20);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, selectedCategories, query, providers.length]);

  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const hasFilters = selectedCategories.length > 0 || query;

  return (
    <div className="w-full min-w-0">
      {/* 検索バー */}
      <div className="relative">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder="屋号やキーワードで検索"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm sm:py-3"
        />
      </div>

      {/* カテゴリ選択 */}
      <div className="mt-3 sm:mt-4">
        <CategorySelector
          categories={categories}
          selected={selectedCategories}
          onChange={(sel) => handleFilter(sel, query)}
          multiple
          placeholder="カテゴリで絞り込み"
        />
      </div>

      {/* 一覧 */}
      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:mt-6 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3">
        {providers.map((p) => (
          <Link
            key={p.slug}
            href={`/p/${p.slug}`}
            className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-sm ring-1 ring-border active:scale-[0.99] sm:gap-3.5 sm:p-4"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl sm:h-12 sm:w-12">
              <ProviderAvatar iconUrl={p.icon_url} name={p.name} size={48} className="rounded-xl" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{p.name}</p>
              {p.category && (
                <span
                  className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: `${p.brand_color || "#f08c79"}1a`,
                    color: p.brand_color || "#f08c79",
                  }}
                >
                  {categories.find((c) => c.value === p.category)?.label || p.category}
                </span>
              )}
              {(p.avg_csat != null && p.review_count != null && p.review_count > 0) && (
                <div className="mt-0.5 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  <span className="text-xs font-medium">{p.avg_csat.toFixed(1)}</span>
                  <span className="text-[10px] text-muted">({p.review_count})</span>
                </div>
              )}
              {p.bio && (
                <p className="mt-0.5 truncate text-xs text-muted">
                  {p.bio.length > 50 ? p.bio.slice(0, 50) + "..." : p.bio}
                </p>
              )}
            </div>
            <ChevronRightIcon className="shrink-0 text-muted" />
          </Link>
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      )}
      {hasMore && !loading && <div ref={sentinelRef} className="h-1" />}

      {!loading && providers.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-3xl">🔍</p>
          <p className="mt-4 font-semibold">
            {hasFilters ? "該当する事業主が見つかりません" : "まだ事業主が登録されていません"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {hasFilters
              ? "条件を変えて再度お試しください"
              : "事業主が登録されるまでお待ちください"}
          </p>
        </div>
      )}
    </div>
  );
}
