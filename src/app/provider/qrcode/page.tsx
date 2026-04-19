import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { QrCodeView } from "./qrcode-view";

export default async function QrCodePage() {
  const user = await resolveUser();
  if (!user) redirect("/");
  if (user.role !== "provider") redirect("/");

  const supabase = await createClient();
  const { data: provider } = await supabase
    .from("providers")
    .select("slug, name")
    .eq("user_id", user.id)
    .single();

  if (!provider) redirect("/provider/register");

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID!;
  const profileUrl = `https://liff.line.me/${liffId}?provider=${provider.slug}`;

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-8 sm:py-8">
      {/* モバイル */}
      <div className="mx-auto max-w-sm sm:hidden">
        <p className="text-center text-sm text-muted">
          このQRコードをお客さまに共有しましょう
        </p>
        <QrCodeView url={profileUrl} slug={provider.slug} name={provider.name || ""} />
      </div>
      {/* PC */}
      <div className="mx-auto hidden max-w-3xl sm:block">
        <h1 className="text-xl font-bold">QRコード・シェア</h1>
        <p className="mt-1 text-sm text-muted">お客さまに予約ページを共有しましょう</p>
        <div className="mt-6">
          <QrCodeView url={profileUrl} slug={provider.slug} name={provider.name || ""} />
        </div>
      </div>
    </main>
  );
}
