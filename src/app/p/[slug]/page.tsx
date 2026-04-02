import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import { notFound } from "next/navigation";

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: provider } = await supabase
    .from("providers")
    .select("*, services(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!provider) notFound();

  const publishedServices = (provider.services || []).filter(
    (s: { is_published: boolean }) => s.is_published
  );

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-b from-accent/10 to-background px-4 pb-8 pt-12">
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
        {publishedServices.length > 0 && (
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
              メニュー
            </h2>
            <ul className="space-y-2.5">
              {publishedServices.map(
                (service: {
                  id: number;
                  name: string;
                  description: string | null;
                  duration_min: number;
                  price: number;
                }) => (
                  <li
                    key={service.id}
                    className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-border"
                  >
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
                  </li>
                )
              )}
            </ul>
          </section>
        )}

        {/* Contact */}
        {(provider.line_contact_url || provider.contact_email) && (
          <div className="mt-6 space-y-2.5">
            {provider.line_contact_url && (
              <a
                href={provider.line_contact_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-success py-4 font-semibold text-white shadow-lg shadow-success/25 active:scale-[0.98]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                </svg>
                LINEで連絡する
              </a>
            )}
            {provider.contact_email && (
              <a
                href={`mailto:${provider.contact_email}`}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-card py-4 font-semibold ring-1 ring-border active:scale-[0.98]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                メールで連絡する
              </a>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
