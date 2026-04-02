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
    <main className="mx-auto max-w-lg px-4 py-8">
      {/* プロフィールヘッダー */}
      <div className="flex flex-col items-center text-center">
        {provider.icon_url ? (
          <Image
            src={provider.icon_url}
            alt={provider.name || ""}
            width={96}
            height={96}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200 text-2xl text-gray-500">
            {(provider.name || "?")[0]}
          </div>
        )}
        <h1 className="mt-4 text-2xl font-bold">{provider.name}</h1>
        {provider.bio && (
          <p className="mt-2 whitespace-pre-wrap text-gray-600">
            {provider.bio}
          </p>
        )}
      </div>

      {/* サービスメニュー一覧 */}
      {publishedServices.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Menu</h2>
          <ul className="space-y-3">
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
                  className="rounded-lg border p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{service.name}</span>
                    <span className="text-sm text-gray-500">
                      {service.duration_min}min
                    </span>
                  </div>
                  {service.description && (
                    <p className="mt-1 text-sm text-gray-500">
                      {service.description}
                    </p>
                  )}
                  <p className="mt-1 text-right font-semibold">
                    ¥{service.price.toLocaleString()}
                  </p>
                </li>
              )
            )}
          </ul>
        </section>
      )}

      {/* LINE連絡ボタン */}
      {provider.line_contact_url && (
        <div className="mt-8">
          <a
            href={provider.line_contact_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg bg-[#06C755] py-3 text-center font-semibold text-white"
          >
            LINEで連絡する
          </a>
        </div>
      )}
    </main>
  );
}
