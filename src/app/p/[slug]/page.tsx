import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

import { notFound } from "next/navigation";
import { getCategoryLabel } from "@/lib/constants/categories";
import { PublicFooter } from "@/components/PublicFooter";
import { resolveUser } from "@/lib/auth/session";
import { ServiceMenuList } from "./service-menu-list";
import { ReviewSection } from "./review-section";
import { brand } from "@/lib/brand";
import { isFavorited } from "@/lib/actions/favorite";
import { ProviderAvatar } from "@/components/ProviderAvatar";
import { FavoriteButton } from "./favorite-button";
import type { Metadata } from "next";

export const revalidate = 60;

// Deduplicate the RPC call between generateMetadata and the page component
const getProviderProfile = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_provider_profile", { p_slug: slug });
  return data;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getProviderProfile(slug);
  const provider = data as { name: string | null; bio: string | null; icon_url: string | null } | null;

  if (!provider) return {};

  const title = provider.name || "PeCo";
  const description = provider.bio
    ? provider.bio.slice(0, 80) + (provider.bio.length > 80 ? "..." : "")
    : `${title}の予約ページ`;
  const images = provider.icon_url
    ? [{ url: provider.icon_url, width: 256, height: 256 }]
    : [{ url: "/og-default.png", width: 1200, height: 630 }];

  return {
    title,
    description,
    openGraph: { title: `${title} - PeCo`, description, images },
  };
}

interface ReviewItem {
  id: number;
  csat: number;
  review_text: string;
  created_at: string;
  service_name: string | null;
}

interface ProviderProfile {
  id: number;
  slug: string;
  name: string | null;
  bio: string | null;
  icon_url: string | null;
  line_contact_url: string | null;
  contact_email: string | null;
  brand_color: string;
  category: string | null;
  subscription_status: string;
  review_summary: { avg_csat: number | null; count: number } | null;
  csat_summary: { avg_csat: number | null; count: number } | null;
  recent_reviews: ReviewItem[];
  services: {
    id: number;
    name: string;
    caption: string | null;
    description: string | null;
    duration_min: number;
    price: number;
  }[];
}

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const data = await getProviderProfile(slug);
  const provider = data as ProviderProfile | null;
  if (!provider) notFound();

  const brandColor = provider.brand_color || brand.primary;
  const brandBg = `color-mix(in srgb, ${brandColor} 10%, transparent)`;
  const isInactive = provider.subscription_status === "inactive";

  const user = await resolveUser();
  const isLoggedIn = !!user;
  const favorited = isLoggedIn ? await isFavorited(provider.id) : false;

  const categoryLabel = await getCategoryLabel(provider.category);

  return (
    <main
      className="flex min-h-screen flex-col bg-background"
      style={{ "--accent": brandColor, "--accent-bg": brandBg, "--accent-light": brandColor } as React.CSSProperties}
    >
      {/* --- モバイル版 --- */}
      <div className="flex flex-1 flex-col sm:hidden">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-gradient-to-b from-accent/10 to-accent/10 backdrop-blur-lg">
          <div className="mx-auto flex max-w-lg items-center px-4 py-3">
            <a href="/" className="flex items-center gap-1.5 rounded-lg py-1 active:bg-white/60">
              <img src="/logo.svg" alt="PeCo" className="h-5" />
            </a>
          </div>
        </div>

        {/* Hero */}
        <div className="bg-gradient-to-b from-accent/10 to-background px-4 pb-8 pt-4">
          <div className="mx-auto flex max-w-lg flex-col items-center text-center">
            <div className="relative">
              <ProviderIcon provider={provider} size={96} className="rounded-2xl shadow-lg" />
              {isLoggedIn && (
                <div className="absolute -bottom-2 -right-2">
                  <FavoriteButton providerId={provider.id} initialFavorited={favorited} size="sm" />
                </div>
              )}
            </div>
            <h1 className="mt-5 text-2xl font-bold">{provider.name}</h1>
            {categoryLabel && (
              <span className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: `${brandColor}1a`, color: brandColor }}>
                {categoryLabel}
              </span>
            )}
            {provider.bio && (
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">{provider.bio}</p>
            )}
          </div>
        </div>

        <div className="flex-1 px-4 pb-8">
          {isInactive ? (
            <SuspendedNotice lineContactUrl={provider.line_contact_url} />
          ) : (
            provider.services.length > 0 && (
              <ServiceMenuList services={provider.services} slug={slug} isLoggedIn={isLoggedIn} />
            )
          )}
          <ReviewSection
            slug={slug}
            reviewSummary={provider.review_summary}
            recentReviews={provider.recent_reviews || []}
            brandColor={brandColor}
          />
        </div>
      </div>

      {/* --- PC版 --- */}
      <div className="hidden flex-1 flex-col sm:flex">
        {/* Header */}
        <div className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-8 py-3">
            <a href="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="PeCo" className="h-6" />
            </a>
            <a href="/explore" className="text-sm text-muted hover:text-foreground">事業主を探す</a>
          </div>
        </div>

        {/* Hero + Content */}
        <div className="flex-1">
          {/* Hero Banner */}
          <div className="bg-gradient-to-b from-accent/8 to-background">
            <div className="mx-auto max-w-5xl px-8 py-12">
              <div className="flex items-start gap-8">
                <div className="relative shrink-0">
                  <ProviderIcon provider={provider} size={120} className="rounded-3xl shadow-xl" />
                  {isLoggedIn && (
                    <div className="absolute -bottom-2 -right-2">
                      <FavoriteButton providerId={provider.id} initialFavorited={favorited} />
                    </div>
                  )}
                </div>
                <div className="flex-1 pt-2">
                  <h1 className="text-3xl font-bold">{provider.name}</h1>
                  {categoryLabel && (
                    <span className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: `${brandColor}1a`, color: brandColor }}>
                      {categoryLabel}
                    </span>
                  )}
                  {provider.bio && (
                    <p className="mt-3 max-w-xl whitespace-pre-wrap text-sm leading-relaxed text-muted">{provider.bio}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* メニュー */}
          <div className="mx-auto max-w-5xl px-8 pb-12">
            {isInactive ? (
              <SuspendedNotice lineContactUrl={provider.line_contact_url} />
            ) : (
              provider.services.length > 0 && (
                <ServiceMenuList services={provider.services} slug={slug} isLoggedIn={isLoggedIn} />
              )
            )}
            <ReviewSection
              slug={slug}
              reviewSummary={provider.review_summary}
              recentReviews={provider.recent_reviews || []}
              brandColor={brandColor}
            />
          </div>
        </div>
      </div>

      <PublicFooter showProviderCta maxWidth="max-w-5xl" />
    </main>
  );
}

/* --- サブコンポーネント --- */

function ProviderIcon({ provider, size, className }: { provider: ProviderProfile; size: number; className?: string }) {
  return (
    <ProviderAvatar
      iconUrl={provider.icon_url}
      name={provider.name}
      size={size}
      className={className}
    />
  );
}

function SuspendedNotice({ lineContactUrl }: { lineContactUrl: string | null }) {
  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-2xl bg-gray-50 p-6 text-center ring-1 ring-gray-200">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-gray-400"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>
        <p className="mt-4 text-base font-semibold text-foreground">
          現在予約の受付を停止しています
        </p>
        <p className="mt-2 text-sm text-muted">
          このサービスは現在新規の予約を受け付けておりません。
        </p>
        {lineContactUrl && (
          <a
            href={lineContactUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#06C755] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#05b34d] active:scale-[0.99]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            事業主に直接連絡する
          </a>
        )}
      </div>
    </div>
  );
}

