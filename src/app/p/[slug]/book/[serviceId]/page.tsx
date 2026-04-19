import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { resolveUser } from "@/lib/auth/session";
import { BookingFlow } from "./booking-flow";
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
    services: { id: number; name: string; description: string | null; duration_min: number; price: number; custom_fields: { label: string; type: "input" | "textarea"; required: boolean }[] | null }[];
  } | null;

  if (!profile) notFound();

  const service = profile.services.find(
    (s) => s.id === parseInt(serviceId, 10)
  );
  if (!service) notFound();

  const user = await resolveUser();
  if (!user) redirect(`/p/${slug}`);

  return (
    <BookingFlow
      providerId={profile.id}
      providerName={profile.name}
      providerSlug={slug}
      service={service}
      brandColor={profile.brand_color || "#6366f1"}
      isLineFriend={user.isLineFriend}
    />
  );
}
