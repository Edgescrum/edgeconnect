"use client";

import { useState, useTransition } from "react";
import { toggleFavorite } from "@/lib/actions/favorite";

export function FavoriteButton({
  providerId,
  initialFavorited,
}: {
  providerId: number;
  initialFavorited: boolean;
}) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    // 楽観的UI更新
    setIsFavorited((prev) => !prev);

    startTransition(async () => {
      const result = await toggleFavorite(providerId);
      if (result.success) {
        setIsFavorited(result.isFavorited);
      } else {
        // 失敗時は元に戻す
        setIsFavorited((prev) => !prev);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 shadow-sm backdrop-blur-sm ring-1 ring-black/5 active:scale-95 transition-transform disabled:opacity-50"
      aria-label={isFavorited ? "お気に入りから削除" : "お気に入りに追加"}
    >
      {isFavorited ? (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="#ef4444"
          stroke="#ef4444"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      ) : (
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ca3af"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      )}
    </button>
  );
}
