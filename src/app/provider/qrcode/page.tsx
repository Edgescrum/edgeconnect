import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { QrCodeView } from "./qrcode-view";

export default async function QrCodePage() {
  const user = await getCurrentUser();
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
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold">あなたの予約ページ</h1>
          <p className="mt-2 text-sm text-muted">
            このQRコードをお客さまに共有しましょう
          </p>
        </div>
        <QrCodeView url={profileUrl} slug={provider.slug} name={provider.name || ""} />
      </div>
    </main>
  );
}
