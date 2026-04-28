import { resolveUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCategories } from "@/lib/constants/categories";
import { ProfileEditForm } from "./profile-edit-form";

export default async function ProfileEditPage() {
  const user = await resolveUser();
  if (!user) redirect("/");
  if (user.role !== "provider") redirect("/");

  const supabase = await createClient();
  const { data: provider } = await supabase
    .from("providers")
    .select("id, slug, name, bio, icon_url, line_contact_url, contact_email, contact_phone, brand_color, category")
    .eq("user_id", user.id)
    .single();

  if (!provider) redirect("/provider/register");

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-8 sm:py-8">
      <div>
        <div className="hidden sm:mb-6 sm:block">
          <h1 className="text-xl font-bold">プロフィール編集</h1>
          <p className="mt-1 text-sm text-muted">名前・紹介文・アイコンを変更</p>
        </div>
        <div className="sm:max-w-2xl">
          <ProfileEditForm provider={provider} categories={await getCategories()} />
        </div>
      </div>
    </main>
  );
}
