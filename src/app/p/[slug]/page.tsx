import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCategoryLabel } from "@/lib/constants/categories";
import { PublicFooter } from "@/components/PublicFooter";
import { resolveUser } from "@/lib/auth/session";
import { ServiceMenuList } from "./service-menu-list";
import { brand } from "@/lib/brand";
import { isFavorited } from "@/lib/actions/favorite";
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
        <div className="bg-gradient-to-b from-accent/10 to-accent/10">
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
          {provider.services.length > 0 && (
            <ServiceMenuList services={provider.services} slug={slug} isLoggedIn={isLoggedIn} />
          )}
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
            {provider.services.length > 0 && (
              <ServiceMenuList services={provider.services} slug={slug} isLoggedIn={isLoggedIn} />
            )}
          </div>
        </div>
      </div>

      <PublicFooter showProviderCta maxWidth="max-w-5xl" />
    </main>
  );
}

/* --- サブコンポーネント --- */

function ProviderIcon({ provider, size, className }: { provider: ProviderProfile; size: number; className?: string }) {
  return provider.icon_url ? (
    <Image
      src={provider.icon_url}
      alt={provider.name || ""}
      width={size}
      height={size}
      className={`object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  ) : (
    <div
      className={`flex items-center justify-center bg-accent font-bold text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {(provider.name || "?")[0]}
    </div>
  );
}

