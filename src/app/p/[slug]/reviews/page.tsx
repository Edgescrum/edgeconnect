import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicFooter } from "@/components/PublicFooter";
import { ChevronLeftIcon } from "@/components/icons";
import { ProviderAvatar } from "@/components/ProviderAvatar";

export const revalidate = 60;

interface ReviewItem {
  id: number;
  csat: number;
  review_text: string;
  created_at: string;
  service_name: string | null;
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
          fill={i <= fullStars ? "#f59e0b" : i === fullStars + 1 && hasHalf ? "url(#half-review)" : "#e5e7eb"}
          stroke="none"
        >
          {i === fullStars + 1 && hasHalf && (
            <defs>
              <linearGradient id="half-review">
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

export default async function ReviewsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();

  // 事業主情報を取得
  const { data: provider } = await supabase
    .from("providers")
    .select("id, name, icon_url, brand_color")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!provider) notFound();

  // 口コミを取得
  const { data: reviewData } = await supabase.rpc("get_provider_reviews", {
    p_slug: slug,
    p_offset: 0,
    p_limit: 100,
  });

  const reviews = (reviewData as ReviewItem[] | null) || [];

  // 平均CSATを計算
  const avgCsat = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.csat, 0) / reviews.length
    : 0;

  const brandColor = provider.brand_color || "#f08c79";
  const brandBg = `color-mix(in srgb, ${brandColor} 10%, transparent)`;

  return (
    <main
      className="flex min-h-screen flex-col bg-background"
      style={{ "--accent": brandColor, "--accent-bg": brandBg } as React.CSSProperties}
    >
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-8">
          <Link href={`/p/${slug}`} className="flex h-8 w-8 items-center justify-center rounded-lg active:bg-accent-bg">
            <ChevronLeftIcon size={20} />
          </Link>
          <h1 className="text-base font-semibold">口コミ</h1>
        </div>
      </header>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8">
        {/* Provider info */}
        <div className="mb-6 flex items-center gap-3">
          <ProviderAvatar name={provider.name} iconUrl={provider.icon_url} size={48} />
          <div>
            <p className="font-semibold">{provider.name}</p>
            <div className="flex items-center gap-2">
              <StarRating rating={avgCsat} size={14} />
              <span className="text-sm font-semibold" style={{ color: brandColor }}>
                {avgCsat.toFixed(1)}
              </span>
              <span className="text-xs text-muted">({reviews.length}件)</span>
            </div>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm text-muted">まだ口コミはありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StarRating rating={review.csat} size={12} />
                    {review.service_name && (
                      <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                        {review.service_name}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted">
                    {formatReviewDate(review.created_at)}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed">{review.review_text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <PublicFooter maxWidth="max-w-5xl" />
    </main>
  );
}
