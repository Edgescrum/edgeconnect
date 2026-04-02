import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileEditForm } from "./profile-edit-form";

export default async function ProfileEditPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.role !== "provider") redirect("/");

  const supabase = await createClient();
  const { data: provider } = await supabase
    .from("providers")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!provider) redirect("/provider/register");

  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 text-2xl font-bold">プロフィール編集</h1>
        <ProfileEditForm provider={provider} />
      </div>
    </main>
  );
}
