import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getCategoryLabel } from "@/lib/constants/categories";

// 60秒キャッシュ（予約が入った時にrevalidatePathで無効化される）
export const revalidate = 60;

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
  const supabase = await createClient();

  // Database Function で連絡先を含むプロフィールを取得（一括取得不可）
  const { data } = await supabase.rpc("get_provider_profile", {
    p_slug: slug,
  });

  const provider = data as ProviderProfile | null;
  if (!provider) notFound();

  const brandColor = provider.brand_color || "#6366f1";
  // accent-bgは10%透明度のブランドカラー
  const brandBg = `color-mix(in srgb, ${brandColor} 10%, transparent)`;

  return (
    <main
      className="min-h-screen bg-background"
      style={{ "--accent": brandColor, "--accent-bg": brandBg, "--accent-light": brandColor } as React.CSSProperties}
    >
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-b from-accent/10 to-accent/10">
        <div className="mx-auto flex max-w-lg items-center px-4 py-3">
          <a
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 active:bg-white/60"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent text-[10px] font-bold text-white">
              E
            </div>
            <span className="text-xs font-semibold text-muted">EdgeConnect</span>
          </a>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-b from-accent/10 to-background px-4 pb-8 pt-4">
        <div className="mx-auto flex max-w-lg flex-col items-center text-center">
          {provider.icon_url ? (
            <Image
              src={provider.icon_url}
              alt={provider.name || ""}
              width={96}
              height={96}
              className="rounded-2xl object-cover shadow-lg"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-accent text-3xl font-bold text-white shadow-lg">
              {(provider.name || "?")[0]}
            </div>
          )}
          <h1 className="mt-5 text-2xl font-bold">{provider.name}</h1>
          {getCategoryLabel(provider.category) && (
            <span
              className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium"
              style={{ backgroundColor: `${brandColor}1a`, color: brandColor }}
            >
              {getCategoryLabel(provider.category)}
            </span>
          )}
          {provider.bio && (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
              {provider.bio}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 pb-8">
        {/* Menu */}
        {provider.services.length > 0 && (
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
              メニュー
            </h2>
            <ul className="space-y-2.5">
              {provider.services.map((service) => (
                <li key={service.id}>
                  <Link
                    href={`/p/${slug}/book/${service.id}`}
                    className="flex items-center justify-between rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border active:scale-[0.99]"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{service.name}</p>
                      {service.description && (
                        <p className="mt-1 text-xs text-muted">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          ¥{service.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted">
                          {service.duration_min}分
                        </p>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-muted">
                        <path d="m9 18 6-6-6-6" />
                      </svg>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

      </div>
    </main>
  );
}
