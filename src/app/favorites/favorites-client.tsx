"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import type { FavoriteItem } from "@/lib/actions/favorite";
import { toggleFavorite } from "@/lib/actions/favorite";
import type { Category } from "@/lib/constants/categories";
import { CategorySelector } from "@/components/CategorySelector";
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
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = selectedCategory.length > 0
    ? favorites.filter((f) => selectedCategory.includes(f.provider.category || ""))
    : favorites;

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
    <div>
      <p className="text-sm text-muted sm:hidden">
        {favorites.length}件のお気に入り
      </p>

      {/* PC版 件数 */}
      <div className="hidden sm:block">
        <p className="text-sm text-muted">
          {favorites.length}件のお気に入り
        </p>
      </div>

      {/* カテゴリフィルタ */}
      {categories.length > 0 && (
        <div className="mt-4 max-w-xs">
          <CategorySelector
            categories={categories}
            selected={selectedCategory}
            onChange={setSelectedCategory}
            placeholder="カテゴリで絞り込む"
          />
        </div>
      )}

      {/* 一覧 */}
      {filtered.length === 0 ? (
        <div className="mt-8">
          <EmptyState hasFilter={selectedCategory.length > 0} />
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
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-sm font-semibold text-slate-400">
          {provider.icon_url ? (
            <Image
              src={provider.icon_url}
              alt={provider.name}
              width={48}
              height={48}
              className="h-12 w-12 object-cover"
            />
          ) : (
            provider.name[0]
          )}
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
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 text-lg font-semibold text-slate-400">
            {provider.icon_url ? (
              <Image
                src={provider.icon_url}
                alt={provider.name}
                width={56}
                height={56}
                className="h-14 w-14 object-cover"
              />
            ) : (
              provider.name[0]
            )}
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
