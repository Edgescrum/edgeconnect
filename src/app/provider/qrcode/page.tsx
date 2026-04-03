import { resolveUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { QrCodeView } from "./qrcode-view";

export default async function QrCodePage() {
  const user = await resolveUser();
  if (!user) redirect("/");
  if (user.role !== "provider") redirect("/");

  const supabase = createAdminClient();
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
        <p className="text-center text-sm text-muted">
          このQRコードをお客さまに共有しましょう
        </p>
        <QrCodeView url={profileUrl} slug={provider.slug} name={provider.name || ""} />
      </div>
    </main>
  );
}
