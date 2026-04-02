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
    .select("slug")
    .eq("user_id", user.id)
    .single();

  if (!provider) redirect("/provider/register");

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID!;
  const profileUrl = `https://liff.line.me/${liffId}?provider=${provider.slug}`;

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">URL / QRコード</h1>
      <QrCodeView url={profileUrl} slug={provider.slug} />
    </main>
  );
}
