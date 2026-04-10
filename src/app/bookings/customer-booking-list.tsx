"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import Link from "next/link";

interface BookingItem {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  cancelled_by: string | null;
  service: { name: string; price: number } | null;
  provider: { name: string; slug: string } | null;
}

type FilterType = "all" | "today" | "week" | "upcoming";

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "today", label: "今日" },
  { value: "week", label: "今週" },
  { value: "upcoming", label: "今後" },
];

const DAYS = ["日", "月", "火", "水", "木", "金", "土"];

const FILTER_STORAGE_KEY = "edgeconnect_bookings_filter";

export function CustomerBookingList({ bookings }: { bookings: BookingItem[] }) {
  const [filter, setFilterState] = useState<FilterType>(() => {
    if (typeof window === "undefined") return "all";
    const saved = sessionStorage.getItem(FILTER_STORAGE_KEY);
    return (FILTERS.find((f) => f.value === saved)?.value) || "all";
  });

  function setFilter(value: FilterType) {
    setFilterState(value);
    sessionStorage.setItem(FILTER_STORAGE_KEY, value);
  }
  const [visibleCount, setVisibleCount] = useState(20);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const [navigatingId, setNavigatingId] = useState<string | null>(null);
  const handleCardClick = useCallback((id: string) => setNavigatingId(id), []);

  const now = useMemo(() => new Date(), []);
  const todayStart = useMemo(
    () => new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    [now]
  );
  const tomorrowStart = useMemo(
    () => new Date(todayStart.getTime() + 86400000),
    [todayStart]
  );
  const weekEnd = useMemo(
    () => new Date(todayStart.getTime() + 7 * 86400000),
    [todayStart]
  );

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const start = new Date(b.start_at);
      switch (filter) {
        case "today":
          return b.status === "confirmed" && start >= todayStart && start < tomorrowStart;
        case "week":
          return b.status === "confirmed" && start >= todayStart && start < weekEnd;
        case "upcoming":
          return b.status === "confirmed" && start >= now;
        default:
          return true;
      }
    });
  }, [bookings, filter, now, todayStart, tomorrowStart, weekEnd]);

  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const hasMore = visibleCount < filtered.length;

  useEffect(() => setVisibleCount(20), [filter]);

  // 無限スクロール
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisibleCount((c) => c + 20); },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, visibleCount]);

  function toDateKey(dateStr: string) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }

  function formatDateHeader(dateStr: string) {
    const d = new Date(dateStr);
    const todayKey = `${todayStart.getFullYear()}-${todayStart.getMonth()}-${todayStart.getDate()}`;
    const tomorrowKey = `${tomorrowStart.getFullYear()}-${tomorrowStart.getMonth()}-${tomorrowStart.getDate()}`;
    const key = toDateKey(dateStr);
    if (key === todayKey) return "今日";
    if (key === tomorrowKey) return "明日";
    return `${d.getMonth() + 1}/${d.getDate()}（${DAYS[d.getDay()]}）`;
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div>
      {/* フィルタータブ */}
      <div className="sticky top-[49px] z-30 -mx-4 flex gap-1 overflow-x-auto bg-background px-4 py-2">
        <div className="flex gap-1 rounded-xl bg-card p-1 ring-1 ring-border">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.value
                ? "bg-accent text-white"
                : "text-muted active:bg-accent-bg"
            }`}
          >
            {f.label}
          </button>
        ))}
        </div>
      </div>

      {/* 予約リスト */}
      <div className="mt-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <p className="text-4xl">📅</p>
            <p className="mt-3 text-sm text-muted">
              {filter === "all"
                ? "予約はまだありません"
                : "該当する予約がありません"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {(() => {
              let lastDateKey = "";
              return visible.map((booking) => {
                const isCancelled = booking.status === "cancelled";
                const dateKey = toDateKey(booking.start_at);
                const showHeader = dateKey !== lastDateKey;
                lastDateKey = dateKey;

                return (
                  <div key={booking.id}>
                    {showHeader && (
                      <div className="flex items-center gap-2 pb-1 pt-3 first:pt-0">
                        <p className="text-xs font-semibold text-muted">
                          {formatDateHeader(booking.start_at)}
                        </p>
                        <div className="h-px flex-1 bg-border" />
                      </div>
                    )}
                    <Link
                      href={`/bookings/${booking.id}`}
                      onClick={() => handleCardClick(booking.id)}
                      className={`relative block rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border active:scale-[0.99] ${
                        isCancelled ? "opacity-60" : ""
                      } ${navigatingId === booking.id ? "opacity-70" : ""}`}
                    >
                      {navigatingId === booking.id && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-card/80">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                        </div>
                      )}
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs text-muted">
                            {booking.provider?.name}
                          </p>
                          <p className="mt-0.5 font-semibold">
                            {booking.service?.name}
                          </p>
                          <p className="mt-1 text-sm">
                            {formatTime(booking.start_at)}〜
                            {formatTime(booking.end_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          {isCancelled ? (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-muted">
                              キャンセル
                            </span>
                          ) : (
                            <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                              確定
                            </span>
                          )}
                          {booking.service && (
                            <p className="mt-1 text-sm font-bold">
                              ¥{booking.service.price.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  </div>
                );
              });
            })()}
            {hasMore && (
              <div ref={sentinelRef} className="flex justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-accent" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
