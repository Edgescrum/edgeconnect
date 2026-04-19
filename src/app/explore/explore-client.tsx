"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { searchProviders, type ProviderCard } from "@/lib/actions/explore";

interface Category {
  value: string;
  label: string;
}

export function ExploreClient({
  initialProviders,
  categories,
  initialCategory,
  initialQuery,
}: {
  initialProviders: ProviderCard[];
  categories: Category[];
  initialCategory: string | null;
  initialQuery: string | null;
}) {
  const router = useRouter();
  const [providers, setProviders] = useState(initialProviders);
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery || "");
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialProviders.length >= 20);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // カテゴリ or 検索が変わったらリセット
  async function handleFilter(newCategory: string | null, newQuery: string) {
    setCategory(newCategory);
    setLoading(true);
    try {
      const results = await searchProviders(newCategory, newQuery || null, 0, 20);
      setProviders(results);
      setHasMore(results.length >= 20);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }

    // URLを更新（ブラウザバック対応）
    const params = new URLSearchParams();
    if (newCategory) params.set("category", newCategory);
    if (newQuery) params.set("q", newQuery);
    const qs = params.toString();
    router.replace(`/explore${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  function handleCategoryClick(value: string | null) {
    handleFilter(value === category ? null : value, query);
  }

  function handleSearchInput(value: string) {
    setQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      handleFilter(category, value);
    }, 400);
  }

  // 無限スクロール
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const results = await searchProviders(category, query || null, providers.length, 20);
      setProviders((prev) => [...prev, ...results]);
      setHasMore(results.length >= 20);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, category, query, providers.length]);

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

  return (
    <div>
      {/* 検索バー */}
      <div className="relative">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder="屋号やキーワードで検索"
          className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm"
        />
      </div>

      {/* カテゴリチップ */}
      <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        <button
          onClick={() => handleCategoryClick(null)}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
            !category
              ? "bg-accent text-white"
              : "bg-card ring-1 ring-border text-muted"
          }`}
        >
          すべて
        </button>
        {categories.map((c) => (
          <button
            key={c.value}
            onClick={() => handleCategoryClick(c.value)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              category === c.value
                ? "bg-accent text-white"
                : "bg-card ring-1 ring-border text-muted"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 一覧 */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((p) => (
          <Link
            key={p.slug}
            href={`/p/${p.slug}`}
            className="flex items-center gap-3.5 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border active:scale-[0.99]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-lg font-semibold text-slate-400">
              {p.icon_url ? (
                <img
                  src={p.icon_url}
                  alt={p.name || ""}
                  className="h-12 w-12 object-cover"
                />
              ) : (
                (p.name || "?")[0]
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{p.name}</p>
              {p.category && (
                <span
                  className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                  style={{
                    backgroundColor: `${p.brand_color || "#6366f1"}1a`,
                    color: p.brand_color || "#6366f1",
                  }}
                >
                  {categories.find((c) => c.value === p.category)?.label || p.category}
                </span>
              )}
              {p.bio && (
                <p className="mt-1 truncate text-xs text-muted">
                  {p.bio.length > 50 ? p.bio.slice(0, 50) + "..." : p.bio}
                </p>
              )}
            </div>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="shrink-0 text-muted"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </Link>
        ))}
      </div>

      {/* ローディング / 無限スクロールセンチネル */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      )}
      {hasMore && !loading && <div ref={sentinelRef} className="h-1" />}

      {/* Empty State */}
      {!loading && providers.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-3xl">🔍</p>
          <p className="mt-4 font-semibold">
            {query || category ? "該当する事業主が見つかりません" : "まだ事業主が登録されていません"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {query || category
              ? "条件を変えて再度お試しください"
              : "事業主が登録されるまでお待ちください"}
          </p>
        </div>
      )}
    </div>
  );
}
