"use client";

import { useState, useTransition } from "react";
import { toggleReviewVisibility, type ProviderReviewItem } from "@/lib/actions/survey";

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={12}
          height={12}
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

export function ReviewManagementClient({ reviews: initialReviews }: { reviews: ProviderReviewItem[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [filter, setFilter] = useState<"all" | "visible" | "hidden">("all");
  const [isPending, startTransition] = useTransition();

  const filteredReviews = reviews.filter((r) => {
    if (filter === "visible") return r.reviewVisible;
    if (filter === "hidden") return !r.reviewVisible;
    return true;
  });

  const visibleCount = reviews.filter((r) => r.reviewVisible).length;
  const hiddenCount = reviews.filter((r) => !r.reviewVisible).length;

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
      <div className="py-16 text-center">
        <p className="text-sm text-muted">まだ口コミはありません</p>
      </div>
    );
  }

  const avgCsat = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.csat, 0) / reviews.length).toFixed(1)
    : "-";

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-6 rounded-xl border border-border bg-card p-4">
        <div className="text-center">
          <p className="text-2xl font-bold">{avgCsat}</p>
          <p className="text-xs text-muted">平均CSAT</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{reviews.length}</p>
          <p className="text-xs text-muted">総回答数</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{reviews.filter((r) => r.reviewPublic && r.reviewText).length}</p>
          <p className="text-xs text-muted">公開口コミ</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {[
          { key: "all" as const, label: `すべて (${reviews.length})` },
          { key: "visible" as const, label: `表示中 (${visibleCount})` },
          { key: "hidden" as const, label: `非表示 (${hiddenCount})` },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === tab.key
                ? "bg-accent text-white"
                : "bg-gray-100 text-muted hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Review list */}
      <div className="space-y-3">
        {filteredReviews.map((review) => (
          <div
            key={review.id}
            className={`rounded-xl border bg-card p-4 ${
              review.reviewVisible ? "border-border" : "border-gray-200 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <StarDisplay rating={review.csat} />
                  <span className="text-xs text-muted">
                    {review.customerName || "お客さま"}
                  </span>
                  <span className="text-xs text-muted">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
                {review.serviceName && (
                  <p className="text-xs text-muted">{review.serviceName}</p>
                )}
                {review.comment && (
                  <p className="text-sm leading-relaxed text-foreground">
                    <span className="text-xs text-muted">感想: </span>
                    {review.comment}
                  </p>
                )}
                {review.reviewText && (
                  <div className="mt-1 rounded-lg bg-accent-bg p-2">
                    <p className="text-xs text-muted">口コミ ({review.reviewPublic ? "公開" : "非公開"}):</p>
                    <p className="text-sm leading-relaxed">{review.reviewText}</p>
                  </div>
                )}
                {/* Driver scores */}
                <div className="flex gap-4 text-xs text-muted">
                  {review.driverService != null && <span>接客: {review.driverService}</span>}
                  {review.driverQuality != null && <span>品質: {review.driverQuality}</span>}
                  {review.driverPrice != null && <span>価格: {review.driverPrice}</span>}
                </div>
              </div>

              {review.reviewPublic && review.reviewText && (
                <button
                  onClick={() => handleToggleVisibility(review.id, review.reviewVisible)}
                  disabled={isPending}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    review.reviewVisible
                      ? "bg-gray-100 text-muted hover:bg-gray-200"
                      : "bg-accent text-white hover:bg-accent-dark"
                  }`}
                >
                  {review.reviewVisible ? "非表示にする" : "表示する"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
