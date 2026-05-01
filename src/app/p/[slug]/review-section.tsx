import Link from "next/link";

interface ReviewItem {
  id: number;
  csat: number;
  review_text: string;
  created_at: string;
  customer_name: string | null;
}

interface ReviewSummary {
  avg_csat: number | null;
  count: number;
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating}点`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={i <= fullStars ? "#f59e0b" : i === fullStars + 1 && hasHalf ? "url(#half)" : "#e5e7eb"}
          stroke="none"
        >
          {i === fullStars + 1 && hasHalf && (
            <defs>
              <linearGradient id="half">
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#e5e7eb" />
              </linearGradient>
            </defs>
          )}
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

function formatReviewDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export function ReviewSection({
  slug,
  reviewSummary,
  recentReviews,
  brandColor,
}: {
  slug: string;
  reviewSummary: ReviewSummary | null;
  recentReviews: ReviewItem[];
  brandColor: string;
}) {
  const hasReviews = reviewSummary && reviewSummary.count > 0;

  if (!hasReviews) return null;

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">口コミ</h2>
        {reviewSummary.count > 3 && (
          <Link
            href={`/p/${slug}/reviews`}
            className="text-sm font-medium"
            style={{ color: brandColor }}
          >
            すべて見る ({reviewSummary.count}件)
          </Link>
        )}
      </div>

      {/* Summary */}
      <div className="mb-4 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <StarRating rating={reviewSummary.avg_csat || 0} size={18} />
          <span className="text-lg font-bold" style={{ color: brandColor }}>
            {reviewSummary.avg_csat?.toFixed(1) || "-"}
          </span>
        </div>
        <span className="text-sm text-muted">({reviewSummary.count}件の口コミ)</span>
      </div>

      {/* Review cards */}
      <div className="space-y-3">
        {recentReviews.map((review) => (
          <div key={review.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StarRating rating={review.csat} size={12} />
                <span className="text-xs text-muted">
                  {review.customer_name || "お客さま"}
                </span>
              </div>
              <span className="text-xs text-muted">
                {formatReviewDate(review.created_at)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-relaxed">{review.review_text}</p>
          </div>
        ))}
      </div>

      {reviewSummary.count > 3 && (
        <div className="mt-4 text-center">
          <Link
            href={`/p/${slug}/reviews`}
            className="inline-block rounded-xl border border-border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-accent-bg"
          >
            すべての口コミを見る
          </Link>
        </div>
      )}
    </section>
  );
}
