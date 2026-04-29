"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { FavoriteItem } from "@/lib/actions/favorite";
import { ProviderAvatar } from "@/components/ProviderAvatar";
import { toggleFavorite } from "@/lib/actions/favorite";
import type { Category } from "@/lib/constants/categories";
import { CategorySelector } from "@/components/CategorySelector";
import { SearchIcon } from "@/components/icons";
import { Spinner } from "@/components/Spinner";

export function FavoritesClient({
  initialFavorites,
  categories,
}: {
  initialFavorites: FavoriteItem[];
  categories: Category[];
}) {
  const [favorites, setFavorites] = useState(initialFavorites);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = favorites.filter((f) => {
    const matchesCategory =
      selectedCategory.length === 0 ||
      selectedCategory.includes(f.provider.category || "");
    const matchesQuery =
      !query ||
      f.provider.name.toLowerCase().includes(query.toLowerCase()) ||
      (f.provider.bio || "").toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  function handleRemove(providerId: number, favoriteId: number) {
    setRemovingId(favoriteId);
    startTransition(async () => {
      const result = await toggleFavorite(providerId);
      if (result.success && !result.isFavorited) {
        setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
      }
      setRemovingId(null);
    });
  }

  return (
    <div className="w-full min-w-0">
      <p className="text-sm text-muted">
        {favorites.length}件のお気に入り
      </p>

      {/* 検索バー */}
      <div className="relative mt-4">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="屋号やキーワードで検索"
          className="w-full rounded-xl border border-border bg-card py-2.5 pl-10 pr-4 text-sm sm:py-3"
        />
      </div>

      {/* カテゴリ選択 */}
      {categories.length > 0 && (
        <div className="mt-3 sm:mt-4">
          <CategorySelector
            categories={categories}
            selected={selectedCategory}
            onChange={setSelectedCategory}
            multiple
            placeholder="カテゴリで絞り込み"
          />
        </div>
      )}

      {/* 一覧 */}
      {filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState hasFilter={selectedCategory.length > 0 || !!query} />
        </div>
      ) : (
        <>
          {/* モバイル版 */}
          <div className="mt-4 space-y-2 sm:hidden">
            {filtered.map((fav) => (
              <FavoriteCard
                key={fav.id}
                favorite={fav}
                onRemove={() => handleRemove(fav.provider.id, fav.id)}
                isRemoving={removingId === fav.id}
              />
            ))}
          </div>
          {/* PC版 */}
          <div className="mt-6 hidden grid-cols-2 gap-4 sm:grid lg:grid-cols-3">
            {filtered.map((fav) => (
              <FavoriteCardPC
                key={fav.id}
                favorite={fav}
                onRemove={() => handleRemove(fav.provider.id, fav.id)}
                isRemoving={removingId === fav.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* --- サブコンポーネント --- */

function FavoriteCard({
  favorite,
  onRemove,
  isRemoving,
}: {
  favorite: FavoriteItem;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const { provider, lastBookingDate } = favorite;
  const lastDate = lastBookingDate
    ? (() => {
        const d = new Date(lastBookingDate);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      })()
    : null;

  return (
    <div className="flex items-center gap-3.5 rounded-xl bg-card p-3.5 ring-1 ring-border">
      <Link href={`/p/${provider.slug}`} className="flex flex-1 items-center gap-3.5 min-w-0">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl">
          <ProviderAvatar iconUrl={provider.icon_url} name={provider.name} size={48} className="rounded-xl" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{provider.name}</p>
          {provider.bio && (
            <p className="text-xs text-muted truncate">{provider.bio}</p>
          )}
          {lastDate && (
            <p className="text-xs text-muted">最終予約: {lastDate}</p>
          )}
        </div>
      </Link>
      <button
        onClick={onRemove}
        disabled={isRemoving}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 active:scale-95 disabled:opacity-50"
        aria-label="お気に入りから削除"
      >
        {isRemoving ? (
          <Spinner size="sm" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        )}
      </button>
    </div>
  );
}

function FavoriteCardPC({
  favorite,
  onRemove,
  isRemoving,
}: {
  favorite: FavoriteItem;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const { provider, lastBookingDate } = favorite;
  const lastDate = lastBookingDate
    ? (() => {
        const d = new Date(lastBookingDate);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      })()
    : null;

  return (
    <div className="rounded-2xl bg-card p-5 shadow-sm ring-1 ring-border hover:ring-accent/30 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <Link href={`/p/${provider.slug}`} className="flex items-center gap-3.5 min-w-0 flex-1">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl">
            <ProviderAvatar iconUrl={provider.icon_url} name={provider.name} size={56} className="rounded-2xl" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate">{provider.name}</p>
            {provider.bio && (
              <p className="mt-0.5 text-xs text-muted line-clamp-2">{provider.bio}</p>
            )}
          </div>
        </Link>
        <button
          onClick={onRemove}
          disabled={isRemoving}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 active:scale-95 disabled:opacity-50"
          aria-label="お気に入りから削除"
        >
          {isRemoving ? (
            <Spinner size="sm" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          )}
        </button>
      </div>
      {lastDate && (
        <p className="mt-3 text-xs text-muted">最終予約: {lastDate}</p>
      )}
    </div>
  );
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </div>
      <p className="mt-4 font-semibold text-muted">
        {hasFilter
          ? "この条件のお気に入りはありません"
          : "お気に入りはまだありません"}
      </p>
      <p className="mt-1 text-sm text-muted">
        {hasFilter
          ? "フィルタを変更してみてください"
          : "事業主ページのハートアイコンから追加できます"}
      </p>
      {!hasFilter && (
        <Link
          href="/explore"
          className="mt-6 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white shadow active:scale-[0.98]"
        >
          事業主を探す
        </Link>
      )}
    </div>
  );
}
