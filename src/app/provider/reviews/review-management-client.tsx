"use client";

import { useState, useTransition } from "react";
import { toggleReviewVisibility, type ProviderReviewItem } from "@/lib/actions/survey";
import { TabFilter } from "@/components/TabFilter";

function StarDisplay({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i <= rating ? "#f59e0b" : "#e5e7eb"}
          stroke="none"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr);
  const days = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}(${days[d.getDay()]})`;
}

function DriverBadge({ label, value }: { label: string; value: number }) {
  const colorMap: Record<number, string> = {
    1: "bg-red-50 text-red-600 border-red-100",
    2: "bg-orange-50 text-orange-600 border-orange-100",
    3: "bg-yellow-50 text-yellow-700 border-yellow-100",
    4: "bg-emerald-50 text-emerald-600 border-emerald-100",
    5: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const cls = colorMap[value] || "bg-gray-50 text-gray-600 border-gray-100";
  return (
    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {label}
      <span className="font-bold">{value}</span>
    </span>
  );
}

export function ReviewManagementClient({ reviews: initialReviews }: { reviews: ProviderReviewItem[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState<"all" | "visible" | "hidden">("all");
  const [isPending, startTransition] = useTransition();

  // 口コミテキストがあり、公開設定かつ表示中のもののみ「公開中」とする
  const hasReviewText = (r: ProviderReviewItem) => !!r.reviewText && r.reviewText.trim() !== "";

  const filteredReviews = reviews.filter((r) => {
    if (filter === "visible") return r.reviewVisible && r.reviewPublic && hasReviewText(r);
    if (filter === "hidden") return !r.reviewVisible || !r.reviewPublic || !hasReviewText(r);
    return true;
  });

  const visibleCount = reviews.filter((r) => r.reviewVisible && r.reviewPublic && hasReviewText(r)).length;
  const hiddenCount = reviews.length - visibleCount;
  const publicReviewCount = reviews.filter((r) => r.reviewPublic && r.reviewText).length;

  function handleToggleVisibility(reviewId: number, currentVisible: boolean) {
    startTransition(async () => {
      const result = await toggleReviewVisibility(reviewId, !currentVisible);
      if (result.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId ? { ...r, reviewVisible: !currentVisible } : r
          )
        );
      }
    });
  }

  if (reviews.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-50">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        </div>
        <p className="text-lg font-semibold">まだ口コミはありません</p>
        <p className="mt-2 max-w-xs text-sm text-muted">
          お客さまがアンケートに回答すると、口コミがここに表示されます
        </p>
      </div>
    );
  }

  const avgCsat = (reviews.reduce((sum, r) => sum + r.csat, 0) / reviews.length).toFixed(1);

  return (
    <div className="mt-4 space-y-5 sm:mt-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
          <div className="flex items-center justify-center gap-1">
            <span className="text-3xl font-bold tracking-tight">{avgCsat}</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#f59e0b" stroke="none" className="mt-0.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <p className="mt-1 text-xs text-muted">平均スコア</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
          <p className="text-3xl font-bold tracking-tight">{reviews.length}</p>
          <p className="mt-1 text-xs text-muted">総回答数</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center shadow-sm">
          <p className="text-3xl font-bold tracking-tight">{publicReviewCount}</p>
          <p className="mt-1 text-xs text-muted">公開口コミ</p>
        </div>
      </div>

      {/* Filter tabs */}
      <TabFilter
        tabs={[
          { key: "all" as const, label: "すべて", count: reviews.length },
          { key: "visible" as const, label: "公開中", count: visibleCount },
          { key: "hidden" as const, label: "非表示", count: hiddenCount },
        ]}
        activeKey={filter}
        onChange={setFilter}
      />

      {/* Review list */}
      {filteredReviews.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-300">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-muted">
            {filter === "visible" && "公開中の口コミはありません"}
            {filter === "hidden" && "非表示の口コミはありません"}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filteredReviews.map((review) => (
          <div
            key={review.id}
            className={`overflow-hidden rounded-2xl border bg-card shadow-sm transition-all ${
              review.reviewVisible
                ? "border-border"
                : "border-gray-200 opacity-60"
            }`}
          >
            {/* Card header */}
            <div className="flex items-center justify-between border-b border-border/50 bg-gray-50/50 px-4 py-3">
              <div className="flex items-center gap-3">
                {/* Avatar placeholder */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                  {(review.customerName || "?")[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold">{review.customerName || "お客さま"}</p>
                  <div className="flex items-center gap-2">
                    {review.serviceName && (
                      <span className="text-xs text-muted">{review.serviceName}</span>
                    )}
                    {review.bookingDate && (
                      <span className="text-xs text-muted">{formatFullDate(review.bookingDate)}</span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-xs text-muted">{formatDate(review.createdAt)}</span>
            </div>

            {/* Card body */}
            <div className="p-4 space-y-3">
              {/* Star rating + CSAT */}
              <div className="flex items-center gap-2">
                <StarDisplay rating={review.csat} size={16} />
                <span className="text-sm font-semibold text-foreground">{review.csat}.0</span>
              </div>

              {/* Driver scores as badges */}
              {(review.driverService != null || review.driverQuality != null || review.driverPrice != null) && (
                <div className="flex flex-wrap gap-1.5">
                  {review.driverService != null && (
                    <DriverBadge label="接客" value={review.driverService} />
                  )}
                  {review.driverQuality != null && (
                    <DriverBadge label="品質" value={review.driverQuality} />
                  )}
                  {review.driverPrice != null && (
                    <DriverBadge label="価格" value={review.driverPrice} />
                  )}
                </div>
              )}

              {/* Comment */}
              {review.comment && (
                <div>
                  <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted">感想</p>
                  <p className="text-sm leading-relaxed text-foreground">{review.comment}</p>
                </div>
              )}

              {/* Review text */}
              {review.reviewText && (
                <div className="rounded-xl bg-accent/5 p-3">
                  <div className="mb-1 flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent">
                      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-accent">
                      口コミ ({review.reviewPublic ? "公開" : "非公開"})
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{review.reviewText}</p>
                </div>
              )}

              {/* Visibility toggle */}
              {review.reviewPublic && review.reviewText && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => handleToggleVisibility(review.id, review.reviewVisible)}
                    disabled={isPending}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      review.reviewVisible
                        ? "bg-gray-100 text-muted hover:bg-gray-200 hover:text-foreground"
                        : "bg-accent text-white hover:bg-accent/90 shadow-sm"
                    }`}
                  >
                    {review.reviewVisible ? (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                        非表示にする
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        表示する
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
