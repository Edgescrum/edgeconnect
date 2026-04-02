import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BookingFlow } from "./booking-flow";

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
    services: { id: number; name: string; duration_min: number; price: number }[];
  } | null;

  if (!profile) notFound();

  const service = profile.services.find(
    (s) => s.id === parseInt(serviceId, 10)
  );
  if (!service) notFound();

  return (
    <BookingFlow
      providerId={profile.id}
      providerName={profile.name}
      providerSlug={slug}
      service={service}
    />
  );
}
