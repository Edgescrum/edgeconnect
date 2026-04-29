import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { resolveUser } from "@/lib/auth/session";
import { BookingFlow } from "./booking-flow";
import { brand } from "@/lib/brand";
import { isFavorited } from "@/lib/actions/favorite";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; serviceId: string }>;
}): Promise<Metadata> {
  const { slug, serviceId } = await params;
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_provider_profile", { p_slug: slug });
  const profile = data as {
    name: string;
    icon_url: string | null;
    services: { id: number; name: string; duration_min: number; price: number }[];
  } | null;

  if (!profile) return {};

  const service = profile.services.find((s) => s.id === parseInt(serviceId, 10));
  if (!service) return {};

  const title = `${service.name} - ${profile.name}`;
  const description = `¥${service.price.toLocaleString()} / ${service.duration_min}分`;
  const images = profile.icon_url
    ? [{ url: profile.icon_url, width: 256, height: 256 }]
    : [{ url: "/og-default.png", width: 1200, height: 630 }];

  return {
    title,
    description,
    openGraph: { title, description, images },
  };
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string; serviceId: string }>;
}) {
  const { slug, serviceId } = await params;
  const supabase = await createClient();

  // プロフィール+サービス情報取得
  const { data: profileData } = await supabase.rpc("get_provider_profile", {
    p_slug: slug,
  });

  const profile = profileData as {
    id: number;
    slug: string;
    name: string;
    brand_color: string;
    subscription_status: string;
    services: { id: number; name: string; description: string | null; duration_min: number; price: number; custom_fields: { label: string; type: "input" | "textarea"; required: boolean }[] | null }[];
  } | null;

  if (!profile) notFound();

  // 事業主が inactive の場合は予約不可ページを表示
  if (profile.subscription_status === "inactive") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
        <div className="mx-auto max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg
              width="32"
              height="32"
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
          <h1 className="mt-4 text-xl font-bold text-foreground">
            現在予約の受付を停止しています
          </h1>
          <p className="mt-2 text-sm text-muted">
            このサービスは現在新規の予約を受け付けておりません。
          </p>
          <a
            href={`/p/${slug}`}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 active:scale-[0.99]"
          >
            プロフィールページに戻る
          </a>
        </div>
      </main>
    );
  }

  const service = profile.services.find(
    (s) => s.id === parseInt(serviceId, 10)
  );
  if (!service) notFound();

  const user = await resolveUser();
  if (!user) redirect(`/p/${slug}`);

  const favorited = await isFavorited(profile.id);

  return (
    <BookingFlow
      providerId={profile.id}
      providerName={profile.name}
      providerSlug={slug}
      service={service}
      brandColor={profile.brand_color || brand.primary}
      isLineFriend={user.isLineFriend}
      defaultName={user.customerName || ""}
      defaultPhone={user.customerPhone || ""}
      isLoggedIn={true}
      initialFavorited={favorited}
    />
  );
}
