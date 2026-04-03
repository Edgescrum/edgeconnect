import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BookingButton } from "./booking-button";

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
  const headersList = await headers();
  const ua = headersList.get("user-agent") || "";
  const isLineApp = /\bLine\b/i.test(ua) || /\bLIFF\b/i.test(ua);

  const supabase = await createClient();

  // Database Function で連絡先を含むプロフィールを取得（一括取得不可）
  const { data } = await supabase.rpc("get_provider_profile", {
    p_slug: slug,
  });

  const provider = data as ProviderProfile | null;
  if (!provider) notFound();

  return (
    <main className="min-h-screen bg-background">
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
                  <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{service.name}</p>
                        {service.description && (
                          <p className="mt-1 text-xs text-muted">
                            {service.description}
                          </p>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-lg font-bold">
                          ¥{service.price.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted">
                          {service.duration_min}分
                        </p>
                      </div>
                    </div>
                    <BookingButton slug={slug} serviceId={service.id} isLineApp={isLineApp} />
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

      </div>
    </main>
  );
}
